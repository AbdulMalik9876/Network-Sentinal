**✅ Here is the full content of `README.md` file:**


# Network Sentinal

A modern **Real-time Network Monitoring and Threat Detection** System.

![Network Sentinal Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Preview)
<!-- Replace above link with your actual screenshot later -->

## ✨ Features

- **Live Network Monitoring** — Real-time traffic visualization
- **Threat Detection & Alerts** — Detects suspicious activity instantly
- **IP Geolocation** — Shows country, city, and ISP for every connection
- **Beautiful Dashboard** — Clean, responsive React UI with Tailwind CSS
- **Toast Notifications** — Real-time sliding threat alerts
- **Persistent Threat Feed** — Latest threats with detailed view
- **PostgreSQL Database** — All data is stored persistently
- **Traffic Simulator** — Built-in simulator for testing and demo

## 🛠 Tech Stack

- **Backend**: Node.js + Express + TypeScript + Drizzle ORM
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL
- **Logging**: Pino
- **Package Manager**: pnpm

## 📥 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AbdulMalik9876/Network-Sentinal.git
cd Network-Sentinal
```

### 2. Install Dependencies

```bash
npm install -g pnpm
pnpm install
```

### 3. Setup PostgreSQL

- Make sure **PostgreSQL** is installed and running
- Create a database: `network_sentinel`

### 4. Create `.env` File

Create a file named `.env` in the root folder with:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/network_sentinel"
JWT_SECRET=supersecretkey_change_this_in_production
BASE_PATH="/"
```

### 5. Run the Project

#### Easiest Way (Windows):

Double-click the `run.bat` file (if you have it).
or in terminal go to your project folder and type
```
./run.bat
```

#### Manual Way:

**Terminal 1 - Backend**
```powershell
$env:PORT = "5000"
$env:NODE_ENV = "development"
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 - Frontend**
```powershell
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm --filter @workspace/netwatch run dev
```

Open your browser and go to: **http://localhost:5173**

---
