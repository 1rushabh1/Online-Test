# ExamPortal — Full-Stack Online Examination System

A production-ready exam platform built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **NextAuth**, and **PostgreSQL**.

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | Next.js 14 (Pages Router), React 18 |
| Styling      | Tailwind CSS 3                    |
| Auth         | NextAuth v4 (JWT + Credentials)   |
| Backend      | Next.js API Routes                |
| Database     | PostgreSQL (via `pg` driver)      |
| Language     | TypeScript                        |

---

## Features

- **Auth**: Register / Login with role separation (Admin / Test Taker)
- **Admin**: Create tests with title, description, duration; add MCQ and Subjective questions; manage topic tags, keywords, marks; publish/unpublish tests; review all submissions
- **Test Taking**: Distraction-free exam UI; countdown timer; question palette with answered/unanswered tracking; MCQ single-select; subjective free-text; submit confirmation modal
- **Evaluation Engine**: Auto-score MCQs on submission; keyword-based scoring for subjective answers
- **Results**: Score summary with percentage; MCQ breakdown (correct/wrong/skipped); subjective keyword match review; admin full review with student responses

---

## Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **PostgreSQL** v13 or higher — [Download](https://www.postgresql.org/download/)
- **npm** v9+ (comes with Node.js)

---

## Step-by-Step Setup

### Step 1 — Install PostgreSQL and create a database user

If you just installed PostgreSQL, it creates a default `postgres` superuser.

**On macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
psql postgres
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql
```

**On Windows:**
Download and run the installer from https://www.postgresql.org/download/windows/
Then open "SQL Shell (psql)" from the Start Menu.

Once inside psql, optionally set a password for the postgres user:
```sql
ALTER USER postgres PASSWORD 'yourpassword';
\q
```

---

### Step 2 — Clone / Copy the project

If you downloaded this as a zip, extract it. Otherwise:
```bash
cd ~/projects   # or wherever you keep projects
# (unzip examportal.zip if downloaded, or copy the folder here)
cd examportal
```

---

### Step 3 — Install Node dependencies

```bash
npm install
```

This installs: Next.js, React, NextAuth, bcryptjs, pg, uuid, Tailwind CSS, TypeScript, and all other dependencies.

---

### Step 4 — Configure environment variables

Copy the example file:
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:
```env
# Database connection string
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/examportal

# NextAuth — the URL your app runs on
NEXTAUTH_URL=http://localhost:3000

# NextAuth secret — generate a strong random string:
# Run this in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=paste-your-generated-secret-here
```

**Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

---

### Step 5 — Initialize the database

This script creates the `examportal` database (if it doesn't exist), applies the schema, and creates a default admin user.

```bash
node scripts/init-db.js
```

Expected output:
```
🔌 Connecting to PostgreSQL...
✅ Database "examportal" already exists.
📋 Running schema migrations...
✅ Schema applied successfully.

👤 Default admin user created:
   Email:    admin@examportal.com
   Password: Admin@123
   ⚠️  Change this password after first login!

🎉 Database initialization complete!
   Run: npm run dev
```

If you see a connection error, double-check your `DATABASE_URL` in `.env.local`.

---

### Step 6 — Start the development server

```bash
npm run dev
```

Open your browser at: **http://localhost:3000**

---

## First-Time Walkthrough

### As Admin

1. Go to http://localhost:3000 — you'll be redirected to the login page
2. Sign in with:
   - Email: `admin@examportal.com`
   - Password: `Admin@123`
3. You'll land on the **Admin Dashboard**
4. Click **"Create New Test"**
5. Fill in title (e.g., "JavaScript Quiz"), description, and duration (e.g., 30 minutes)
6. Click **"Create Test & Add Questions →"**
7. On the test detail page, click **"+ Add Question"**
   - Select **Multiple Choice (MCQ)**
   - Type your question
   - Fill in 4 options, click the radio button next to the correct answer
   - Add topic tags (optional), set marks
   - Click **"Add Question"**
8. Add a **Subjective** question:
   - Select **Subjective (Text)**
   - Type your question
   - Add scoring keywords separated by commas (e.g., "variable, function, scope")
   - Click **"Add Question"**
9. Click **"Publish"** to make the test available to students

### As Test Taker

1. Click **Sign out** in the top bar
2. Go to http://localhost:3000/auth/register
3. Create a new account (role defaults to Test Taker)
4. Sign in with your new account
5. You'll see the **Dashboard** with available tests
6. Click **"Start Test"** on any published test
7. Read instructions and click **"Begin Test →"**
8. Answer questions using the exam interface:
   - Click options for MCQs
   - Type in the text area for subjective questions
   - Use the question palette (right sidebar) to jump between questions
   - Watch the countdown timer in the top bar
9. Click **"Submit Test"** → confirm → view your results

---

## Project Structure

```
examportal/
├── scripts/
│   ├── init-db.js          # Database initialization script
│   └── schema.sql          # PostgreSQL schema
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── QuestionForm.tsx     # MCQ + Subjective question builder
│   │   ├── test/
│   │   │   ├── CountdownTimer.tsx   # Live countdown with warning colors
│   │   │   └── QuestionPalette.tsx  # Question navigator grid
│   │   └── ui/
│   │       ├── Layout.tsx           # App shell with nav
│   │       └── index.tsx            # Button, Input, Card, Badge, Alert, etc.
│   ├── lib/
│   │   └── db.ts                    # PostgreSQL connection pool
│   ├── pages/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth].ts  # NextAuth config
│   │   │   │   └── register.ts       # User registration
│   │   │   ├── tests/
│   │   │   │   ├── index.ts          # List + create tests
│   │   │   │   ├── [id].ts           # Get/update/delete test
│   │   │   │   └── [id]/
│   │   │   │       ├── questions.ts  # Add/list questions
│   │   │   │       ├── questions/[qid].ts  # Edit/delete question
│   │   │   │       └── start.ts      # Start or resume attempt
│   │   │   └── attempts/
│   │   │       ├── index.ts          # List attempts
│   │   │       └── [id]/
│   │   │           ├── answers.ts    # Save/get answers
│   │   │           ├── submit.ts     # Submit + evaluate
│   │   │           └── result.ts     # Fetch results
│   │   ├── admin/
│   │   │   ├── dashboard.tsx
│   │   │   ├── tests/
│   │   │   │   ├── index.tsx         # Tests list
│   │   │   │   ├── new.tsx           # Create test
│   │   │   │   └── [id].tsx          # Edit test + manage questions
│   │   │   └── attempts/
│   │   │       ├── index.tsx         # All submissions table
│   │   │       └── [id].tsx          # Detailed answer review
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── attempt/[id].tsx          # Full-screen exam interface
│   │   ├── results/[id].tsx          # Student results page
│   │   ├── tests/
│   │   │   ├── index.tsx             # Browse tests
│   │   │   └── [id].tsx              # Test info + start
│   │   ├── dashboard.tsx             # Student dashboard
│   │   ├── my-results.tsx            # Student results list
│   │   └── index.tsx                 # Root redirect
│   ├── styles/
│   │   └── globals.css               # Tailwind + custom CSS
│   └── types/
│       ├── index.ts                  # All TypeScript interfaces
│       └── next-auth.d.ts            # NextAuth type extension
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Database Schema Overview

```
users           — id, name, email, password_hash, role
tests           — id, title, description, duration_minutes, status, created_by
questions       — id, test_id, question_text, question_type, options (JSONB),
                  correct_option_id, keywords[], topic_tags[], marks, order_index
test_attempts   — id, test_id, user_id, status, started_at, submitted_at,
                  time_remaining_seconds, score breakdown fields
answers         — id, attempt_id, question_id, selected_option_id, answer_text,
                  is_correct, keyword_matches[], marks_awarded
```

---

## Common Issues & Fixes

**"connect ECONNREFUSED 127.0.0.1:5432"**
→ PostgreSQL is not running. Start it:
- macOS: `brew services start postgresql@15`
- Linux: `sudo systemctl start postgresql`
- Windows: Start "PostgreSQL" service from Services panel

**"password authentication failed for user postgres"**
→ Your password in `DATABASE_URL` doesn't match. Reset it in psql:
```sql
ALTER USER postgres PASSWORD 'newpassword';
```
Then update `.env.local`.

**"database examportal does not exist"**
→ Run `node scripts/init-db.js` again.

**"NEXTAUTH_SECRET is not defined"**
→ Make sure `.env.local` exists (not `.env`) and has `NEXTAUTH_SECRET=...` set.

**Next.js build errors about types**
→ Run `npm install` again to ensure all type packages are installed.

---

## Production Build

```bash
npm run build
npm start
```

For production, also set:
- `NEXTAUTH_URL` to your actual domain
- Use a strong random `NEXTAUTH_SECRET`
- Use a managed PostgreSQL service (e.g., Supabase, Neon, Railway, AWS RDS)

---

## License

MIT — free to use and modify.
