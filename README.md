# 🎫 IEEE Attend — QR Attendance & Certificate Management System

A full-stack event management platform built for IEEE BVIMR that handles QR-based attendance marking and on-the-spot digital certificate generation — used live at real college events including the IEEE Delhi Section Golden Jubilee Celebration event at our college IEEE Branch.

> ⚠️ **Note:** This is a role-based system. The dashboard is accessible only to authorized admins. A demo walkthrough is available below.

---

## ✨ Features

- 📲 **QR Code Generation** — Unique QR codes generated per participant per event
- 📝 **Custom Feedback Form** — Participants fill an event feedback / info form after scanning QR
- 🎓 **Instant Certificate Generation** — Digital certificate auto-generated on form submission using jsPDF
- 📥 **Excel Export** — Admin can export all form responses and attendance data to Excel
- 🔐 **Role-Based Access Control** — Admin-only dashboard; participants access via secure QR links
- 📊 **Event Dashboard** — View attendance stats, participant responses, and manage events
- 🗄️ **Supabase Backend** — Real-time database with Row Level Security (RLS)

---
<img width="1865" height="897" alt="image" src="https://github.com/user-attachments/assets/347e7de0-31d2-43c3-ae72-db457f5cff22" />
<img width="1871" height="897" alt="image" src="https://github.com/user-attachments/assets/8231ca7a-4e01-4e61-9486-fcc2c7253d36" />
<img width="1515" height="888" alt="image" src="https://github.com/user-attachments/assets/a153ba07-e7cc-4131-ac4c-c748b854ce03" />

---


## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| PDF Generation | jsPDF |
| Deployment | Vercel |

---

## 📁 Project Structure

```
ieee-events/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route-level pages (Dashboard, Event, Scan, etc.)
│   ├── lib/             # Supabase client, helpers
│   └── main.jsx         # App entry point
├── createAdmin.js       # Script to manually provision admin users
├── index.html
├── vite.config.js
└── vercel.json          # Vercel deployment config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Supabase project with Auth enabled

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Ipshitasethi/ieee-events.git
cd ieee-events
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Provision an admin user**
```bash
node createAdmin.js
```

5. **Run locally**
```bash
npm run dev
```

---

## 🔐 Access & Roles

This system uses role-based access control:

| Role | Access |
|------|--------|
| **Admin** | Full dashboard — create events, build forms, view responses, export to Excel, manage participants |
| **Participant** | Scan QR → fill feedback form → submit → get certificate instantly |

Admin accounts are provisioned manually via `createAdmin.js`. There is no self-signup for admin roles by design.

---

## 🎯 How It Works

```
Admin creates event + sets up feedback/info form
       ↓
Participants registered → unique QR generated per participant
       ↓
At event: Participant scans QR
       ↓
Feedback / info form opens → participant fills and submits
       ↓
Attendance marked in Supabase in real-time
       ↓
Certificate auto-generated on the spot (jsPDF) — ready to download instantly
       ↓
Admin exports all responses + attendance data to Excel
```

---

## 🏛️ Used In Production

This system was deployed and used live at:
- **WebCraft & FrameTheChange** — IEEE Delhi Section Golden Jubilee Double-Feature Event
- Multiple IEEE BVIMR Student Branch events

---

## 📬 Contact

**Ipshita Sethi**  
[GitHub](https://github.com/Ipshitasethi) · [LinkedIn](https://www.linkedin.com/in/ipshita-sethi)
