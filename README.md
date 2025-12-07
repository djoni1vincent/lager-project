# 📚 Lager System — Driftstøtte Item Management

A modern, web-based item lending and management system for IT/Driftstøtte departments. Built with React and Flask, featuring barcode scanning, user authentication, and comprehensive admin controls.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)

## ✨ Features

### For Users
- 🔐 **Simple Authentication** — Login with name and password, select class on registration
- 📦 **Browse Items** — View all available equipment with search and filters
- 📱 **Barcode Scanning** — Quick scan to borrow or return items
- 📋 **My Items** — View all your active loans and return items with optional messages
- 💬 **Return Messages** — Leave messages for admins when returning items
- 🎨 **Modern UI** — Beautiful gradient design with smooth animations

### For Administrators
- ⚙️ **Full Control** — Manage users, items, loans, and flags
- 📊 **Loan Management** — Track delivery status, add reports, return items on behalf of users
- 🚩 **Flags System** — Handle return messages, defects, and issues with status tracking
- 📈 **Statistics** — View active loans, available items, and system overview
- 🔍 **Search & Filter** — Powerful search by name or barcode, filter by category and status

## 🛠️ Tech Stack

### Frontend
- **React 19** — Modern UI library
- **Vite** — Fast build tool and dev server
- **React Router** — Client-side routing
- **Tailwind CSS** — Utility-first CSS framework
- **Framer Motion** — Smooth animations and transitions
- **Axios/Fetch** — API communication

### Backend
- **Flask** — Lightweight Python web framework
- **SQLite** — Embedded database
- **Werkzeug** — Password hashing and security
- **Flask-CORS** — Cross-origin resource sharing

### Database Schema
- **Users** — Name, password, class, role (user/admin)
- **Items** — Name, description, barcode, category, location, quantity
- **Loans** — Item/user relationships, dates, delivery status, reports
- **Flags** — Issues, return messages, status tracking, admin comments

## 🚀 Quick Start

### Prerequisites
```bash
# Python 3.8 or higher
python --version

# Node.js 16 or higher
node --version

# npm (comes with Node.js)
npm --version
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd lager-project
```

2. **Set up Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Set up Frontend**

```bash
cd frontend
npm install
```

4. **Start Backend Server**

```bash
cd backend
python server.py
```

The backend will:
- Auto-create `lager.db` if missing
- Initialize database schema
- Create default admin user: `admin` / `1234`
- Start on `http://127.0.0.1:5000`

5. **Start Frontend Dev Server**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

6. **Add Demo Data (Optional)**

```bash
cd backend
python add_demo_items.py
```

This will add 18 sample items for Driftstøtte (cables, computers, projectors, etc.).

## 📖 Usage Guide

### User Workflow

1. **Login**
   - Go to `/user/login`
   - Enter your name
   - If new user: choose password and class
   - If existing: enter password

2. **Browse Items**
   - Search by name or barcode
   - Filter by category and status
   - Click on item to view details

3. **Borrow Item**
   - Select return date
   - Click "Lån denne gjenstanden"
   - Item appears in "Mine gjenstander"

4. **Return Item**
   - Go to "Mine gjenstander"
   - Click "Returner"
   - Optionally leave a message for admin
   - Confirm return

### Admin Workflow

1. **Login**
   - Go to `/admin/login`
   - Username: `admin`
   - Password: `1234` (change in production!)

2. **Manage Items**
   - Add/edit/delete items
   - Set categories and locations
   - Assign barcodes

3. **Manage Users**
   - View all users
   - Edit user information
   - Delete users (with safety checks)

4. **Handle Loans**
   - View all active loans
   - Update delivery status
   - Add reports
   - Return items on behalf of users

5. **Process Flags**
   - Review return messages from users
   - Handle defects and issues
   - Update status (Under vurdering → Ferdig)
   - Add comments/verdicts

## 🎨 Design Features

- **Gradient Backgrounds** — Modern slate-to-slate gradients
- **Color Coding** — Emerald (available), Orange (loaned), Sky (active)
- **Smooth Animations** — Framer Motion for hover and transitions
- **Responsive Layout** — Works on all screen sizes
- **Dark Theme** — Easy on the eyes for long sessions
- **Status Badges** — Clear visual indicators for item status
- **Barcode Display** — Monospace font with copy functionality

## 📁 Project Structure

```
lager-project/
├── backend/
│   ├── server.py              # Flask API server
│   ├── add_demo_items.py      # Script to add demo items
│   ├── requirements.txt       # Python dependencies
│   └── venv/                  # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   └── ScanBox.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── UserLoginPage.jsx
│   │   │   ├── MyItems.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLoans.jsx
│   │   │   └── AdminFlags.jsx
│   │   ├── context/           # React contexts
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx            # Main app component
│   ├── package.json
│   └── vite.config.js
├── lager.db                   # SQLite database (auto-created)
└── README.md                  # This file
```

## 🔐 Authentication & Security

- **User Sessions** — Flask sessions for user authentication
- **Password Hashing** — Werkzeug password hashing (bcrypt)
- **Admin Protection** — Decorator-based route protection
- **CORS Configuration** — Configured for development and production
- **Session Cookies** — Secure cookie settings

## 📊 Database Schema

### Users Table
- `id`, `name`, `role`, `barcode`, `class_year`
- `username`, `password_hash`, `email`, `phone`, `notes`
- `created_at`, `updated_at`

### Items Table
- `id`, `name`, `description`, `barcode`
- `category`, `location`, `quantity`, `status`, `notes`
- `created_at`, `updated_at`

### Loans Table
- `id`, `item_id`, `user_id`
- `loan_date`, `due_date`, `return_date`
- `delivery_status`, `delivery_notes`, `report`
- `notes`, `created_at`

### Flags Table
- `id`, `item_id`, `user_id`, `loan_id`
- `flag_type`, `message`, `status`
- `resolved`, `resolution_notes`
- `created_by`, `created_at`, `resolved_at`

## 🌐 API Endpoints

### Public Endpoints
- `GET /items` — List all items
- `GET /items/:id` — Get item details
- `POST /scan` — Scan barcode (item or user)
- `POST /loans` — Create loan (requires session or barcode)
- `POST /loans/:id/return` — Return item
- `POST /auth/user/login` — User login
- `GET /users/me/loans` — Get user's active loans

### Admin Endpoints
- `POST /auth/login` — Admin login
- `GET /admin/users` — List all users
- `POST /admin/users` — Create user
- `GET /admin/items` — List all items
- `POST /admin/items` — Create item
- `GET /admin/loans` — List all active loans
- `PUT /admin/loans/:id/delivery` — Update delivery status
- `PUT /admin/loans/:id/report` — Add report
- `GET /admin/flags` — List all flags
- `PUT /admin/flags/:id/resolve` — Update flag status

## 🚦 Environment Variables

```bash
# Backend (.env or environment)
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
SESSION_COOKIE_SAMESITE=None
SESSION_COOKIE_SECURE=True
DEFAULT_ADMIN_PASSWORD=1234

# Optional: Email notifications
NOTIFICATIONS_ENABLED=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@example.com
```

## 🔧 Development

### Running Tests
```bash
# Backend tests (if available)
cd backend
python test_server.py

# Frontend tests (if available)
cd frontend
npm test
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Serve built files
npm run preview
```

### Database Reset

To reset the database:
```bash
rm lager.db
# Restart server to recreate schema
```

## 📝 License

MIT License — feel free to use this project for your organization.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ for efficient IT equipment management**

