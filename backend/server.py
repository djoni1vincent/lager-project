#!/usr/bin/env python3
"""
Lager System API — Item lending library for schools.

Roles:
  - admin: Full DB access, must login (username + password)
  - staff: Same as admin (TBD)
  - user: Can loan/return items via barcode scan, NO login required

Public operations (no login):
  - POST /scan: scan barcode → get item or user details
  - POST /loans: create loan (user barcode + item barcode or ID)
  - POST /loans/<id>/return: return item (user barcode + item barcode or ID)
  - POST /loans/<id>/extend: extend loan (user barcode)
  - GET /items: list items (public view)
  - GET /users: list users (names + barcodes, no contact info)

Admin operations (login required):
  - GET /admin/users: list users (with contact info)
  - POST /admin/users: add user
  - PUT /admin/users/<id>: edit user
  - DELETE /admin/users/<id>: delete user
  - GET /admin/items: list items
  - POST /admin/items: add item
  - PUT /admin/items/<id>: edit item
  - DELETE /admin/items/<id>: delete item
  - GET /admin/flags: list flags
  - PUT /admin/flags/<id>/resolve: resolve flag
  - POST /admin/gdpr_cleanup: run cleanup
  - POST /auth/login: admin login
  - POST /auth/logout: admin logout
  - GET /auth/me: check admin session
"""

import os
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from functools import wraps
import secrets
import smtplib
from email.message import EmailMessage

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")

# CORS: allow dev ports, support credentials for session cookies
cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174"
).split(",")
CORS(app, origins=cors_origins, supports_credentials=True)

# Cookie / session settings:
# - We need SameSite=None so что бы браузер отправлял куки с запросами
#   с фронтенда (порт 5173/5174) на backend:5000.
# - Secure=True безопаснее, и на localhost современные браузеры это позволяют.
app.config["SESSION_COOKIE_SAMESITE"] = os.environ.get("SESSION_COOKIE_SAMESITE", "None")
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "True").lower() in ("1", "true", "yes")

# DB path at repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
DB_NAME = str(REPO_ROOT / "lager.db")


def get_db():
    """Get a DB connection with row factory."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database schema. Idempotent."""
    conn = get_db()
    c = conn.cursor()

    # Users: admin + regular users. Both have barcode (not universally required password).
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        barcode TEXT UNIQUE,
        class_year TEXT,
        username TEXT UNIQUE,
        password_hash TEXT,
        email TEXT,
        phone TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Items: all items have barcode.
    c.execute('''
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        barcode TEXT UNIQUE,
        category TEXT,
        location TEXT,
        quantity INTEGER DEFAULT 1,
        status TEXT DEFAULT 'available',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Loans: track who borrowed what and when.
    c.execute('''
    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        user_id INTEGER,
        loan_date TEXT DEFAULT CURRENT_TIMESTAMP,
        due_date TEXT,
        return_date TEXT,
        notes TEXT,
        delivery_status TEXT,
        delivery_notes TEXT,
        report TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(item_id) REFERENCES items(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    # Add new columns if they don't exist
    for col in ['delivery_status', 'delivery_notes', 'report']:
        try:
            c.execute(f"ALTER TABLE loans ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists

    # Flags: system issues (missing barcode, defects, overdue, etc).
    c.execute('''
    CREATE TABLE IF NOT EXISTS flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        user_id INTEGER,
        flag_type TEXT,
        message TEXT,
        resolved INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT,
        FOREIGN KEY(item_id) REFERENCES items(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(created_by) REFERENCES users(id)
    )
    ''')

    # Optional columns for admin resolution notes and status (added later, so use ALTER TABLE).
    for col in ['resolution_notes', 'status', 'loan_id']:
        try:
            c.execute(f"ALTER TABLE flags ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            # Column probably already exists – safe to ignore.
            pass

    conn.commit()

    # Ensure admin user exists
    admin_exists = conn.execute("SELECT 1 FROM users WHERE username = 'admin'").fetchone()
    if not admin_exists:
        # Default credentials are documented in README_SYSTEM.md:
        # username: admin, password: 1234
        # In production this should be changed manually in the database.
        admin_password = os.environ.get("DEFAULT_ADMIN_PASSWORD", "1234")
        admin_hash = generate_password_hash(admin_password)
        conn.execute(
            "INSERT INTO users (name, role, username, password_hash, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            ("System Admin", "admin", "admin", admin_hash)
        )
        conn.commit()
        print(f"✓ Default admin created: username=admin password={admin_password}")

    conn.close()
    print(f"✓ Database initialized at {DB_NAME}")


def admin_required(fn):
    """Decorator: check if user is logged in as admin."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"DEBUG: admin_required - request.cookies: {request.cookies}")
        print(f"DEBUG: admin_required - session.get('is_admin'): {session.get('is_admin')}")
        if not session.get("is_admin"):
            return jsonify({"error": "Admin authentication required"}), 401
        return fn(*args, **kwargs)
    return wrapper


def send_notification(subject: str, body: str, to_addrs: list | None = None):
    """Send email notification. Respects NOTIFICATIONS_ENABLED env var."""
    if os.environ.get("NOTIFICATIONS_ENABLED", "false").lower() not in ("1", "true", "yes"):
        return False

    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    smtp_from = os.environ.get("SMTP_FROM")

    if not smtp_host or not smtp_from:
        return False

    recipients = to_addrs or []
    if not recipients:
        smtp_to = os.environ.get("SMTP_TO")
        if smtp_to:
            recipients = [a.strip() for a in smtp_to.split(",") if a.strip()]

    if not recipients:
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = ", ".join(recipients)
    msg.set_content(body)

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as s:
            s.starttls()
            if smtp_user and smtp_pass:
                s.login(smtp_user, smtp_pass)
            s.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send notification: {e}")
        return False


# ============================================================================
# PUBLIC ENDPOINTS (no auth required)
# ============================================================================

@app.route("/scan", methods=["POST"])
def scan_barcode():
    """
    Scan barcode → return item, user, or unknown.
    Request: {"barcode": "..."}
    Response: {"type": "item"|"user"|"unknown", "item": {...}, "user": {...}, ...}
    """
    data = request.json or {}
    barcode = data.get("barcode", "").strip()

    if not barcode:
        return jsonify({"error": "barcode required"}), 400

    conn = get_db()

    # Try item first
    item = conn.execute("SELECT * FROM items WHERE barcode = ?", (barcode,)).fetchone()
    if item:
        item_dict = dict(item)
        # Check if item is currently loaned
        loan = conn.execute(
            "SELECT * FROM loans WHERE item_id = ? AND return_date IS NULL",
            (item["id"],)
        ).fetchone()
        if loan:
            # Loaned: include loaner info
            user = conn.execute("SELECT id, name, barcode FROM users WHERE id = ?", (loan["user_id"],)).fetchone()
            conn.close()
            return jsonify({
                "type": "item",
                "item": item_dict,
                "loaned": True,
                "loan": dict(loan),
                "loaned_to": dict(user) if user else None
            })
        else:
            conn.close()
            return jsonify({"type": "item", "item": item_dict, "loaned": False})

    # Try user
    user = conn.execute("SELECT * FROM users WHERE barcode = ?", (barcode,)).fetchone()
    if user:
        user_dict = dict(user)
        # Remove sensitive info for non-admins
        user_dict.pop("email", None)
        user_dict.pop("phone", None)
        user_dict.pop("password_hash", None)

        # Get user's active loans
        loans = conn.execute(
            """
            SELECT loans.id, loans.item_id, loans.loan_date, loans.due_date,
                   items.name as item_name, items.barcode as item_barcode
            FROM loans
            LEFT JOIN items ON loans.item_id = items.id
            WHERE loans.user_id = ? AND loans.return_date IS NULL
            ORDER BY loans.loan_date DESC
            """,
            (user["id"],)
        ).fetchall()

        conn.close()
        return jsonify({
            "type": "user",
            "user": user_dict,
            "active_loans": [dict(l) for l in loans]
        })

    conn.close()
    return jsonify({"type": "unknown", "barcode": barcode}), 200


@app.route("/items", methods=["GET"])
def list_items():
    """List all items with their current loan status (public view)."""
    conn = get_db()
    items = conn.execute("SELECT * FROM items ORDER BY name").fetchall()

    result = []
    for item in items:
        item_dict = dict(item)
        # Check current loan
        loan = conn.execute(
            "SELECT loans.*, users.name as user_name FROM loans "
            "LEFT JOIN users ON loans.user_id = users.id "
            "WHERE loans.item_id = ? AND loans.return_date IS NULL",
            (item["id"],)
        ).fetchone()
        if loan:
            item_dict["loaned_to"] = loan["user_name"]
            item_dict["due_date"] = loan["due_date"]
        else:
            item_dict["loaned_to"] = None
            item_dict["due_date"] = None
        result.append(item_dict)

    conn.close()
    return jsonify(result)


@app.route("/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    """Get item details including current loan and history."""
    conn = get_db()
    item = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    item_dict = dict(item)

    # Active loan
    loan = conn.execute(
        "SELECT loans.*, users.name as user_name, users.barcode as user_barcode "
        "FROM loans "
        "LEFT JOIN users ON loans.user_id = users.id "
        "WHERE loans.item_id = ? AND loans.return_date IS NULL",
        (item_id,)
    ).fetchone()
    item_dict["active_loan"] = dict(loan) if loan else None

    # Loan history
    loans = conn.execute(
        """
        SELECT loans.id, loans.user_id, loans.loan_date, loans.due_date, loans.return_date,
               users.name as user_name
        FROM loans
        LEFT JOIN users ON loans.user_id = users.id
        WHERE loans.item_id = ?
        ORDER BY loans.loan_date DESC
        """,
        (item_id,)
    ).fetchall()
    item_dict["history"] = [dict(l) for l in loans]

    conn.close()
    return jsonify(item_dict)


@app.route("/users", methods=["GET"])
def list_users():
    """List all users (public view: no sensitive info)."""
    conn = get_db()
    users = conn.execute("SELECT id, name, role, barcode, class_year FROM users ORDER BY name").fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


@app.route("/users/search", methods=["POST"])
def search_users_by_name():
    """Search users by name. Used for login selection."""
    data = request.json or {}
    name = data.get("name", "").strip()

    if not name:
        return jsonify([]), 200

    conn = get_db()
    users = conn.execute(
        "SELECT id, name, role, barcode, class_year FROM users WHERE name LIKE ? ORDER BY name",
        (f"%{name}%",)
    ).fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


@app.route("/auth/user/login", methods=["POST"])
def user_login():
    """User login by name and password. Creates user if doesn't exist (with password and class)."""
    data = request.json or {}
    name = data.get("name", "").strip()
    password = data.get("password", "")
    user_id = data.get("user_id")  # Optional: if selecting from search results
    class_year = data.get("class_year", "").strip()  # Optional: for new user registration

    if not name and not user_id:
        return jsonify({"error": "Navn eller bruker_id påkrevd"}), 400

    conn = get_db()

    # If user_id provided, verify password
    if user_id:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "Bruker ikke funnet"}), 404

        # Check password
        if user["password_hash"]:
            if not password or not check_password_hash(user["password_hash"], password):
                conn.close()
                return jsonify({"error": "Feil passord"}), 401
    else:
        # Search for exact match first
        user = conn.execute("SELECT * FROM users WHERE name = ?", (name,)).fetchone()

        # If not found, create new user (requires password and class_year)
        if not user:
            if not password:
                conn.close()
                return jsonify({"error": "Passord påkrevd for ny bruker"}), 400
            if not class_year:
                conn.close()
                return jsonify({"error": "Klasse påkrevd for ny bruker"}), 400

            try:
                c = conn.cursor()
                password_hash = generate_password_hash(password)
                c.execute(
                    "INSERT INTO users (name, role, password_hash, class_year, created_at, updated_at) VALUES (?, 'user', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                    (name, password_hash, class_year)
                )
                conn.commit()
                user_id_new = c.lastrowid
                user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id_new,)).fetchone()
            except Exception as e:
                conn.rollback()
                conn.close()
                return jsonify({"error": "Kunne ikke opprette bruker", "detail": str(e)}), 500
        else:
            # User exists, verify password
            if user["password_hash"]:
                if not password or not check_password_hash(user["password_hash"], password):
                    conn.close()
                    return jsonify({"error": "Feil passord"}), 401
            else:
                # User exists but has no password - set it now
                if not password:
                    conn.close()
                    return jsonify({"error": "Passord påkrevd"}), 400
                if not class_year:
                    conn.close()
                    return jsonify({"error": "Klasse påkrevd"}), 400

                password_hash = generate_password_hash(password)
                conn.execute(
                    "UPDATE users SET password_hash = ?, class_year = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (password_hash, class_year, user["id"])
                )
                conn.commit()
                user = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()

    # Set user session
    session["user_id"] = user["id"]
    session["is_user"] = True

    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    user_dict.pop("email", None)
    user_dict.pop("phone", None)

    conn.close()
    return jsonify({"message": "ok", "user": user_dict}), 200


@app.route("/auth/user/logout", methods=["POST"])
def user_logout():
    """User logout."""
    session.pop("user_id", None)
    session.pop("is_user", None)
    return jsonify({"message": "Logged out"}), 200


@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    """Get user details and loan history (public view)."""
    conn = get_db()
    user = conn.execute("SELECT id, name, role, barcode, class_year FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    # Loan history
    loans = conn.execute(
        """
        SELECT loans.id, loans.item_id, loans.loan_date, loans.due_date, loans.return_date,
               items.name as item_name, items.barcode as item_barcode
        FROM loans
        LEFT JOIN items ON loans.item_id = items.id
        WHERE loans.user_id = ?
        ORDER BY loans.loan_date DESC
        """,
        (user_id,)
    ).fetchall()

    conn.close()
    return jsonify({
        "user": dict(user),
        "loans": [dict(l) for l in loans]
    })


# ============================================================================
# LOAN OPERATIONS (public: barcode-based, no auth)
# ============================================================================

@app.route("/loans", methods=["POST"])
def create_loan():
    """
    Create a loan. Uses session user_id if available, otherwise requires user_barcode.
    Request: {"user_barcode": "...", "item_barcode": "..." or "item_id": 123, "due_date": "YYYY-MM-DD", "is_manual": boolean}
    Response: loan object
    """
    data = request.json or {}
    user_barcode = data.get("user_barcode", "").strip()
    item_barcode = data.get("item_barcode", "").strip()
    item_id = data.get("item_id")
    due_date = data.get("due_date")
    is_manual = data.get("is_manual", False)

    if not due_date:
        return jsonify({"error": "due_date required"}), 400

    if not item_barcode and not item_id:
        return jsonify({"error": "item_barcode or item_id required"}), 400

    conn = get_db()

    # Resolve user: try session first, then barcode
    user_id = None
    if session.get("is_user"):
        user_id = session["user_id"]
    elif session.get("is_admin") and data.get("user_id"):
        user_id = data.get("user_id")
    elif user_barcode:
        user = conn.execute("SELECT id FROM users WHERE barcode = ?", (user_barcode,)).fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "User barcode not found"}), 404
        user_id = user["id"]
    else:
        conn.close()
        return jsonify({"error": "user_barcode or user session required"}), 400

    # Resolve item
    item = None
    if item_id:
        item = conn.execute("SELECT id, quantity FROM items WHERE id = ?", (item_id,)).fetchone()
    elif item_barcode:
        item = conn.execute("SELECT id, quantity FROM items WHERE barcode = ?", (item_barcode,)).fetchone()

    if not item:
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    if item["quantity"] < 1:
        conn.close()
        return jsonify({"error": "Item not available"}), 400

    # Create loan
    try:
        c = conn.cursor()
        c.execute(
            "UPDATE items SET quantity = quantity - 1 WHERE id = ?",
            (item["id"],)
        )
        c.execute(
            "INSERT INTO loans (item_id, user_id, loan_date, due_date, created_at) "
            "VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)",
            (item["id"], user_id, due_date)
        )
        conn.commit()
        loan_id = c.lastrowid

        if is_manual:
            c.execute(
                "INSERT INTO flags (item_id, user_id, flag_type, message, created_at) "
                "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
                (item["id"], user_id, "manual_loan", f"Loan {loan_id} was created manually.",)
            )
            conn.commit()

        loan = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
        conn.close()
        return jsonify(dict(loan)), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not create loan", "detail": str(e)}), 500


@app.route("/loans/<int:loan_id>/return", methods=["POST"])
def return_loan(loan_id):
    """
    Return an item (mark loan as returned). Uses session user_id if available, otherwise requires user_barcode.
    Request: {"user_barcode": "...", "return_message": "..."} or uses session
    If return_message is provided, creates a flag for admin review.
    """
    try:
        data = request.json or {}
    except Exception:
        data = {}

    user_barcode = data.get("user_barcode", "").strip() if data else ""
    return_message = data.get("return_message", "").strip() if data else ""

    conn = get_db()

    # Resolve user: try session first, then barcode
    user_id = None

    if session.get("is_user"):
        user_id = session.get("user_id")
    elif session.get("is_admin") and data.get("user_id"):
        user_id = data.get("user_id")
    elif user_barcode:
        user = conn.execute("SELECT id FROM users WHERE barcode = ?", (user_barcode,)).fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "Brukerstrekkode ikke funnet"}), 404
        user_id = user["id"]
    else:
        conn.close()
        return jsonify({"error": "user_barcode eller brukersesjon påkrevd. Vennligst logg inn på nytt."}), 400

    # Get loan and verify it belongs to this user
    loan = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
    if not loan:
        conn.close()
        return jsonify({"error": "Lån ikke funnet"}), 404

    if loan["user_id"] != user_id and not session.get("is_admin"):
        conn.close()
        return jsonify({"error": "Lånet tilhører ikke denne brukeren"}), 401

    if loan["return_date"] is not None:
        conn.close()
        return jsonify({"error": "Lån allerede returnert"}), 400

    try:
        c = conn.cursor()
        c.execute(
            "UPDATE loans SET return_date = CURRENT_TIMESTAMP WHERE id = ?",
            (loan_id,)
        )
        c.execute(
            "UPDATE items SET quantity = quantity + 1 WHERE id = ?",
            (loan["item_id"],)
        )

        # If user provided a return message, create a flag for admin
        if return_message:
            item = conn.execute("SELECT name FROM items WHERE id = ?", (loan["item_id"],)).fetchone()
            item_name = item["name"] if item else f"Item {loan['item_id']}"
            user = conn.execute("SELECT name FROM users WHERE id = ?", (user_id,)).fetchone()
            user_name = user["name"] if user else f"User {user_id}"

            flag_message = f"Bruker {user_name} returnerte gjenstand '{item_name}' med melding:\n\n{return_message}"
            c.execute(
                "INSERT INTO flags (item_id, user_id, loan_id, flag_type, message, status, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                (loan["item_id"], user_id, loan_id, "return_message", flag_message, "under_vurdering")
            )

        conn.commit()

        updated = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
        conn.close()
        return jsonify(dict(updated))
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Kunne ikke returnere lån", "detail": str(e)}), 500


@app.route("/users/me/loans", methods=["GET"])
def get_user_loans():
    """Get active loans for current logged-in user."""
    if not session.get("is_user"):
        return jsonify({"error": "Brukersesjon påkrevd"}), 401

    user_id = session["user_id"]
    conn = get_db()

    loans = conn.execute(
        """
        SELECT loans.id, loans.item_id, loans.loan_date, loans.due_date,
               items.name as item_name, items.barcode as item_barcode,
               items.category, items.location
        FROM loans
        LEFT JOIN items ON loans.item_id = items.id
        WHERE loans.user_id = ? AND loans.return_date IS NULL
        ORDER BY loans.due_date ASC
        """,
        (user_id,)
    ).fetchall()

    conn.close()
    return jsonify([dict(l) for l in loans])


@app.route("/loans/<int:loan_id>/extend", methods=["POST"])
def extend_loan(loan_id):
    """
    Extend a loan. No auth, but verifies user_barcode.
    Request: {"user_barcode": "...", "new_due_date": "YYYY-MM-DD"}
    """
    data = request.json or {}
    user_barcode = data.get("user_barcode", "").strip()
    new_due_date = data.get("new_due_date")

    if not user_barcode or not new_due_date:
        return jsonify({"error": "user_barcode and new_due_date required"}), 400

    conn = get_db()

    # Resolve user
    user = conn.execute("SELECT id FROM users WHERE barcode = ?", (user_barcode,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "User barcode not found"}), 404

    # Get loan and verify it belongs to this user
    loan = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
    if not loan:
        conn.close()
        return jsonify({"error": "Loan not found"}), 404

    if loan["user_id"] != user["id"]:
        conn.close()
        return jsonify({"error": "Loan does not belong to this user"}), 401

    if loan["return_date"] is not None:
        conn.close()
        return jsonify({"error": "Cannot extend returned loan"}), 400

    try:
        conn.execute("UPDATE loans SET due_date = ? WHERE id = ?", (new_due_date, loan_id))
        conn.commit()

        updated = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
        conn.close()
        return jsonify(dict(updated))
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not extend loan", "detail": str(e)}), 500


# ============================================================================
# FLAGS (public: create flag, admin: list/resolve)
# ============================================================================

@app.route("/flags", methods=["POST"])
def create_flag():
    """
    Create a flag (missing barcode, defect, etc). No auth required.
    Request: {"item_id": 123, "flag_type": "missing_barcode"|"defect"|"overdue"|..., "message": "..."}
    """
    data = request.json or {}
    item_id = data.get("item_id")
    flag_type = data.get("flag_type", "general")
    message = data.get("message", "")

    if not item_id:
        return jsonify({"error": "item_id required"}), 400

    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            "INSERT INTO flags (item_id, flag_type, message, created_at) "
            "VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            (item_id, flag_type, message)
        )
        conn.commit()
        flag_id = c.lastrowid

        # Send notification to admins
        subj = f"New flag created: {flag_type}"
        body = f"A new flag has been created:\n\n"
        body += f"Flag ID: {flag_id}\n"
        body += f"Item ID: {item_id}\n"
        body += f"Type: {flag_type}\n"
        body += f"Message: {message}\n"
        send_notification(subj, body)

        conn.close()
        return jsonify({"message": "Flag created"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not create flag", "detail": str(e)}), 500


@app.route("/admin/flags", methods=["GET"])
@admin_required
def list_flags():
    """List all flags (admin only). Unresolved flags first, then by date."""
    conn = get_db()
    flags = conn.execute(
        """
        SELECT flags.*,
               items.name as item_name, items.barcode as item_barcode,
               users.name as user_name, users.class_year
        FROM flags
        LEFT JOIN items ON flags.item_id = items.id
        LEFT JOIN users ON flags.user_id = users.id
        ORDER BY
          CASE
            WHEN flags.status = 'under_vurdering' OR flags.resolved = 0 THEN 0
            WHEN flags.status = 'ferdig' OR flags.resolved = 1 THEN 1
            ELSE 2
          END,
          flags.created_at DESC
        """
    ).fetchall()
    conn.close()
    return jsonify([dict(f) for f in flags])


@app.route("/admin/flags/<int:flag_id>/resolve", methods=["PUT"])
@admin_required
def resolve_flag(flag_id):
    """Update flag status and resolution notes (admin only)."""
    data = request.json or {}
    status = data.get("status", "ferdig")  # under_vurdering, ferdig, avvist
    resolution_notes = data.get("resolution_notes", "").strip()

    conn = get_db()
    flag = conn.execute("SELECT * FROM flags WHERE id = ?", (flag_id,)).fetchone()
    if not flag:
        conn.close()
        return jsonify({"error": "Flagg ikke funnet"}), 404

    try:
        resolved = 1 if status == "ferdig" else 0
        resolved_at = "CURRENT_TIMESTAMP" if resolved else None

        if resolution_notes:
            if resolved_at:
                conn.execute(
                    "UPDATE flags SET status = ?, resolved = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ? WHERE id = ?",
                    (status, resolved, resolution_notes, flag_id)
                )
            else:
                conn.execute(
                    "UPDATE flags SET status = ?, resolved = ?, resolution_notes = ? WHERE id = ?",
                    (status, resolved, resolution_notes, flag_id)
                )
        else:
            if resolved_at:
                conn.execute(
                    "UPDATE flags SET status = ?, resolved = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (status, resolved, flag_id)
                )
            else:
                conn.execute(
                    "UPDATE flags SET status = ?, resolved = ? WHERE id = ?",
                    (status, resolved, flag_id)
                )
        conn.commit()

        updated = conn.execute("SELECT * FROM flags WHERE id = ?", (flag_id,)).fetchone()
        conn.close()
        return jsonify(dict(updated))
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Kunne ikke oppdatere flagg", "detail": str(e)}), 500


# ============================================================================
# ADMIN ENDPOINTS (auth required)
# ============================================================================

@app.route("/auth/login", methods=["POST"])
def auth_login():
    """Admin login with username + password."""
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Invalid credentials"}), 401

    if not check_password_hash(user["password_hash"] or "", password):
        conn.close()
        return jsonify({"error": "Invalid credentials"}), 401

    if user["role"] not in ("admin", "staff"):
        conn.close()
        return jsonify({"error": "User does not have admin privileges"}), 401

    # Set session
    session["admin_id"] = user["id"]
    session["is_admin"] = True
    print(f"DEBUG: After login - session: {session}")

    conn.close()
    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    return jsonify({"message": "ok", "user": user_dict}), 200


@app.route("/auth/logout", methods=["POST"])
def auth_logout():
    """Admin logout."""
    session.clear()
    print(f"DEBUG: After logout - session: {session}")
    return jsonify({"message": "Logged out"}), 200


@app.route("/auth/me", methods=["GET"])
def auth_me():
    """Get current admin or user session."""
    conn = get_db()

    # Check admin session
    if session.get("is_admin"):
        user = conn.execute("SELECT id, name, role, barcode FROM users WHERE id = ?", (session.get("admin_id"),)).fetchone()
        conn.close()
        if not user:
            session.clear()
            return jsonify({"is_admin": False, "is_user": False, "user": None}), 200
        user_dict = dict(user)
        user_dict.pop("password_hash", None)
        return jsonify({"is_admin": True, "is_user": False, "user": user_dict}), 200

    # Check user session
    if session.get("is_user"):
        user_id = session.get("user_id")
        if user_id:
            user = conn.execute("SELECT id, name, role, barcode, class_year FROM users WHERE id = ?", (user_id,)).fetchone()
            conn.close()
            if not user:
                session.pop("user_id", None)
                session.pop("is_user", None)
                return jsonify({"is_admin": False, "is_user": False, "user": None}), 200
            user_dict = dict(user)
            user_dict.pop("password_hash", None)
            user_dict.pop("email", None)
            user_dict.pop("phone", None)
            return jsonify({"is_admin": False, "is_user": True, "user": user_dict}), 200

    conn.close()
    return jsonify({"is_admin": False, "is_user": False, "user": None}), 200


@app.route("/admin/users", methods=["GET"])
@admin_required
def admin_list_users():
    """List all users (admin view: with contact info)."""
    conn = get_db()
    users = conn.execute("SELECT * FROM users ORDER BY name").fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


@app.route("/admin/users/<int:user_id>", methods=["GET"])
@admin_required
def admin_get_user(user_id):
    """Get user details (admin view)."""
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    # Get loans
    loans = conn.execute(
        """
        SELECT loans.id, loans.item_id, loans.loan_date, loans.due_date, loans.return_date,
               items.name as item_name
        FROM loans
        LEFT JOIN items ON loans.item_id = items.id
        WHERE loans.user_id = ?
        ORDER BY loans.loan_date DESC
        """,
        (user_id,)
    ).fetchall()

    conn.close()
    return jsonify({
        "user": dict(user),
        "loans": [dict(l) for l in loans]
    })


@app.route("/admin/users", methods=["POST"])
@admin_required
def admin_add_user():
    """Add a new user (admin only)."""
    data = request.json or {}
    name = data.get("name", "").strip()
    barcode = data.get("barcode", "").strip()
    class_year = data.get("class_year", "").strip()
    role = data.get("role", "user")
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not name:
        return jsonify({"error": "name required"}), 400

    conn = get_db()
    try:
        pw_hash = generate_password_hash(password) if password else None
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO users (name, barcode, class_year, role, username, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """,
            (name, barcode or None, class_year or None, role, username or None, pw_hash)
        )
        conn.commit()
        user_id = c.lastrowid

        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        conn.close()
        return jsonify(dict(user)), 201
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Duplicate barcode or username"}), 400
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not add user", "detail": str(e)}), 500


@app.route("/admin/users/<int:user_id>", methods=["PUT"])
@admin_required
def admin_update_user(user_id):
    """Update user (admin only)."""
    data = request.json or {}
    fields = {k: data.get(k) for k in ("name", "barcode", "class_year", "role", "username", "email", "phone", "notes")}

    set_parts = []
    values = []
    for k, v in fields.items():
        if v is not None:
            set_parts.append(f"{k} = ?")
            values.append(v)

    if not set_parts:
        return jsonify({"error": "No fields to update"}), 400

    values.append(user_id)
    sql = f"UPDATE users SET {', '.join(set_parts)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"

    conn = get_db()
    try:
        conn.execute(sql, tuple(values))
        conn.commit()

        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "User not found"}), 404

        conn.close()
        return jsonify(dict(user))
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Duplicate barcode or username"}), 400
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not update user", "detail": str(e)}), 500


@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def admin_delete_user(user_id):
    """Delete user (admin only)."""
    # Prevent deletion of self
    if user_id == session.get("admin_id"):
        return jsonify({"error": "Cannot delete yourself"}), 400

    conn = get_db()

    # Check for active loans
    active = conn.execute(
        "SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND return_date IS NULL",
        (user_id,)
    ).fetchone()

    if active["count"] > 0:
        conn.close()
        return jsonify({"error": "Cannot delete user with active loans. Return loans first."}), 400

    try:
        # Anonymize old loans (set user_id to NULL)
        conn.execute("UPDATE loans SET user_id = NULL WHERE user_id = ?", (user_id,))
        # Delete user
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "User deleted (loans anonymized)"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not delete user", "detail": str(e)}), 500


@app.route("/admin/users/batch_delete", methods=["POST"])
@admin_required
def admin_batch_delete_users():
    """Delete multiple users (admin only)."""
    data = request.json or {}
    user_ids = data.get("user_ids", [])

    if not user_ids:
        return jsonify({"error": "user_ids required"}), 400

    conn = get_db()
    c = conn.cursor()

    deleted_count = 0
    errors = []

    for user_id in user_ids:
        # Prevent deletion of self
        if user_id == session.get("admin_id"):
            errors.append(f"Cannot delete yourself (user_id: {user_id})")
            continue

        # Check for active loans
        active = c.execute(
            "SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND return_date IS NULL",
            (user_id,)
        ).fetchone()

        if active["count"] > 0:
            errors.append(f"Cannot delete user {user_id} with active loans.")
            continue

        try:
            # Anonymize old loans (set user_id to NULL)
            c.execute("UPDATE loans SET user_id = NULL WHERE user_id = ?", (user_id,))
            # Delete user
            c.execute("DELETE FROM users WHERE id = ?", (user_id,))
            deleted_count += 1
        except Exception as e:
            errors.append(f"Could not delete user {user_id}: {str(e)}")
            conn.rollback()

    conn.commit()
    conn.close()

    if errors:
        return jsonify({"message": f"{deleted_count} users deleted, but some errors occurred.", "errors": errors}), 207

    return jsonify({"message": f"{deleted_count} users deleted successfully."})


@app.route("/admin/items", methods=["GET"])
@admin_required
def admin_list_items():
    """List all items (admin view)."""
    conn = get_db()
    items = conn.execute("SELECT * FROM items ORDER BY name").fetchall()
    conn.close()
    return jsonify([dict(i) for i in items])


@app.route("/admin/items/<int:item_id>", methods=["GET"])
@admin_required
def admin_get_item(item_id):
    """Get item details (admin view)."""
    conn = get_db()
    item = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    # Get loans
    loans = conn.execute(
        """
        SELECT loans.id, loans.user_id, loans.loan_date, loans.due_date, loans.return_date,
               users.name as user_name
        FROM loans
        LEFT JOIN users ON loans.user_id = users.id
        WHERE loans.item_id = ?
        ORDER BY loans.loan_date DESC
        """,
        (item_id,)
    ).fetchall()

    conn.close()
    return jsonify({
        "item": dict(item),
        "loans": [dict(l) for l in loans]
    })


@app.route("/admin/items", methods=["POST"])
@admin_required
def admin_add_item():
    """Add a new item (admin only)."""
    data = request.json or {}
    name = data.get("name", "").strip()
    barcode = data.get("barcode", "").strip()
    category = data.get("category", "").strip()
    location = data.get("location", "").strip()
    description = data.get("description", "").strip()
    quantity = int(data.get("quantity", 1) or 1)

    if not name:
        return jsonify({"error": "name required"}), 400

    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO items (name, barcode, category, location, description, quantity, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """,
            (name, barcode or None, category or None, location or None, description or None, quantity)
        )
        conn.commit()
        item_id = c.lastrowid

        item = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        conn.close()
        return jsonify(dict(item)), 201
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Duplicate barcode"}), 400
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not add item", "detail": str(e)}), 500


@app.route("/admin/items/<int:item_id>", methods=["PUT"])
@admin_required
def admin_update_item(item_id):
    """Update item (admin only)."""
    data = request.json or {}
    fields = {k: data.get(k) for k in ("name", "barcode", "category", "location", "description", "quantity", "status", "notes")}

    set_parts = []
    values = []
    for k, v in fields.items():
        if v is not None:
            set_parts.append(f"{k} = ?")
            values.append(v)

    if not set_parts:
        return jsonify({"error": "No fields to update"}), 400

    values.append(item_id)
    sql = f"UPDATE items SET {', '.join(set_parts)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"

    conn = get_db()
    try:
        conn.execute(sql, tuple(values))
        conn.commit()

        item = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        if not item:
            conn.close()
            return jsonify({"error": "Item not found"}), 404

        conn.close()
        return jsonify(dict(item))
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Duplicate barcode"}), 400
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not update item", "detail": str(e)}), 500


@app.route("/admin/items/<int:item_id>", methods=["DELETE"])
@admin_required
def admin_delete_item(item_id):
    """Delete item (admin only)."""
    conn = get_db()

    # Check for active loans
    active = conn.execute(
        "SELECT COUNT(*) as count FROM loans WHERE item_id = ? AND return_date IS NULL",
        (item_id,)
    ).fetchone()

    if active["count"] > 0:
        conn.close()
        return jsonify({"error": "Cannot delete item with active loans."}), 400

    try:
        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Item deleted"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not delete item", "detail": str(e)}), 500


@app.route("/admin/classes", methods=["GET"])
@admin_required
def admin_list_classes():
    """Get a list of all unique classes."""
    conn = get_db()
    classes = conn.execute("SELECT DISTINCT class_year FROM users WHERE class_year IS NOT NULL ORDER BY class_year").fetchall()
    conn.close()
    return jsonify([c["class_year"] for c in classes])


@app.route("/admin/classes/<string:class_year>/users", methods=["GET"])
@admin_required
def admin_list_users_in_class(class_year):
    """Get all users in a specific class."""
    conn = get_db()
    users = conn.execute("SELECT * FROM users WHERE class_year = ? ORDER BY name", (class_year,)).fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


@app.route("/admin/classes/<string:class_year>", methods=["DELETE"])
@admin_required
def admin_delete_class(class_year):
    """Delete a class by setting the class_year of all users in that class to NULL."""
    conn = get_db()
    try:
        conn.execute("UPDATE users SET class_year = NULL WHERE class_year = ?", (class_year,))
        conn.commit()
        conn.close()
        return jsonify({"message": f"Class '{class_year}' deleted successfully."})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Could not delete class", "detail": str(e)}), 500


@app.route("/admin/loans", methods=["GET"])
@admin_required
def admin_list_loans():
    """List all active loans (admin only)."""
    conn = get_db()
    loans = conn.execute(
        """
        SELECT loans.*,
               items.name as item_name, items.barcode as item_barcode,
               users.name as user_name, users.class_year
        FROM loans
        LEFT JOIN items ON loans.item_id = items.id
        LEFT JOIN users ON loans.user_id = users.id
        WHERE loans.return_date IS NULL
        ORDER BY loans.due_date ASC
        """
    ).fetchall()
    conn.close()
    return jsonify([dict(l) for l in loans])


@app.route("/admin/loans/<int:loan_id>/delivery", methods=["PUT"])
@admin_required
def admin_update_delivery(loan_id):
    """Update delivery status and notes for a loan (admin only)."""
    data = request.json or {}
    delivery_status = data.get("delivery_status", "").strip()
    delivery_notes = data.get("delivery_notes", "").strip()

    conn = get_db()
    loan = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
    if not loan:
        conn.close()
        return jsonify({"error": "Lån ikke funnet"}), 404

    try:
        updates = []
        values = []
        if delivery_status:
            updates.append("delivery_status = ?")
            values.append(delivery_status)
        if delivery_notes is not None:
            updates.append("delivery_notes = ?")
            values.append(delivery_notes)

        if not updates:
            conn.close()
            return jsonify({"error": "Ingen oppdateringer angitt"}), 400

        values.append(loan_id)
        sql = f"UPDATE loans SET {', '.join(updates)} WHERE id = ?"
        conn.execute(sql, tuple(values))
        conn.commit()

        updated = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
        conn.close()
        return jsonify(dict(updated))
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Kunne ikke oppdatere levering", "detail": str(e)}), 500


@app.route("/admin/loans/<int:loan_id>/report", methods=["PUT"])
@admin_required
def admin_update_report(loan_id):
    """Update report for a loan (admin only)."""
    data = request.json or {}
    report = data.get("report", "").strip()

    conn = get_db()
    loan = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
    if not loan:
        conn.close()
        return jsonify({"error": "Lån ikke funnet"}), 404

    try:
        conn.execute("UPDATE loans SET report = ? WHERE id = ?", (report, loan_id))
        conn.commit()

        updated = conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
        conn.close()
        return jsonify(dict(updated))
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Kunne ikke oppdatere rapport", "detail": str(e)}), 500


@app.route("/admin/gdpr_cleanup", methods=["POST"])
@admin_required
def admin_gdpr_cleanup():
    """
    GDPR cleanup: delete users created 3+ years ago with no active loans.
    Anonymize their loan history (set user_id to NULL).
    """
    conn = get_db()
    c = conn.cursor()

    try:
        # Find users older than 3 years with no active loans
        cutoff = (datetime.now() - timedelta(days=3*365)).isoformat()
        rows = c.execute(
            "SELECT id FROM users WHERE created_at < ? AND role = 'user'",
            (cutoff,)
        ).fetchall()

        removed = 0
        anonymized_loans = 0

        for row in rows:
            uid = row[0]
            active = c.execute(
                "SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND return_date IS NULL",
                (uid,)
            ).fetchone()

            if active["count"] > 0:
                continue

            # Anonymize loans
            c.execute("UPDATE loans SET user_id = NULL WHERE user_id = ?", (uid,))
            anonymized_loans += c.rowcount

            # Delete user
            c.execute("DELETE FROM users WHERE id = ?", (uid,))
            removed += c.rowcount

        conn.commit()
        conn.close()

        return jsonify({
            "message": "GDPR cleanup completed",
            "removed_users": removed,
            "anonymized_loans": anonymized_loans
        }), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Cleanup failed", "detail": str(e)}), 500


@app.route("/admin/check_overdue", methods=["POST"])
@admin_required
def admin_check_overdue():
    """Check for overdue loans and send a notification."""
    conn = get_db()
    overdue_loans = conn.execute(
        "SELECT * FROM loans WHERE due_date < ? AND return_date IS NULL",
        (datetime.now().isoformat(),)
    ).fetchall()
    conn.close()

    if not overdue_loans:
        return jsonify({"message": "No overdue loans"}), 200

    for loan in overdue_loans:
        # Flagging overdue loans
        conn = get_db()
        conn.execute(
            "INSERT INTO flags (item_id, user_id, flag_type, message, created_at) "
            "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            (loan["item_id"], loan["user_id"], "overdue", f"Loan {loan['id']} is overdue.",)
        )
        conn.commit()
        conn.close()

    # send notification
    subject = "Overdue Loans Report"
    body = "The following loans are overdue:\n\n"
    for loan in overdue_loans:
        body += f"Loan ID: {loan['id']}, Item ID: {loan['item_id']}, User ID: {loan['user_id']}, Due Date: {loan['due_date']}\n"

    send_notification(subject, body)

    return jsonify({"message": f"{len(overdue_loans)} overdue loans found and flagged. Notification sent."})


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ============================================================================
# INIT & RUN
# ============================================================================

if __name__ == "__main__":
    init_db()
    print("🚀 Starting Lager System API on http://127.0.0.1:5000")
    app.run(debug=True, host="127.0.0.1", port=5000)
