# Populist Discourse Observatory

**POPULIST-GAMEMODE** Jean Monnet Module (Grant No. 101238497)  
Babeș-Bolyai University, Cluj-Napoca

---

## What is this?

This is the interactive research platform (the "Populist Discourse Observatory") required by the POPULIST-GAMEMODE project. It allows students to submit fact-checking analyses of populist claims about the EU, browse existing analyses, and compete on a gamified leaderboard.

The app works in two modes:
- **Demo Mode** — runs with sample data, no setup needed (good for previewing)
- **Live Mode** — connected to Supabase database for real data persistence

---

## DEPLOYMENT GUIDE (Step by Step)

### Prerequisites
- A computer with internet access
- A GitHub account (free): https://github.com/signup
- No coding knowledge required — just copy/paste

---

### Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Repository name: `populist-observatory`
3. Set it to **Public**
4. Click **Create repository**
5. Upload ALL the files from this project folder to the repository:
   - Click "uploading an existing file"
   - Drag and drop the entire content of this folder
   - Click "Commit changes"

**Important:** Maintain the folder structure:
```
populist-observatory/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    └── supabase.js
```

---

### Step 2: Deploy to Vercel (Free)

1. Go to https://vercel.com and click "Sign Up"
2. Sign up with your **GitHub account**
3. Click "Add New..." → "Project"
4. Find and select your `populist-observatory` repository
5. Vercel auto-detects it as a Vite project — leave all settings as default
6. Click **Deploy**
7. Wait 1-2 minutes. Your site is now live at: `populist-observatory.vercel.app`

**The site now works in Demo Mode with sample data.**

---

### Step 3: Set Up the Database (Supabase — Free)

This step enables real data persistence (student submissions, leaderboard).

1. Go to https://supabase.com and create a free account
2. Click "New Project"
   - Organization: your personal org
   - Project name: `populist-observatory`
   - Database password: choose something secure (you won't need it often)
   - Region: **Central EU (Frankfurt)** (closest to Cluj)
   - Click "Create new project" — wait 2 minutes
3. Once ready, go to **SQL Editor** (left sidebar)
4. Click "New query"
5. Copy-paste the ENTIRE content of `supabase-schema.sql` into the editor
6. Click **Run** (or Ctrl+Enter)
7. You should see "Success" — your database is ready with sample data

---

### Step 4: Connect Vercel to Supabase

1. In Supabase, go to **Settings** → **API** (left sidebar)
2. Copy two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon / public** key (a long string starting with `eyJ...`)
3. In Vercel, go to your project → **Settings** → **Environment Variables**
4. Add two variables:
   - Name: `VITE_SUPABASE_URL` → Value: paste the Project URL
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: paste the anon key
5. Go to **Deployments** tab → click the "..." menu on the latest deployment → **Redeploy**
6. Wait 1 minute. Your site now uses real data!

**The "Demo Mode" banner at the top should disappear.**

---

### Step 5 (Optional): Custom Domain

To use a subdomain like `observatory.populistgamemode.com`:

1. In Vercel: Project → Settings → Domains → Add `observatory.populistgamemode.com`
2. In your domain registrar (where you manage populistgamemode.com):
   - Add a CNAME record: `observatory` → `cname.vercel-dns.com`
3. Wait 5-30 minutes for DNS propagation

If populistgamemode.com is on WordPress.com, you may need to manage DNS through WordPress.com's domain settings or transfer the domain to a registrar like Cloudflare (free) for more control.

---

### Step 6: Link from WordPress Site

On your WordPress site (populistgamemode.com), edit the Observatory page:
1. Go to Dashboard → Pages → Populist Discourse Observatory
2. Add a prominent button/link:
   ```
   [Access the Observatory →](https://observatory.populistgamemode.com)
   ```
   or if using the Vercel URL:
   ```
   [Access the Observatory →](https://populist-observatory.vercel.app)
   ```

---

## ADMINISTRATION

### Approving Student Submissions

When students submit analyses, they go to `status: pending`. To approve them:

1. Go to Supabase Dashboard → Table Editor → `analyses`
2. Find rows with `status = pending`
3. Review the content
4. Change `status` to `approved` and assign `points` (20-60)
5. The analysis will immediately appear on the public site

### Awarding Badges

1. Go to Table Editor → `badges`
2. Click "Insert row"
3. Fill in `author_name` (must match exactly) and `badge_name`
4. Available badge names: `Fact-Checker Pro`, `EU Expert`, `Top Contributor`, `Migration Specialist`, `Budget Analyst`, `Governance Expert`, `Rising Star`, `Newcomer`

### Monitoring

The leaderboard updates automatically based on approved analyses and their points.

---

## TECHNICAL NOTES

- **Framework:** React 18 + Vite + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (serverless)
- **Cost:** €0 (all services on free tier)
- **Maintenance:** Supabase free tier includes 500MB storage and 50,000 monthly requests — more than sufficient for this project's scale

---

## FILES

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main application (all pages and components) |
| `src/supabase.js` | Database connection config |
| `supabase-schema.sql` | Database setup script (run once) |
| `package.json` | Project dependencies |
| `vite.config.js` | Build configuration |
| `tailwind.config.js` | CSS framework config |

---

## EU FUNDING ACKNOWLEDGEMENT

Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the European Education and Culture Executive Agency (EACEA). Neither the European Union nor EACEA can be held responsible for them.

Grant No. 101238497 | ERASMUS-JMO-2025-HEI-TCH-RSCH
