# Made with AI

# 📚 Lager System — Driftstøtte Item Management

A modern, web-based item lending and management system for IT/Driftstøtte departments. Built with React and Flask, featuring barcode scanning, user authentication, and comprehensive admin controls.


![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)

---

## ✨ Features

### For Users
- 🔒 **Simple Authentication** — Login with name and password, select class on registration
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

---

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

5. **Start Frontend Dev Server**

```bash
cd frontend
npm run dev
```

6. **Add Demo Data (Optional)**

```bash
cd backend
python add_demo_items.py
```

---

## 📂 Project Structure

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
│   │   ├── pages/             # Page components
│   │   ├── context/           # React contexts
│   │   └── App.jsx            # Main app component
│   ├── package.json
│   └── vite.config.js
├── lager.db                   # SQLite database (auto-created)
└── README.md                  # This file
```

---

## 📖 Additional Documentation

- **[Quick Start Guide](QUICK_START.md)**: Detailed setup and usage instructions.
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)**: Technical details and architecture overview.

---

## 🛠️ Development

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

---

## 📜 License

MIT License — feel free to use this project for your organization.

---

**Enjoy your new item lending system!** ✨
