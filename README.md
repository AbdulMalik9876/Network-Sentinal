# Network Sentinal

A modern **Real-time Network Monitoring and Threat Detection** System.

## 📸 Screenshots

### Dashboard
![Dashboard](Images/Dashboard.png)

### Alerts / Threat Feed
![Alerts](Images/Alearts.png)

### Traffic Feed
![Traffic Feed](Images/Traffic_feed.png)

### Devices
![Devices](Images/Devices.png)

### Settings
![Settings](Images/Settings.png)



## ✨ Features

- **Live Network Monitoring** — Real-time traffic visualization
- **Advanced Threat Detection** — Automatically detects suspicious activity
- **Detailed Alert System** — View full alert information with **suggested solutions** for each threat
- **IP Geolocation** — Shows country, city, and ISP for every connection
- **Real-time Toast Notifications** — Sliding alerts in the corner
- **Persistent Threat Feed** — Latest threats with one-click details
- **Email Notifications** (Planned) — Get important alerts directly in your email
- **PostgreSQL Database** — All data is stored persistently
- **Built-in Traffic Simulator** — For testing and demonstration

## 🛠 Tech Stack

- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL

## 📥 Installation & Setup

### Requirements
- **Node.js 22 or newer** (24 recommended) — https://nodejs.org
- **pnpm 10.16 or newer** — `npm install -g pnpm`
- **PostgreSQL 14+** — https://www.postgresql.org/download/
- **Git**

### 1. Clone the repository
```bash
git clone https://github.com/AbdulMalik9876/Network-Sentinal.git
cd Network-Sentinal
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Create the database
Make sure PostgreSQL is running, then create an empty database called `network_sentinel`:
```bash
psql -U postgres -c "CREATE DATABASE network_sentinel;"
```
(Or create it in pgAdmin.)

### 4. Create your `.env` file
Copy the example and put your own PostgreSQL password in it:
```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/network_sentinel
BASE_PATH="/"
```
> ⚠️ `.env` holds your passwords. It is in `.gitignore` — never commit it.

### 5. Create the tables
```bash
pnpm --filter @workspace/db run push
```

### 6. Run the project
Open **two terminals** in the project folder.

**Terminal 1 — API server (port 5000):**
```bash
pnpm --filter @workspace/api-server run dev
```
On first start it fills the database with demo data and then simulates new traffic every 5 seconds.

**Terminal 2 — Website (port 5173):**
```bash
pnpm --filter @workspace/netwatch run dev
```

Open **http://localhost:5173** in your browser. The website forwards `/api` requests to the API server on port 5000 automatically.

### Troubleshooting
| Problem | Fix |
|---|---|
| `DATABASE_URL must be set` | `.env` is missing or not in the project root folder (step 4). |
| `relation "..." does not exist` | You skipped step 5 — run the `db push` command. |
| Pages load but show no data | Terminal 1 (API server) isn't running, or it isn't on port 5000. |
| `password authentication failed` | Wrong password in `DATABASE_URL`. |

---

## 🚀 Deploying online (free: Vercel + Neon)

Everything runs on one Vercel project: the website is static and the API runs as a Vercel function (`api/index.mjs`). There is no always-on server, so instead of a timer the API "catches up" on each request and adds the demo traffic for the time that passed.

1. Create a free PostgreSQL database on **[Neon](https://neon.tech)** and copy its pooled connection string.
2. Create the tables once from your PC: put the string in `.env` as `DATABASE_URL` (and the direct one as `DATABASE_URL_UNPOOLED`), then run `pnpm --filter @workspace/db run push`.
3. On **[Vercel](https://vercel.com)** import this repo, leave **Root Directory** as `./` (the root `vercel.json` does the rest) and add the environment variable `DATABASE_URL`.
4. Deploy. The first request fills an empty database with 48 hours of demo data.

To start the demo data over: `cd artifacts/api-server && npm run build && npm run reset-demo`.

---

## 📁 Project structure
```
api/index.mjs      Vercel function wrapping the API
artifacts/
  api-server/      Express API (routes, traffic simulator, port scan)
  netwatch/        React website
  mockup-sandbox/  UI design playground (not deployed)
lib/
  db/              Database schema (Drizzle ORM)
  api-spec/        OpenAPI spec
  api-client-react/, api-zod/  Generated API client & validators
```
