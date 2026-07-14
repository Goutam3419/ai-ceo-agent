import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { readRepoFile } from "@/lib/github";
import { buildMemoryContext, setMemory } from "@/lib/ceo-memory";
import { buildTaskContext, createTask, updateTaskStatus, listTasks } from "@/lib/ceo-tasks";

// ============================================================
// CEO AGENT - Brain (server-side, keys kabhi browser mein nahi jaati)
// ============================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CEO_SYSTEM_PROMPT = `Tum "CEO Agent" ho — ek smart, dependable executive jo apne business
ke owner (jo isse baat kar raha hai) ke liye kaam karta hai. Owner tumhara boss hai,
tum uski team ke liye kaam delegate/coordinate karte ho.

## Tumhara role
Tum ek company ke CEO ki tarah sochte ho: practical, clear-headed, aur action-oriented.
Owner tumse kaam maangega — kabhi advice, kabhi content, kabhi koi cheez generate
karne ko. Tumhara kaam hai samajhna ki kya chahiye, aur best tareeke se help karna.

## Tone/Personality
- Warm aur friendly ho, lekin capable aur confident bhi — jaise ek trusted colleague
- Hinglish mein comfortably baat karo agar owner usी tarah baat kare
- Seedhe, practical jawab do — lambi lecture mat do jab tak zaroorat na ho

## Website editing ability (NAYA — tumhare paas ab ye power hai)
Tumhare paas do tools hain:
1. read_website_file — website ki koi file padhne ke liye (safe, turant chalta hai)
2. propose_website_change — website mein change karne ka PROPOSAL banane ke liye

IMPORTANT — Public website ka location:
Owner ki "public website" (jo customers/visitors dekhenge — homepage, about,
services, waगैरह) HAMESHA is folder ke andar honi chahiye: app/site/
- Homepage: app/site/page.tsx
- Koi aur page (jaise About): app/site/about/page.tsx
- Har public page mein 'import PublicChatWidget from "@/components/PublicChatWidget"'
  karke component ko page ke andar '<PublicChatWidget />' add karo — isse har
  page pe visitors ke liye chat button dikhega
- Isse owner ke Dashboard mein "Website" card hamesha /site pe link karega
  aur wahi latest website dikhayega
- app/admin, app/login, app/api, app/rangoli ko KABHI mat chhedo — ye system
  ke apne zaroori parts hain, sirf app/site/ ke andar hi public website banao

IMPORTANT: propose_website_change sirf ek "proposal" banata hai — ye seedha
GitHub pe push NAHI hota. Owner ko UI mein ek "Confirm & Push" button dikhega,
aur tabhi asli change hoga jab owner khud us button ko dabayega. Isliye:
- Change karne se pehle, agar zaroorat ho to pehle read_website_file se
  current file dekh lo (blind edit mat karo)
- Proposal banate waqt, ek chhoti, clear commit_message do (jaise
  "Added new About section to homepage")
- Apne text response mein owner ko simple bhasha mein batao ki tumne kya
  change propose kiya hai aur wo confirm kar sakta hai

## Abhi ke baaki capabilities
Photo/video/audio generation abhi connect nahi hui hain. Agar owner ye maange,
imaandari se batao ki ye tools abhi add nahi hue, feature jald aayega.

## Category tags
Kabhi kabhi owner ke message se pehle ek chhota tag aayega jaise
"[Owner ne 'Image' option select kiya hai...]" — isse samjho owner kis type
ka output chahta hai.

## Project Memory & Tasks (NAYA)
Tumhare paas ab do naye tools hain:
1. update_project_memory — kisi important cheez ko yaad rakhne ke liye
   (jaise project ka goal, brand identity, koi rule jo owner ne bataya).
   Isse baad ki conversations mein bhi ye info tumhare paas rahegi.
2. manage_task — task create karne ya uska status update karne ke liye
   (jaise "todo", "in-progress", "done"). Owner se koi kaam ka commitment
   milte hi, ek task bana do taaki track ho sake.

Jab bhi owner koi zaroori project-fact bataye (jaise "mera business ek
bakery hai" ya "hamesha Hinglish mein professional tone rakhna"), usko
update_project_memory se save kar lo — dobara pucha nahi jayega.

## Kya nahi karna
- Fake capabilities ka dawa mat karo
- Bahut lamba jawab mat do jab short kaafi ho
- Bina soche-samjhe poori website ek saath change karne ki koshish mat karo —
  chhote, clear changes propose karo`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  category?: "image" | "video" | "code" | "blog";
}

const categoryNote: Record<string, string> = {
  image: "[Owner ne 'Image' option select kiya hai — wo photo/wallpaper/image se related kaam maang raha hai]",
  video: "[Owner ne 'Video' option select kiya hai — wo video generation se related kaam maang raha hai]",
  code: "[Owner ne 'Coding' option select kiya hai — wo code/website se related kaam maang raha hai]",
  blog: "[Owner ne 'Blogging' option select kiya hai — wo blog/content likhne se related kaam maang raha hai]",
};

// Claude ko diye jaane wale tools ki definition
const tools: Anthropic.Tool[] = [
  {
    name: "read_website_file",
    description:
      "Website repo ki koi file ka current content padhta hai. Edit karne se pehle isse current content dekh lo.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File ka path repo ke andar, jaise 'app/page.tsx'",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "propose_website_change",
    description:
      "Website mein ek file add/edit karne ka proposal banata hai. Ye seedha push NAHI karta — owner ko confirm karna padega UI mein.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File ka path jo add/edit karni hai, jaise 'app/about/page.tsx'",
        },
        content: {
          type: "string",
          description: "Poora naya file content",
        },
        commit_message: {
          type: "string",
          description: "Chhota, clear commit message is change ke baare mein",
        },
        explanation: {
          type: "string",
          description: "Owner ke liye simple bhasha mein 1-2 line ka explanation ki ye change kya karega",
        },
      },
      required: ["path", "content", "commit_message", "explanation"],
    },
  },
  {
    name: "update_project_memory",
    description:
      "Kisi important project-fact ko yaad rakhne ke liye save karta hai (jaise business ka naam, brand rules, goals). Baad ki conversations mein ye automatically context mein aa jaayega.",
    input_schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Chhota label jaise 'business-name', 'brand-tone', 'goal'",
        },
        content: {
          type: "string",
          description: "Yaad rakhne wali baat",
        },
      },
      required: ["key", "content"],
    },
  },
  {
    name: "manage_task",
    description: "Task banata hai ya uska status update karta hai.",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "update_status", "list"],
        },
        title: { type: "string", description: "Task ka title (create ke liye)" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        task_id: { type: "string", description: "update_status ke liye zaroori" },
        status: { type: "string", enum: ["todo", "in-progress", "done"] },
      },
      required: ["action"],
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array chahiye request body mein" },
        { status: 400 }
      );
    }

    const conversation: Anthropic.MessageParam[] = messages.map((m) => {
      if (m.role === "user" && m.category && categoryNote[m.category]) {
        return { role: m.role, content: `${categoryNote[m.category]}\n${m.content}` };
      }
      return { role: m.role, content: m.content };
    });

    // CEO Memory + Task context injected fresh every request — this is
    // how the agent "remembers" across separate conversations, since
    // conversation history itself isn't persisted yet.
    const [memoryContext, taskContext] = await Promise.all([
      buildMemoryContext(),
      buildTaskContext(),
    ]);
    const systemPromptWithMemory = CEO_SYSTEM_PROMPT + memoryContext + taskContext;

    let pendingChange: {
      path: string;
      content: string;
      commitMessage: string;
      explanation: string;
    } | null = null;

    // Lightweight "thinking panel" data — logs which tools were used
    // this turn, without exposing raw internal reasoning.
    const activity: { tool: string; label: string }[] = [];

    let finalText = "";
    const MAX_TURNS = 5;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        system: systemPromptWithMemory,
        messages: conversation,
        tools,
      });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text"
      );
      finalText = textBlocks.map((b) => b.text).join("\n");

      if (toolUseBlocks.length === 0) {
        // Agent ne final jawab de diya, tool call nahi kiya — loop khatam
        break;
      }

      // Assistant ka tool-use wala message conversation mein add karo
      conversation.push({ role: "assistant", content: response.content });

      // Har tool call ko execute karo aur result wapas bhejo
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === "read_website_file") {
          const { path } = toolUse.input as { path: string };
          activity.push({ tool: "read_website_file", label: `📄 ${path} padha` });
          try {
            const file = await readRepoFile(path);
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: file.exists
                ? file.content ?? ""
                : `File "${path}" abhi exist nahi karti repo mein.`,
            });
          } catch (e) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: `Error file padhne mein: ${e instanceof Error ? e.message : "unknown"}`,
              is_error: true,
            });
          }
        } else if (toolUse.name === "propose_website_change") {
          const input = toolUse.input as {
            path: string;
            content: string;
            commit_message: string;
            explanation: string;
          };
          activity.push({ tool: "propose_website_change", label: `✏️ ${input.path} ka badlaav propose kiya` });
          pendingChange = {
            path: input.path,
            content: input.content,
            commitMessage: input.commit_message,
            explanation: input.explanation,
          };
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content:
              "Proposal note kar liya gaya hai. Owner ko UI mein confirm karne ke liye dikhaya jaayega.",
          });
        } else if (toolUse.name === "update_project_memory") {
          const input = toolUse.input as { key: string; content: string };
          activity.push({ tool: "update_project_memory", label: `🧠 Yaad rakha: ${input.key}` });
          try {
            await setMemory(input.key, input.content);
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: "Memory save ho gayi.",
            });
          } catch (e) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: `Memory save nahi ho payi: ${e instanceof Error ? e.message : "unknown"}`,
              is_error: true,
            });
          }
        } else if (toolUse.name === "manage_task") {
          const input = toolUse.input as {
            action: "create" | "update_status" | "list";
            title?: string;
            priority?: "low" | "medium" | "high";
            task_id?: string;
            status?: "todo" | "in-progress" | "done";
          };
          try {
            if (input.action === "create" && input.title) {
              const task = await createTask(input.title, input.priority, undefined);
              activity.push({ tool: "manage_task", label: `📋 Task banaya: ${input.title}` });
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: `Task ban gaya, id: ${task.id}`,
              });
            } else if (input.action === "update_status" && input.task_id && input.status) {
              await updateTaskStatus(input.task_id, input.status);
              activity.push({ tool: "manage_task", label: `📋 Task status: ${input.status}` });
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: "Task update ho gaya.",
              });
            } else if (input.action === "list") {
              const tasks = await listTasks();
              activity.push({ tool: "manage_task", label: `📋 Tasks dekhe` });
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify(tasks.map((t) => ({ id: t.id, title: t.title, status: t.status }))),
              });
            } else {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: "Invalid task action/parameters.",
                is_error: true,
              });
            }
          } catch (e) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: `Task action fail: ${e instanceof Error ? e.message : "unknown"}`,
              is_error: true,
            });
          }
        }
      }

      conversation.push({ role: "user", content: toolResults });
    }

    return NextResponse.json({ reply: finalText, pendingChange, activity });
  } catch (err: unknown) {
    console.error("CEO Agent error:", err);
    const message =
      err instanceof Error ? err.message : "Kuch galat ho gaya agent se baat karte waqt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
