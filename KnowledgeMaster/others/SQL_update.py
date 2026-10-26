import mysql.connector

# Connect to the DB
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="yourpass",
    database="yourdb"
)
cursor = conn.cursor()

# Desired table schema (define as dictionary)
expected_schema = {
    "users": {
        "id": "INT PRIMARY KEY",
        "name": "VARCHAR(255) NOT NULL",
        "email": "VARCHAR(255)",
        "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP"
    }
}

for table_name, columns in expected_schema.items():
    cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
    exists = cursor.fetchone()

    if not exists:
        # Generate CREATE TABLE
        col_defs = ",\n  ".join([f"{col} {dtype}" for col, dtype in columns.items()])
        create_sql = f"CREATE TABLE {table_name} (\n  {col_defs}\n);"
        print(create_sql)
    else:
        # Compare and generate ALTER TABLE for missing/changed columns
        cursor.execute(f"DESCRIBE {table_name}")
        existing_cols = {col[0]: col[1] for col in cursor.fetchall()}

        for col, dtype in columns.items():
            if col not in existing_cols:
                print(f"ALTER TABLE {table_name} ADD COLUMN {col} {dtype};")
            elif existing_cols[col].lower() != dtype.lower().split()[0]:  # Simplistic type comparison
                print(f"ALTER TABLE {table_name} MODIFY COLUMN {col} {dtype};")
