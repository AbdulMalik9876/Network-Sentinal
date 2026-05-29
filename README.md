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

### 3. Setup Database
- Make sure **PostgreSQL** is installed and running
- Create a database named `network_sentinel`

### 4. Create `.env` file
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/network_sentinel"
JWT_SECRET=supersecretkey_change_this_in_production
BASE_PATH="/"
```

### 5. Run the Project

**Terminal 1 (Backend):**
```powershell
$env:PORT = "5000"
$env:NODE_ENV = "development"
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 (Frontend):**
```powershell
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm --filter @workspace/netwatch run dev
```

Open your browser and go to: **http://localhost:5173**

---
