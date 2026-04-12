import os
import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    from dotenv import load_dotenv
except ImportError:
    print("Installing required packages (psycopg2-binary, python-dotenv)...")
    install("psycopg2-binary")
    install("python-dotenv")
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    from dotenv import load_dotenv

def test_connection():
    load_dotenv()
    
    # Get DB credentials
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_password = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_name = os.getenv("POSTGRES_DB", "innospark")
    db_host = "localhost" # Since this runs on the PC, it shouldn't be host.docker.internal
    db_port = "5432"

    print(f"Testing connection to PostgreSQL at {db_host}:{db_port}...")
    
    try:
        # First connect to the default 'postgres' database to check connection and create our DB
        conn = psycopg2.connect(
            dbname="postgres",
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        print("✅ Successfully connected to PostgreSQL server!")

        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cursor.fetchone()

        if not exists:
            print(f"⚠️ Database '{db_name}' does not exist. Creating it now...")
            cursor.execute(f"CREATE DATABASE {db_name}")
            print(f"✅ Database '{db_name}' created successfully!")
        else:
            print(f"✅ Database '{db_name}' already exists.")

        cursor.close()
        conn.close()

        # Verify connection to the specific database
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        print(f"✅ Successfully connected to the target database '{db_name}'!")
        conn.close()
        
    except psycopg2.OperationalError as e:
        print("\n❌ FAILED to connect to PostgreSQL!")
        print("Please ensure:")
        print("  1. PostgreSQL is installed and running on your PC")
        print("  2. The username and password in your .env file are correct")
        print(f"  3. PostgreSQL is listening on port {db_port}")
        print("\nError Details:")
        print(e)
    except Exception as e:
        print("\n❌ An unexpected error occurred:")
        print(e)

if __name__ == "__main__":
    test_connection()
