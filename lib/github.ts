// Ye file GitHub API se baat karti hai — CEO Agent ki "haath" hai jisse
// wo apni website ki files padh/likh sakta hai.

const GITHUB_API = "https://api.github.com";

function getRepoConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // format: "username/repo-name"
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    throw new Error(
      "GITHUB_TOKEN ya GITHUB_REPO set nahi hai. Vercel/​.env.local mein add karo."
    );
  }
  return { token, repo, branch };
}

export async function readRepoFile(path: string) {
  const { token, repo, branch } = getRepoConfig();

  const res = await fetch(
    `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (res.status === 404) {
    return { exists: false, content: null, sha: null };
  }
  if (!res.ok) {
    throw new Error(`GitHub se file padhne mein error: ${res.status}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { exists: true, content, sha: data.sha as string };
}

export async function writeRepoFile(
  path: string,
  content: string,
  commitMessage: string
) {
  const { token, repo, branch } = getRepoConfig();

  // Pehle check karo file already hai to uska "sha" chahiye hoga update ke liye
  const existing = await readRepoFile(path);

  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch,
      ...(existing.exists ? { sha: existing.sha } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub pe push karne mein error: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return {
    commitUrl: data.commit?.html_url as string | undefined,
    contentUrl: data.content?.html_url as string | undefined,
  };
}
