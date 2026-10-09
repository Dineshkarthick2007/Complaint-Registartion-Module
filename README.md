# 🏢 HostelCare - Complaint & Maintenance Management System

A modern, full-featured web application for hostel students and wardens to register, manage, and track maintenance complaints in real time using **HTML, CSS, Vanilla JavaScript, and InstantDB**.

---

## 🌟 Key Features

### 👨‍🎓 Student Portal
- **Role-Based Authentication**: Dedicated student sign-in and registration with Roll Number/ID, Hostel Block, and Room Number.
- **Complaint Registration**:
  - Categorization: ⚡ Electrical, 🚰 Plumbing, 🪑 Carpentry, 📶 Wi-Fi & Internet, 🧹 Housekeeping, 🍽️ Mess & Food, 🔊 Noise, 🚨 Other.
  - Priority levels: 🟢 Low, 🟡 Medium, 🔴 High, 🚨 Urgent.
  - Preferred inspection time slots & photo attachment upload with live preview.
- **Live Complaint Tracking**:
  - Dynamic KPI cards (Total, In Progress, Addressed, Rectified).
  - Search by Title, Category, Ticket ID, or description.
  - Interactive status badges with pulsing live indicators.
  - **Live Auto-Update**: When a warden changes the ticket status, the student dashboard updates automatically with a toast notification and audio chime.
- **Detailed History & Timeline**: Full progressive stepper showing ticket submission, warden acknowledgment, technician assignment, and final resolution.

### 🛡️ Warden / Admin Portal
- **Complete Hostel Oversight**:
  - Global overview of all student complaints across blocks (Block A, Block B, Block C, Block D, Girls Hostel, Boys Hostel).
  - Urgent Ticket Alert Banner for priority emergency handling.
  - Key KPI metrics and live InstantDB sync status indicator.
- **Ticket Status Management**:
  - Exactly 3 designated lifecycle statuses:
    1. 👁️ **Addressed** - Acknowledged and scheduled by the hostel authority.
    2. ⏳ **In Progress** - Technician assigned and actively fixing the issue.
    3. ✅ **Rectified** - Issue resolved and verified.
  - Add Warden remarks and technician assignment (e.g. *Mr. Suresh - Senior Electrician*).
- **Administration Tools**:
  - Grid View & Table View toggle.
  - Seed realistic demo hostel complaints with 1 click.
  - Export CSV Report for hostel records.
  - Delete or archive resolved complaints.

---

## ⚡ Real-Time Database Integration (InstantDB)

- **InstantDB Public App ID**: `c69bafcf-19d7-4f5d-9696-9bcc7b910dd4`
- **Real-Time Reactive Query**: `db.subscribeQuery({ complaints: {} }, ...)`
- **CRUD Operations**:
  - **Create**: `tx.complaints[id].update(...)`
  - **Read**: Live real-time stream subscription
  - **Update**: Status, warden remarks, assigned staff, and timestamp
  - **Delete**: `tx.complaints[id].delete()`

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

## 👤 Quick Demo Accounts

You can click any of the 1-click quick login cards on the login screen:
- **Student 1**: `Rahul Sharma` (Room 304, Block B)
- **Student 2**: `Ananya Iyer` (Room 112, Block A)
- **Chief Warden**: `Dr. K. S. Verma` (Chief Hostel Warden)
- **Block Warden**: `Prof. Sunita Rao` (Block B Resident Warden)
