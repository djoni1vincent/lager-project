# 🎓 Lager System - Complete Setup & Usage Guide

## ✅ System Status

Your Lager System is **fully built and running**:

- ✅ **Backend API**: `http://127.0.0.1:5000` (Flask)
- ✅ **Frontend UI**: `http://localhost:5173` (React + Vite)
- ✅ **Database**: `/home/djoni/dev/lager-project/lager.db` (SQLite)

---

## 🚀 Quick Start

### Option 1: Automated Start (Recommended)
```bash
cd /home/djoni/dev/lager-project
./start.sh
```

This script will:
1. Kill old processes
2. Start Flask backend
3. Start Vite frontend
4. Display connection info
5. Show logs

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /home/djoni/dev/lager-project/backend/venv
python server.py
```
✅ Backend ready at `http://127.0.0.1:5000`

**Terminal 2 - Frontend:**
```bash
cd /home/djoni/dev/lager-project/frontend
npm run dev
```
✅ Frontend ready at `http://localhost:5173`

---

## 📱 Using the System

### For Regular Users (Public)

**Homepage** (`http://localhost:5173`)

1. **Scan User Barcode**
   - Enter barcode in the scan box (e.g., `USER001`)
   - See user info and active loans

2. **Scan Item Barcode**
   - Enter barcode (e.g., `ITEM001`)
   - See item availability

3. **Borrow Item**
   - After scanning user + item
   - Set due date
   - Click "✓ Borrow"
   - Item quantity decreases automatically

4. **Return Item**
   - Scan your barcode
   - See active loans
   - Click "Return" next to item
   - Item quantity increases

5. **Extend Loan**
   - Scan your barcode
   - Click "Extend" on active loan
   - Choose new due date
   - Confirmed instantly

### For Administrators

**Login** (`http://localhost:5173/admin/login`)
- Username: `admin`
- Password: `1234`

**Admin Dashboard** (`http://localhost:5173/admin`)

#### 👥 User Management
- View all users (with email/phone)
- Add new users (name, barcode, class year, role)
- Edit user details
- Delete users
- Batch operations

**Add Test User:**
1. Click "👥 User Management"
2. Click "➕ Add User"
3. Fill: Name, Barcode (e.g., USER002), Class, Role
4. Click "✓ Add User"

#### 📦 Item Management
- View all items (with location, category)
- Add new items (name, barcode, category, location)
- Edit item details
- Delete items
- Adjust quantities

**Add Test Item:**
1. Click "📦 Item Management"
2. Click "➕ Add Item"
3. Fill: Name, Barcode, Category, Location, Description, Quantity
4. Click "✓ Add Item"

#### 🚩 Flag Management
- View all system flags (defects, missing barcodes, overdue)
- Resolve flags
- Track issues

**Create a Flag (Public):**
Users can flag issues without login:
```bash
curl -X POST http://127.0.0.1:5000/flags \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "flag_type": "defect",
    "message": "Screen is cracked"
  }'
```

#### ⚙️ Settings (Future)
- System configuration
- Database maintenance
- Backup & restore

---

## 🧪 Test Scenarios

### Scenario 1: Complete Borrow & Return Cycle

**Setup:**
- User barcode: `USER001` (John Student)
- Item barcode: `ITEM001` (Laptop)

**Steps:**
```bash
# 1. Scan user
curl -X POST http://127.0.0.1:5000/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode":"USER001"}'
# Response: shows John + active loans (empty)

# 2. Scan item
curl -X POST http://127.0.0.1:5000/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode":"ITEM001"}'
# Response: shows Laptop + available (loaned: false)

# 3. Create loan
curl -X POST http://127.0.0.1:5000/loans \
  -H "Content-Type: application/json" \
  -d '{
    "user_barcode":"USER001",
    "item_barcode":"ITEM001",
    "due_date":"2025-12-05"
  }'
# Response: loan ID = 1, item quantity decreases

# 4. Scan user again
curl -X POST http://127.0.0.1:5000/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode":"USER001"}'
# Response: shows Laptop in active_loans

# 5. Return loan
curl -X POST http://127.0.0.1:5000/loans/1/return \
  -H "Content-Type: application/json" \
  -d '{"user_barcode":"USER001"}'
# Response: return_date filled, item quantity increases

# 6. Scan user one more time
curl -X POST http://127.0.0.1:5000/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode":"USER001"}'
# Response: active_loans empty, but history shows Laptop returned
```

### Scenario 2: Admin Adds New Item & User

**Steps:**
1. Login to admin panel
2. Go to "👥 User Management"
3. Add: Name="Jane Teacher", Barcode="USER002"
4. Go to "📦 Item Management"
5. Add: Name="Arduino Kit", Barcode="ITEM003", Category="Electronics"
6. Back on homepage, scan "USER002" and "ITEM003"
7. Create loan between them

### Scenario 3: Report Defect Flag

**Public (no login):**
```bash
curl -X POST http://127.0.0.1:5000/flags \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "flag_type": "defect",
    "message": "Charging port is broken"
  }'
```

**Admin resolves:**
1. Login to admin panel
2. Go to "🚩 System Flags"
3. See "🔧 defect" for Laptop
4. Click "✓ Resolve"
5. Flag disappears

---

## 🎓 Real-World Workflow for School

### Setup Day:
1. **Print barcodes** for all users and items
2. **Add users** via admin panel (or bulk import)
3. **Add items** via admin panel (or bulk import)
4. **Create user list** with barcodes to print and hang on door
5. **Train staff** on admin panel

### Daily Usage:
1. **Students borrow** → scan own barcode + item → confirm
2. **Students return** → scan own barcode → click return
3. **Staff monitor** → admin panel shows:
   - Who has what
   - Overdue items
   - Defects/flags
   - Loan history

### Maintenance:
1. **Report defects** → public can flag issues
2. **Admin resolves** → check flags, mark resolved
3. **Run GDPR cleanup** → auto-delete old users
4. **Backup database** → regular SQLite backups

---

## 📊 Database Structure

### Users
```sql
SELECT * FROM users;
-- Columns: id, name, role, barcode, class_year, username,
--          password_hash, email, phone, notes, created_at, updated_at
```

### Items
```sql
SELECT * FROM items;
-- Columns: id, name, description, barcode, category, location,
--          quantity, status, notes, created_at, updated_at
```

### Loans
```sql
SELECT * FROM loans;
-- Columns: id, item_id, user_id, loan_date, due_date, return_date,
--          notes, created_at
```

### Flags
```sql
SELECT * FROM flags;
-- Columns: id, item_id, user_id, flag_type, message, resolved,
--          created_by, created_at, resolved_at
```

---

## 🔧 Configuration

### Change Admin Password

```python
# In Python:
from werkzeug.security import generate_password_hash

new_pass = generate_password_hash("MyNewPassword123")
print(new_pass)  # Copy this hash
```

```bash
# In database:
sqlite3 lager.db
UPDATE users SET password_hash = '$2b$12$...' WHERE username = 'admin';
-- Paste the hash above
```

### Enable Email Notifications

Before starting backend:
```bash
export NOTIFICATIONS_ENABLED=true
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
export SMTP_FROM=noreply@school.local
export SMTP_TO=admin@school.local

python server.py
```

### Change CORS Origins

Edit `backend/venv/server.py`:
```python
cors_origins = os.environ.get("CORS_ORIGINS",
  "http://localhost:5173,http://localhost:5174,http://yourschool.local"
).split(",")
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Cannot connect to backend"** | Ensure `python server.py` is running |
| **"Barcode not found"** | Add user/item to DB first (admin panel) |
| **"Admin login fails"** | Default: `admin` / `1234` (case-sensitive) |
| **"Loan not found"** | Scan user first to get loan ID |
| **"Port 5000 already in use"** | `pkill -f "python.*server"` |
| **"Port 5173 already in use"** | `pkill -f "npm run dev"` |
| **"Database locked"** | Restart backend: `pkill -f python; python server.py` |
| **"Frontend shows 404"** | Clear browser cache: Ctrl+Shift+Delete |

---

## 📊 Monitoring & Logs

### View Backend Logs
```bash
tail -f /tmp/lager_server.log
```

Example output:
```
✓ Database initialized at /home/djoni/dev/lager-project/lager.db
🚀 Starting Lager System API on http://127.0.0.1:5000
GET /items HTTP/1.1 200
POST /scan HTTP/1.1 200
POST /loans HTTP/1.1 201
```

### View Frontend Logs
```bash
# Browser console (F12)
# Or: tail -f /tmp/vite.log
```

### View Database
```bash
# Interactive shell:
sqlite3 /home/djoni/dev/lager-project/lager.db

# Or using GUI tools:
# - SQLite Browser (sqlitebrowser)
# - DBeaver
# - VS Code SQLite extension
```

---

## 🔐 Security Reminders

✅ **Default credentials** (`admin` / `1234`) — Change immediately!
✅ **Use HTTPS** in production
✅ **Backup database** regularly
✅ **Session timeout** — Add auto-logout after inactivity
✅ **Rate limiting** — Prevent brute-force attacks
✅ **GDPR compliance** — System auto-deletes old users

---

## 📈 Production Deployment

When ready for real school use:

1. **Generate new admin password**
2. **Set up database backups** (daily/weekly)
3. **Use production web server** (gunicorn, nginx)
4. **Enable HTTPS** (Let's Encrypt)
5. **Set SESSION_COOKIE_SECURE=True**
6. **Configure proper CORS** for your domain
7. **Add rate limiting** & request validation
8. **Monitor logs** with ELK stack or similar
9. **Set up automated backups**
10. **Document workflows** for staff

---

## 📚 Full Documentation

- **API Docs**: See `README_SYSTEM.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`
- **Source Code**:
  - Backend: `backend/venv/server.py` (600+ lines)
  - Frontend: `frontend/src/` (React components)

---

## 💡 Tips & Tricks

### Bulk Import Users
```bash
# Create CSV: users.csv
# name,barcode,class_year,role
# John Student,USER001,2024,user
# Jane Teacher,STAFF001,2024,staff

# Use admin panel to add one by one, or:
# Write a Python script to batch insert
```

### Generate Barcodes
```bash
# QR Codes: Use qrencode or online generator
# Numeric: Use sequential numbers (001, 002, ...)
# Text: Use readable codes (LAPTOP-01, LAB-ARDUINO-02)

qrencode -o user001.png "USER001"
```

### API Rate Limiting
Add to Flask:
```python
from flask_limiter import Limiter
limiter = Limiter(app, key_func=lambda: request.remote_addr)
@app.route('/loans', methods=['POST'])
@limiter.limit("10 per hour")
def create_loan(): ...
```

### Barcode Label Format
Print labels with:
- Item name (e.g., "Laptop #1")
- Barcode (QR or text)
- Location (e.g., "Shelf A")
- Contact (e.g., "Email: admin@school.local")

---

## 🎯 Next Steps

1. ✅ System is running
2. ✅ Test barcode flows (see scenarios above)
3. ✅ Add real users/items
4. ✅ Print barcodes
5. ✅ Train staff
6. ✅ Go live!

---

## 🤝 Support

**Questions or issues?**

1. Check logs: `/tmp/lager_server.log`
2. Check browser console: Press F12
3. Try a test API call:
   ```bash
   curl -s http://127.0.0.1:5000/items | jq .
   ```
4. Review documentation in this folder

---

## 📝 License & Credits

Built with:
- React 19
- Flask
- SQLite
- Tailwind CSS
- Framer Motion

Ready for your school! 🎓📚

---

**Enjoy your new item lending system!** ✨
