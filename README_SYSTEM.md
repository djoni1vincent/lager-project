# 📚 Lager System — Item Lending Library

A modern, barcode-based item lending system for schools. Designed for easy borrowing/returning of equipment without login, with powerful admin controls.

## Features

✅ **Public Barcode Scanning** — Borrow/return items by scanning barcodes (no login required)
✅ **Admin Panel** — Full database management (users, items, loans, flags)
✅ **Barcode Support** — All users and items must have barcodes for identification
✅ **Loan Management** — Take, return, extend loans
✅ **Flags System** — Report defects, missing barcodes, overdue items
✅ **GDPR Compliant** — Auto-delete users 3+ years old with no active loans
✅ **Dark Modern UI** — Tailwind CSS + Framer Motion animations
✅ **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 19 + Vite + React Router + Tailwind CSS + Framer Motion
- **Backend**: Flask + SQLite
- **Database**: SQLite (repo-root `lager.db`)

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- sqlite3

### 1. Start Backend (Flask API on `http://127.0.0.1:5000`)

```bash
cd /home/djoni/dev/lager-project/backend/venv
python server.py
```

The backend will:
- Auto-create `lager.db` if missing
- Initialize database schema (users, items, loans, flags tables)
- Create default admin user: `admin` / `1234`
- Start on `http://127.0.0.1:5000`

### 2. Start Frontend (Vite on `http://localhost:5173`)

```bash
cd /home/djoni/dev/lager-project/frontend
npm install  # if needed
npm run dev
```

Then open **http://localhost:5173** in your browser.

## System Roles & Access

### Public User
- ✅ Scan user/item barcodes
- ✅ Take (borrow) available items
- ✅ Return loaned items
- ✅ Extend loan due dates
- ❌ No login required
- ❌ No access to contact info
- ❌ No database management

### Admin
- ✅ Login with username + password (`admin` / `1234`)
- ✅ Manage users (add, edit, delete, view contact info)
- ✅ Manage items (add, edit, delete, set categories/locations)
- ✅ View all loans and history
- ✅ Manage flags (defects, missing barcodes)
- ✅ Run GDPR cleanup (delete old users)
- ✅ Full database control

## Database Schema

### Users Table
```
id, name, role, barcode, class_year, username, password_hash,
email, phone, notes, created_at, updated_at
```
- **role**: 'user' (default), 'admin', or 'staff'
- **barcode**: Unique identifier for scanning
- **username**: Required for admin login only
- **password_hash**: Only needed for admin users

### Items Table
```
id, name, description, barcode, category, location, quantity,
status, notes, created_at, updated_at
```
- **barcode**: Unique identifier for scanning
- **quantity**: Available count (decreases when loaned)
- **category**: Group items by type
- **location**: Physical storage location

### Loans Table
```
id, item_id, user_id, loan_date, due_date, return_date, notes, created_at
```
- **return_date**: NULL if still loaned, filled when returned
- Supports loan history and overdue tracking

### Flags Table
```
id, item_id, user_id, flag_type, message, resolved,
created_by, created_at, resolved_at
```
- **flag_type**: 'defect', 'missing_barcode', 'overdue', 'general'
- Admins can mark as resolved

## API Endpoints

### Public Endpoints (No Auth)

#### Scan Barcode
```
POST /scan
Request: { "barcode": "USER001" or "ITEM001" }
Response: { "type": "user"|"item"|"unknown", "user": {...}, "item": {...}, "active_loans": [...] }
```

#### Create Loan
```
POST /loans
Request: { "user_barcode": "USER001", "item_barcode": "ITEM001", "due_date": "2025-12-05" }
Response: { "id": 1, "item_id": 1, "user_id": 2, "loan_date": "...", "due_date": "...", ... }
```

#### Return Loan
```
POST /loans/<id>/return
Request: { "user_barcode": "USER001" }
Response: { "id": 1, ..., "return_date": "2025-11-28" }
```

#### Extend Loan
```
POST /loans/<id>/extend
Request: { "user_barcode": "USER001", "new_due_date": "2025-12-12" }
Response: { "id": 1, ..., "due_date": "2025-12-12" }
```

#### List Items
```
GET /items
Response: [ { "id": 1, "name": "Laptop", "barcode": "ITEM001", "loaned_to": null, ... }, ... ]
```

#### Get Item Details
```
GET /items/<id>
Response: { "id": 1, "name": "Laptop", ..., "active_loan": null, "history": [...] }
```

#### Create Flag
```
POST /flags
Request: { "item_id": 1, "flag_type": "defect", "message": "Screen is cracked" }
Response: { "message": "Flag created" }
```

### Admin Endpoints (Auth Required)

#### Admin Login
```
POST /auth/login
Request: { "username": "admin", "password": "1234" }
Response: { "message": "ok", "user": { "id": 1, "name": "System Admin", ... } }
```

#### Check Auth
```
GET /auth/me
Response: { "is_admin": true, "user": { "id": 1, ... } }
```

#### Admin Logout
```
POST /auth/logout
Response: { "message": "Logged out" }
```

#### Manage Users
```
GET /admin/users
POST /admin/users
PUT /admin/users/<id>
DELETE /admin/users/<id>
```

#### Manage Items
```
GET /admin/items
POST /admin/items
PUT /admin/items/<id>
DELETE /admin/items/<id>
```

#### Manage Flags
```
GET /admin/flags
PUT /admin/flags/<id>/resolve
```

#### GDPR Cleanup
```
POST /admin/gdpr_cleanup
Response: { "message": "...", "removed_users": 5, "anonymized_loans": 23 }
```

## Workflow Examples

### Example 1: Borrow an Item (Public User)

1. User scans their barcode → `POST /scan` with `USER001`
   - System shows: user info + active loans
2. User scans item barcode → `POST /scan` with `ITEM001`
   - System shows: item available or loaned to someone
3. If available, user creates loan → `POST /loans`
   - Request: `{ "user_barcode": "USER001", "item_barcode": "ITEM001", "due_date": "2025-12-05" }`
   - Item quantity decreases, loan created
4. Loan appears in user's active loans

### Example 2: Return an Item (Public User)

1. User scans their barcode → `POST /scan`
2. System shows active loans for this user
3. User clicks "Return" on a loan
   - System calls `POST /loans/<id>/return` with `{ "user_barcode": "USER001" }`
   - Item quantity increases, return_date filled
4. Loan no longer appears in active loans

### Example 3: Admin Adds Item

1. Admin clicks "⚙️ Admin Panel" → "📦 Item Management" → "➕ Add Item"
2. Fills form: Name, Barcode, Category, Location, Description, Quantity
3. Clicks "✓ Add Item" → `POST /admin/items`
4. Item appears in items list

### Example 4: Admin Resolves Flag

1. Admin clicks "🚩 System Flags"
2. Sees unresolved flags (defects, missing barcodes, etc.)
3. Clicks "✓ Resolve" next to a flag → `PUT /admin/flags/<id>/resolve`
4. Flag disappears from list

## Configuration

### Environment Variables

```bash
# Backend
CORS_ORIGINS=http://localhost:5173,http://localhost:5174  # Dev ports
SESSION_COOKIE_SAMESITE=None
SESSION_COOKIE_SECURE=False

# Notifications (optional)
NOTIFICATIONS_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@lager.local
SMTP_TO=admin@school.local
```

## Default Credentials

- **Username**: `admin`
- **Password**: `1234`

⚠️ **Change this immediately in production!**

```sql
UPDATE users SET password_hash = ? WHERE username = 'admin';
```

## GDPR & Privacy

✅ **Auto-delete users** 3+ years old with no active loans
✅ **Anonymize loans** — When a user is deleted, their old loans keep history but user_id becomes NULL
✅ **Minimal data** — No collection of unnecessary info
✅ **Contact info hidden** — Phone/email only visible to admins
✅ **Loan history public** — Users can see who has what (useful for requesting items)

## Testing the System

### Test Barcode Flows

```bash
# 1. Scan user
curl -X POST http://127.0.0.1:5000/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode":"USER001"}'

# 2. Scan item
curl -X POST http://127.0.0.1:5000/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode":"ITEM001"}'

# 3. Create loan
curl -X POST http://127.0.0.1:5000/loans \
  -H "Content-Type: application/json" \
  -d '{"user_barcode":"USER001","item_barcode":"ITEM001","due_date":"2025-12-05"}'

# 4. Return loan (replace 1 with actual loan ID)
curl -X POST http://127.0.0.1:5000/loans/1/return \
  -H "Content-Type: application/json" \
  -d '{"user_barcode":"USER001"}'
```

### Test Admin Functions

```bash
# Login
curl -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}' \
  -c cookies.txt

# List users (with auth cookie)
curl -b cookies.txt http://127.0.0.1:5000/admin/users

# Add item
curl -b cookies.txt -X POST http://127.0.0.1:5000/admin/items \
  -H "Content-Type: application/json" \
  -d '{"name":"New Laptop","barcode":"NEW001","category":"Electronics","location":"Shelf C","quantity":2}'

# Run GDPR cleanup
curl -b cookies.txt -X POST http://127.0.0.1:5000/admin/gdpr_cleanup
```

## Troubleshooting

### Frontend not connecting to backend
- Ensure backend is running on `http://127.0.0.1:5000`
- Check browser console for CORS errors
- Frontend forwards relative API calls to backend base

### Barcode scan not working
- Make sure barcode exists in database (case-sensitive)
- User/item barcode column must be populated
- Test with curl first to debug

### Admin login fails
- Default: `admin` / `1234`
- Check database: `SELECT * FROM users WHERE username='admin';`
- Verify `role` is 'admin' or 'staff'

### Database locked error
- Only one instance of Flask should be running
- Kill any background Python processes: `pkill -f "python.*server.py"`

## Deployment Checklist

- [ ] Change admin password in database
- [ ] Set `SESSION_COOKIE_SECURE=True` for HTTPS
- [ ] Configure SMTP for notifications
- [ ] Set up regular backups of `lager.db`
- [ ] Use a production WSGI server (gunicorn, etc.)
- [ ] Enable rate limiting
- [ ] Add user session timeout
- [ ] Document barcode format (QR code, numeric, etc.)
- [ ] Print barcode labels for all items
- [ ] Create user list to print and hang on door

## Support & Development

**Built with** ❤️ for schools using modern, accessible, open-source tools.

For issues or feature requests, check the application logs:
- Backend: `/tmp/lager_server.log`
- Frontend: Browser console (F12)
- Database: `/home/djoni/dev/lager-project/lager.db`

---

**Ready for your school demo!** 🎓📚
