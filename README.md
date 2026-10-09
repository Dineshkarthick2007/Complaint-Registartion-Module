# 🏢 HostelCare - Complaint & Maintenance Management System

A professional, full-featured web application for hostel students and wardens to register, manage, and track maintenance complaints in real time using **HTML5, Modern CSS, Vanilla JavaScript, InstantDB, and n8n AI Assistant**.

---

## 🌟 Key Features

### 👨‍🎓 Student Portal
- **Dual-Role Authentication**: Dedicated student sign-in and registration with Roll Number/ID, Hostel Block, and Room Number.
- **Complaint Registration**:
  - Categorization: Electrical, Plumbing, Carpentry, Wi-Fi & Internet, Housekeeping, Mess & Food, Noise, Other.
  - Priority levels: Low, Medium, High, Urgent.
  - Preferred inspection time slots & photo attachment upload with instant preview.
- **Live Complaint Tracking**:
  - Dynamic KPI cards (Total, In Progress, Addressed, Rectified).
  - Search by Title, Category, Ticket ID, or description.
  - Interactive status badges with live real-time synchronization.
  - **Live Auto-Update**: When a warden changes the ticket status, the student dashboard updates automatically with a toast notification and audio chime.
- **Detailed History & Timeline**: Full progressive stepper showing ticket submission, warden acknowledgment, technician assignment, and final resolution.

### 🛡️ Warden / Admin Portal
- **Complete Hostel Oversight**:
  - Global overview of all student complaints across blocks (Block A, Block B, Block C, Block D, Girls Hostel, Boys Hostel).
  - Urgent Ticket Alert Banner for priority emergency handling.
  - Key KPI metrics and live InstantDB sync status indicator.
- **Ticket Status Management**:
  - Exactly 3 designated lifecycle statuses:
    1. **Addressed** - Acknowledged and scheduled by the hostel authority.
    2. **In Progress** - Technician assigned and actively fixing the issue.
    3. **Rectified** - Issue resolved and verified.
  - Add Warden remarks and technician assignment (e.g. *Mr. Suresh - Senior Electrician*).
- **Administration Tools**:
  - Grid View & Table View toggle.
  - Seed realistic demo hostel complaints with 1 click.
  - Export CSV Report for hostel records.
  - Delete or archive resolved complaints.

### 🤖 AI Assistant (n8n Webhook)
- Rounded bottom-right floating chatbot widget.
- Connected to n8n Cloud webhook (`https://dineshkarthick122007.app.n8n.cloud/webhook/hostel-complaint-bot`).
- Intelligent fallback knowledge base for hostel guidelines, emergency contacts, and ticket status explanations.

---

## ⚡ Real-Time Database Integration (InstantDB)

- **InstantDB Public App ID**: `c69bafcf-19d7-4f5d-9696-9bcc7b910dd4`
- **Real-Time Reactive Query**: `db.subscribeQuery({ complaints: {} }, ...)`
- **CRUD Operations**:
  - **Create**: `tx.complaints[id].update(...)`
  - **Read**: Live real-time stream subscription with optimistic local caching
  - **Update**: Status, warden remarks, assigned staff, and timestamp
  - **Delete**: `tx.complaints[id].delete()`

---

## 👥 Project Contributors & Technical Roles

### 👤 Contributor 1: Frontend & UI/UX Architect
**Primary Responsibility**: UI Architecture, Design System, Authentication & Student Experience
- **Key Contribution 1 (Design System & Dual-Role Auth)**: Architected the executive Black & White minimalist design system, custom SVG vector iconography (`icons.js`), and dual-role authentication portal with 1-click demo personas and session persistence.
- **Key Contribution 2 (Complaint Registration & Form Validation)**: Developed the responsive complaint submission modal with category selectors, priority levels, inspection time slot picker, image preview/base64 converter, and client-side validation.
- **Key Contribution 3 (Student Dashboard & Real-Time Resolution Stepper)**: Built the reactive student dashboard with dynamic KPI cards, search/filter controls, and a multi-stage resolution stepper timeline (*Submitted ➔ Addressed ➔ In Progress ➔ Rectified*).

---

### 👤 Contributor 2: Real-time Backend & Cloud Database Engineer
**Primary Responsibility**: InstantDB Database Architecture, Real-Time Sync & Warden Operations
- **Key Contribution 1 (InstantDB Real-time Engine)**: Integrated InstantDB (`@instantdb/core`) using reactive query subscriptions (`subscribeQuery`) and transactional mutations to deliver sub-second data synchronization between warden actions and student dashboards.
- **Key Contribution 2 (Warden Oversight & 3-State Lifecycle Management)**: Built the administrative management system with 3-state ticket workflow transitions (**Addressed**, **In Progress**, **Rectified**), staff assignment, warden remarks logging, and table/grid view toggles.
- **Key Contribution 3 (Data Persistence, Seeder & CSV Export)**: Designed optimistic local caching for offline resilience, realistic demo data generation (`demoSeed.js`), and CSV administrative report export functionality.

---

### 👤 Contributor 3: AI Systems & DevOps / Pipeline Engineer
**Primary Responsibility**: AI Assistant Integration, Audio Synthesis & CI/CD Automation
- **Key Contribution 1 (AI Assistant & n8n Webhook Integration)**: Integrated the floating AI chatbot widget connected to the n8n webhook (`hostel-complaint-bot`), supporting contextual user payload delivery, response parsing, and local FAQ fallback resilience.
- **Key Contribution 2 (Web Audio Synthesizer & Toast Alert System)**: Developed a native Web Audio API sound synthesizer (`sound.js`) and toast notification system (`toast.js`) providing non-intrusive audio-visual cues for real-time status updates without external media assets.
- **Key Contribution 3 (Build Optimization & CI/CD Pipeline)**: Configured Vite production bundling with relative base paths (`vite.config.js`) and engineered the automated GitHub Actions deployment pipeline (`deploy.yml`) for continuous delivery on GitHub Pages.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
http://localhost:5173
```

---

## 👤 Quick Demo Personas

- **Student 1**: `Rahul Sharma` (Room 304, Block B)
- **Student 2**: `Ananya Iyer` (Room 112, Block A)
- **Chief Warden**: `Dr. K. S. Verma` (Chief Hostel Warden)
- **Block Warden**: `Prof. Sunita Rao` (Block B Resident Warden)
