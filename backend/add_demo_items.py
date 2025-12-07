#!/usr/bin/env python3
"""
Script to add demo items for Driftstøtte.
Run this script to populate the database with sample items.
"""

import sqlite3
from pathlib import Path

# DB path at repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
DB_NAME = str(REPO_ROOT / "lager.db")

demo_items = [
    # Кабели и разъемы
    {
        "name": "HDMI-kabel 2m",
        "description": "Høyhastighets HDMI-kabel for dataprojektorer og skjermer",
        "barcode": "CBL-HDMI-001",
        "category": "Kabler",
        "location": "Skap A1",
        "quantity": 15
    },
    {
        "name": "USB-C til USB-A kabel",
        "description": "Ladekabel for laptops og tablets",
        "barcode": "CBL-USBC-001",
        "category": "Kabler",
        "location": "Skap A1",
        "quantity": 20
    },
    {
        "name": "Ethernet-kabel Cat6 5m",
        "description": "Nettverkskabel for fast nett",
        "barcode": "CBL-ETH-001",
        "category": "Kabler",
        "location": "Skap A1",
        "quantity": 12
    },
    {
        "name": "Stromkabel C13",
        "description": "Standard strømkabel for datamaskiner",
        "barcode": "CBL-PWR-001",
        "category": "Kabler",
        "location": "Skap A1",
        "quantity": 25
    },

    # Компьютеры и ноутбуки
    {
        "name": "Laptop Dell Latitude 5420",
        "description": "Bedriftslaptop med Intel i5, 16GB RAM, 256GB SSD",
        "barcode": "LAP-DELL-001",
        "category": "Datamaskiner",
        "location": "Lagret B2",
        "quantity": 3
    },
    {
        "name": "Laptop HP EliteBook 850",
        "description": "Bedriftslaptop med Intel i7, 16GB RAM, 512GB SSD",
        "barcode": "LAP-HP-001",
        "category": "Datamaskiner",
        "location": "Lagret B2",
        "quantity": 2
    },
    {
        "name": "MacBook Air M1",
        "description": "Apple MacBook Air med M1-prosessor, 8GB RAM, 256GB SSD",
        "barcode": "LAP-MAC-001",
        "category": "Datamaskiner",
        "location": "Lagret B2",
        "quantity": 1
    },
    {
        "name": "Desktop PC - Standard",
        "description": "Stationær PC med Intel i5, 8GB RAM, 500GB HDD",
        "barcode": "PC-STD-001",
        "category": "Datamaskiner",
        "location": "Kontor C1",
        "quantity": 5
    },

    # Проекторы и дисплеи
    {
        "name": "Data projektor Epson EB-X41",
        "description": "LCD-projektor, 3600 lumen, WXGA oppløsning",
        "barcode": "PRJ-EPS-001",
        "category": "Projeksjon",
        "location": "Kontor C2",
        "quantity": 4
    },
    {
        "name": "LED-skjerm 27 tommer",
        "description": "Ekstern skjerm Dell UltraSharp 27\"",
        "barcode": "SCR-DELL-001",
        "category": "Skjermer",
        "location": "Kontor C2",
        "quantity": 8
    },

    # Периферия
    {
        "name": "Trådløs tastatur og mus Logitech",
        "description": "Kombinasjon av trådløst tastatur og mus, USB-mottaker",
        "barcode": "PER-LOG-001",
        "category": "Periferi",
        "location": "Skap A2",
        "quantity": 10
    },
    {
        "name": "Webkamera Logitech C920",
        "description": "HD-webkamera for videomøter",
        "barcode": "CAM-LOG-001",
        "category": "Periferi",
        "location": "Skap A2",
        "quantity": 6
    },
    {
        "name": "USB-hub 4-port",
        "description": "USB 3.0-hub med fire porter",
        "barcode": "HUB-USB-001",
        "category": "Periferi",
        "location": "Skap A2",
        "quantity": 12
    },

    # Сетевые устройства
    {
        "name": "WiFi-ruter TP-Link Archer",
        "description": "Trådløs ruter med dual-band 2.4/5 GHz",
        "barcode": "NET-TPL-001",
        "category": "Nettverk",
        "location": "Teknisk rom D1",
        "quantity": 3
    },
    {
        "name": "Nettverksswitch 8-port",
        "description": "Gigabit Ethernet switch",
        "barcode": "NET-SW-001",
        "category": "Nettverk",
        "location": "Teknisk rom D1",
        "quantity": 5
    },

    # Дополнительное оборудование
    {
        "name": "Dokumentkamera Elmo",
        "description": "Kamera for visning av dokumenter og objekter",
        "barcode": "CAM-ELM-001",
        "category": "Projeksjon",
        "location": "Kontor C2",
        "quantity": 2
    },
    {
        "name": "Lydanlegg med mikrofon",
        "description": "Trådløs lydanlegg med opptil 4 mikrofoner",
        "barcode": "AUD-SYS-001",
        "category": "Lyd",
        "location": "Kontor C3",
        "quantity": 2
    },
    {
        "name": "Kabelorganisator",
        "description": "Boks for organisering av kabler og adaptere",
        "barcode": "ACC-ORG-001",
        "category": "Tilbehør",
        "location": "Skap A3",
        "quantity": 8
    }
]

def add_demo_items():
    """Add demo items to the database."""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    added_count = 0
    skipped_count = 0

    for item in demo_items:
        # Check if item with this barcode already exists
        existing = c.execute("SELECT id FROM items WHERE barcode = ?", (item["barcode"],)).fetchone()

        if existing:
            print(f"⚠️  Skipper {item['name']} - finnes allerede (barcode: {item['barcode']})")
            skipped_count += 1
            continue

        try:
            c.execute(
                """
                INSERT INTO items (name, description, barcode, category, location, quantity, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                (
                    item["name"],
                    item["description"],
                    item["barcode"],
                    item["category"],
                    item["location"],
                    item["quantity"]
                )
            )
            print(f"✓ Lagt til: {item['name']} ({item['quantity']} stk) - {item['category']}")
            added_count += 1
        except Exception as e:
            print(f"✗ Feil ved å legge til {item['name']}: {e}")
            skipped_count += 1

    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"Ferdig! Lagt til {added_count} gjenstander, hoppet over {skipped_count}")
    print(f"{'='*60}")

if __name__ == "__main__":
    print("Legger til demo-gjenstander for Driftstøtte...")
    print(f"Database: {DB_NAME}\n")
    add_demo_items()

