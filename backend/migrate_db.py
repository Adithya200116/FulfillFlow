import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "fulfillment.db"


def migrate():
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute("PRAGMA table_info(orders)")
    existing_columns = {
        row[1] for row in cursor.fetchall()
    }

    new_columns = {
        "packed_at": "DATETIME",
        "staged_at": "DATETIME",
        "shipped_at": "DATETIME",
        "tracking_number": "VARCHAR",
    }

    print(f"Database: {DB_PATH}")
    print("Checking orders table...\n")

    for column_name, column_type in new_columns.items():
        if column_name not in existing_columns:
            cursor.execute(
                f"ALTER TABLE orders "
                f"ADD COLUMN {column_name} {column_type}"
            )
            print(f"✓ Added: {column_name}")
        else:
            print(f"✓ Already exists: {column_name}")

    connection.commit()
    connection.close()

    print("\nMigration completed successfully.")


if __name__ == "__main__":
    migrate()