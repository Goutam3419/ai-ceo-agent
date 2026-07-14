# CEO Agent — Setup Guide

Ye tumhara CEO Agent website ka starter hai. Admin panel pe chat karke agent se
baat kar sakte ho. Neeche step-by-step process hai.

---

## Step 1 — Zaroori software install karo (agar nahi hai)

1. **Node.js** install karo: https://nodejs.org (LTS version le lena)
2. Confirm karne ke liye terminal mein likho:
   ```
   node --version
   npm --version
   ```
   Dono ka version number dikhna chahiye.

---

## Step 2 — Project ko apne computer pe le jao

Is poori folder (`ceo-agent-website`) ko download/copy karo apne computer mein
kisi jagah, jaise Desktop pe.

Terminal kholo aur us folder mein jao:
```
cd path/to/ceo-agent-website
```

---

## Step 3 — Dependencies install karo

```
npm install
```

Ye command Next.js aur baaki sab zaroori packages download kar legi
(`node_modules` folder banega — isko ignore karna, ye normal hai).

---

## Step 4 — Apni Claude API key aur Admin password daalo

1. `.env.example` file ki copy banao aur naam do `.env.local`
2. `.env.local` file kholo aur apni values daalo:
   ```
   ANTHROPIC_API_KEY=sk-ant-apni-actual-key-yahan
   ADMIN_PASSWORD=jo-bhi-password-chaho
   ```
3. Claude key console.anthropic.com se milti hai (Settings → API Keys)
4. `ADMIN_PASSWORD` khud choose karo — ye tumhare admin panel ka lock hai,
   isके bina koi bhi login nahi kar sakta
5. **GitHub Token banana** (isse CEO Agent khud website edit kar payega):
   - GitHub pe jao → apni photo pe click → Settings
   - Neeche "Developer settings" → "Personal access tokens" → "Fine-grained tokens"
   - "Generate new token" pe click karo
   - "Repository access" mein sirf apni CEO Agent wali repo select karo
   - "Permissions" mein "Contents" ko "Read and write" karo
   - Token generate karo aur copy kar lo (sirf ek baar dikhega)
   - `.env.local` mein daalo:
     ```
     GITHUB_TOKEN=ghp_xxxxxxxxxxxx
     GITHUB_REPO=your-username/your-repo-name
     GITHUB_BRANCH=main
     ```

⚠️ `.env.local` file kabhi GitHub pe upload nahi hogi (already `.gitignore` mein
add hai) — ye tumhari secret keys hain, safe rakho.

---

## Step 5 — Website apne computer pe chalao (local test)

```
npm run dev
```

Terminal mein ek link dikhega, kuch aisa: `http://localhost:3000`

Browser mein ye link kholo → phir upar "Enter the Office" pe click karo →
Admin panel khul jaayega, wahan chat kar sakte ho CEO Agent se.

---

## Step 6 — GitHub pe upload karna

1. GitHub pe ek naya repository banao (empty rakhna, README mat add karna)
2. Terminal mein (isi folder ke andar):
   ```
   git init
   git add .
   git commit -m "CEO Agent - first version"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```
   (`YOUR_GITHUB_REPO_URL` ki jagah apni repo ka URL daalo, GitHub pe repo
   banane ke baad ye URL milta hai)

---

## Step 7 — Vercel pe live karna

1. https://vercel.com pe jao, GitHub se login karo
2. "Add New Project" → apni GitHub repo select karo
3. Deploy karne se pehle "Environment Variables" section mein jaake add karo:
   ```
   ANTHROPIC_API_KEY = apni-actual-key
   ADMIN_PASSWORD = apna-chosen-password
   GITHUB_TOKEN = apna-github-token
   GITHUB_REPO = your-username/your-repo-name
   GITHUB_BRANCH = main
   ```
4. "Deploy" pe click karo

Kuch minute mein tumhari website live ho jaayegi, ek link milega jaise
`ceo-agent-xyz.vercel.app` — `/admin` lagake wahan chat kar sakte ho
(jaise: `ceo-agent-xyz.vercel.app/admin`)

---

## Aage kya?

**Website editing tool ab ban chuka hai!** CEO Agent ab khud website ki files
padh sakta hai aur changes propose kar sakta hai (jo tum "Confirm & Push"
button se approve karoge). Isse tum agent ko bol sakte ho jaise:
*"About page bana do"* ya *"homepage pe ek naya section add karo"*.

Iske baad hum ek-ek karke baaki "tools" add karenge:
- Photo/wallpaper generation
- Video generation
- Audio generation

Har tool alag file mein banega, aur CEO Agent ke saath step by step connect
hoga — bilkul jaise website editing tool bana.

---

## Rangoli — Design Tool Setup (Firebase)

Rangoli (`/rangoli`) ek Canva-jaisa template editor hai jisme users apna
account bana ke templates edit/download kar sakte hain. Isके liye **Firebase
Authentication** chahiye:

1. [console.firebase.google.com](https://console.firebase.google.com) pe jao
2. "Add project" → naam do (jaise "rangoli-app") → create karo
3. Left menu → "Build" → "Authentication" → "Get started"
4. "Sign-in method" tab → "Email/Password" → enable karo
5. Project Settings (⚙️ icon) → neeche scroll karo "Your apps" → "</> Web" icon pe click karo
6. App ka naam do, "Register app" karo
7. Jo config code dikhega, usमें se values copy karo `.env.local` mein:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
8. Vercel mein bhi yahi 5 variables add karna mat bhoolna (Environment Variables mein)

**Rangoli abhi ye kar sakta hai:**
- Signup/Login (email-password)
- 4 categories: YouTube Thumbnail, Instagram Post, Instagram Story, Facebook Post
- 8 starter templates (free + premium marked, abhi payment connected nahi)
- Mobile-friendly canvas editor — text, image upload, shapes, background color, delete, download PNG

**Baad mein add hoga:**
- Payment (Razorpay) premium templates ke liye
- "My Designs" — saved designs dekhne ke liye (Firestore database chahiye hogi)
- Zyada templates (8 se 100 tak)

---

## Milestone 2 — CEO Memory & Task Manager Setup

CEO Agent ab Firestore mein apni memory aur tasks save karta hai (sirf
server-side, Admin SDK se — Rangoli wali public keys se bilkul alag).

**Step 1 — Firestore Database enable karo** (agar abhi tak nahi kiya):
1. [console.firebase.google.com](https://console.firebase.google.com) → apna project (`rangoli-app-f042d`)
2. Left menu → "Build" → "Firestore Database" → "Create database"
3. "Start in production mode" select karo (security rules already ban chuki hain, baad mein deploy karenge)
4. Location choose karo (jo bhi nearest ho, jaise `asia-south1`)

**Step 2 — Service Account Key banao** (Admin SDK ke liye):
1. Project Settings (⚙️) → "Service accounts" tab
2. "Generate new private key" pe click karo → confirm karo
3. Ek `.json` file download hogi — usko kholo, poora content copy karo
4. `.env.local` mein `FIREBASE_SERVICE_ACCOUNT_KEY` ke aage puri JSON ek hi line mein paste karo (poori JSON string honi chahiye, quotes ke saath)
5. Vercel mein bhi yahi variable add karo (poori JSON string as value)

**Step 3 — Firestore Security Rules deploy karo:**
1. Firestore Database → "Rules" tab
2. `firestore/firestore.rules` file ka content copy karke paste karo
3. "Publish" karo

⚠️ Ye rules sirf Rangoli/public users ke Firestore access ko govern karti hain.
CEO Memory/Tasks (`ceoMemory`, `ceoTasks` collections) inhi rules se bypass
hoti hain kyunki wo Admin SDK (server-side) se access hoti hain, client se nahi.

**Milestone 2 mein kya naya hai:**
- CEO Agent ab project ke important facts yaad rakh sakta hai (jaise business ka naam, brand rules) — `update_project_memory` tool se
- CEO Agent tasks bana/track kar sakta hai — `manage_task` tool se
- Dashboard tab mein ab Tasks aur Memory dikhti hai
- Chat mein har assistant message ke neeche chhote "activity chips" dikhte hain (jaise "🧠 Yaad rakha: business-name") — ye batata hai agent ne is turn mein kya tools use kiye

**Milestone 2b — Conversation Organization:**
- Chat header mein **📜 History** button — poori conversation list, search, rename, archive, delete
- Har conversation Firestore mein save hoti hai (`ceoConversations` collection) — refresh/logout ke baad bhi safe rehti hai
- "+ New chat" se fresh conversation shuru hoti hai, purani automatically save rehti hai list mein

---

## Koi error aaye to?

Error message copy karke Claude se poochho — exact error paste karna,
turant fix ho jaayega.
