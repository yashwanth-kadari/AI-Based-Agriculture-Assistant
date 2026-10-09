"""
AgriSmart AI — Database Connection Module
==========================================
MYSQL ONLY. No SQLite fallback.
If MySQL is unavailable, the app fails loudly — a connection error is raised
immediately so it is impossible to miss. Silent fallback has been removed.
"""
import os
import mysql.connector
from mysql.connector import Error
import config


def _get_credentials():
    return {
        'host':     os.getenv('DB_HOST',     getattr(config, 'DB_HOST',     'localhost')),
        'port': int(os.getenv('DB_PORT',     getattr(config, 'DB_PORT',     '3306'))),
        'user':     os.getenv('DB_USER',     getattr(config, 'DB_USER',     'root')),
        'password': os.getenv('DB_PASSWORD', getattr(config, 'DB_PASSWORD', '')),
        'database': os.getenv('DB_NAME',     getattr(config, 'DB_NAME',     'agriculture_db')),
    }


def get_db_connection():
    """
    Return a live MySQL connection.
    Raises RuntimeError if MySQL is unreachable — NEVER falls back to SQLite.
    Callers should handle the exception and return an appropriate HTTP 500.
    """
    creds = _get_credentials()
    try:
        connection = mysql.connector.connect(
            host=creds['host'],
            port=creds['port'],
            user=creds['user'],
            password=creds['password'],
            database=creds['database'],
            connection_timeout=5,
            autocommit=False,
        )
        return connection
    except Error as e:
        raise RuntimeError(
            f"[AgriSmart] MySQL connection FAILED — "
            f"{creds['host']}:{creds['port']} db={creds['database']} user={creds['user']} "
            f"| Error: {e}"
        ) from e


def init_db():
    """
    Ensure the MySQL database and schema exist.
    Called once at application startup.
    Raises RuntimeError if MySQL cannot be reached — startup will abort visibly.
    """
    creds = _get_credentials()
    host, port, user, password, database = (
        creds['host'], creds['port'], creds['user'],
        creds['password'], creds['database']
    )

    try:
        # Step 1: Connect without specifying the DB to ensure it exists
        bootstrap = mysql.connector.connect(
            host=host, port=port, user=user, password=password,
            connection_timeout=5
        )
        cur = bootstrap.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{database}`")
        bootstrap.commit()
        cur.close()
        bootstrap.close()

        # Step 2: Connect to the database and apply schema
        conn = mysql.connector.connect(
            host=host, port=port, user=user, password=password,
            database=database, connection_timeout=5
        )
        cur = conn.cursor()

        # Safe column additions for existing users table
        for col, col_type in [
            ('user_id',            'VARCHAR(255)'),
            ('role',               "VARCHAR(50) DEFAULT 'farmer'"),
            ('can_create_accounts','TINYINT(1) DEFAULT 0'),
            ('is_super_admin',     'TINYINT(1) DEFAULT 0'),
            ('is_verified',        'TINYINT(1) DEFAULT 1'),
            ('status',             "VARCHAR(50) DEFAULT 'active'"),
            ('state',              "VARCHAR(100) DEFAULT 'Andhra Pradesh'"),
            ('district',           "VARCHAR(100) DEFAULT 'Guntur'"),
            ('phone',              'VARCHAR(50)'),
            ('village',            'VARCHAR(100)'),
            ('farm_size',          'FLOAT'),
            ('main_crop',          'VARCHAR(100)'),
        ]:
            try:
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
            except Exception:
                pass  # Column already exists — safe to ignore

        # Apply schema.sql if present
        schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
        if not os.path.exists(schema_path):
            schema_path = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'schema.sql')

        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                sql = f.read()
            for stmt in [s.strip() for s in sql.split(';') if s.strip()]:
                try:
                    cur.execute(stmt)
                except Exception:
                    pass
            conn.commit()

        # Seed Mandis if empty
        try:
            cur.execute("SELECT COUNT(*) FROM mandis")
            if cur.fetchone()[0] == 0:
                cur.executemany(
                    "INSERT INTO mandis (name, state, district, location, status) VALUES (%s,%s,%s,%s,%s)",
                    [
                        ('Vijayawada Mandi',    'Andhra Pradesh', 'Krishna',  'NH16, Governorpet, Vijayawada',                   'Active'),
                        ('Guntur Mandi',        'Andhra Pradesh', 'Guntur',   'APMC Market Yard, Mirchi Yard Road, Guntur',       'Active'),
                        ('Ludhiana Grain Market','Punjab',        'Ludhiana', 'Gill Road APMC Grain Yard, Ludhiana',             'Active'),
                        ('Khanna Mandi',        'Punjab',        'Ludhiana', 'Asia Largest Grain Market, Khanna',               'Active'),
                        ('Karnal Grain Market', 'Haryana',       'Karnal',   'Grand Trunk Rd, New Grain Market, Karnal',        'Active'),
                        ('Azadpur Mandi',       'Delhi',         'Delhi',    'Azadpur Fruits & Vegetables APMC Yard, Delhi',    'Active'),
                    ]
                )
                conn.commit()
        except Exception as seed_err:
            print(f"[AgriSmart] Mandi seed skipped: {seed_err}")

        # Seed Climate Normals if empty
        try:
            cur.execute("SELECT COUNT(*) FROM climate_normals")
            if cur.fetchone()[0] == 0:
                cur.executemany(
                    "INSERT INTO climate_normals (state, temperature, humidity, rainfall) VALUES (%s, %s, %s, %s)",
                    [
                        ('Punjab', 24.5, 62.0, 140.0),
                        ('Haryana', 25.0, 60.0, 130.0),
                        ('Uttar Pradesh', 26.0, 65.0, 180.0),
                        ('Maharashtra', 27.5, 70.0, 220.0),
                        ('Karnataka', 26.5, 72.0, 210.0),
                        ('Gujarat', 28.0, 58.0, 110.0),
                        ('Rajasthan', 29.0, 45.0, 85.0),
                        ('Tamil Nadu', 29.5, 75.0, 190.0),
                        ('West Bengal', 27.0, 80.0, 250.0),
                        ('Bihar', 26.0, 70.0, 200.0),
                        ('Madhya Pradesh', 26.5, 55.0, 150.0),
                        ('Andhra Pradesh', 28.5, 72.0, 175.0),
                        ('Telangana', 28.0, 65.0, 160.0),
                        ('Kerala', 27.0, 85.0, 300.0),
                        ('Odisha', 27.5, 78.0, 240.0),
                        ('Assam', 24.0, 82.0, 280.0),
                    ]
                )
                conn.commit()
        except Exception as cn_err:
            print(f"[AgriSmart] Climate normals seed skipped: {cn_err}")

        cur.close()
        conn.close()
        print(f"[+] Connected to MySQL database '{database}' on {host}:{port}.")

    except Error as e:
        raise RuntimeError(
            f"[AgriSmart] MySQL init FAILED — cannot start. "
            f"Host: {host}:{port} DB: {database} User: {user} | Error: {e}"
        ) from e
