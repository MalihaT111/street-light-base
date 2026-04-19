import os
import psycopg2.extras
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from db import db_connection

def inspect_reports():
    """
    Connects to the database using the project's connection utility
    and displays the 'reports' table structure and sample data.
    """
    conn = None
    try:
        # Initialize connection using logic from db.py
        conn = db_connection()
        
        # Use a DictCursor to make output more readable (column names as keys)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Show table structure via information_schema
        print("--- Table Structure: reports ---")
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'reports'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        for col in columns:
            null_status = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
            print(f"{col['column_name']:20} | {col['data_type']:15} | {null_status}")

        # 2. Show sample data
        print("\n--- Sample Data (Limit 5) ---")
        cur.execute("SELECT * FROM reports LIMIT 5;")
        rows = cur.fetchall()

        if not rows:
            print("No records found in the 'reports' table.")
        else:
            for i, row in enumerate(rows, 1):
                print(f"\n[Record {i}]")
                for key, val in row.items():
                    print(f"  {key}: {val}")

        # 3. Aggregation: Borough and Rating
        print("\n--- Reports Aggregated by Borough and Rating ---")
        cur.execute("""
            SELECT borough, rating, COUNT(*) as report_count
            FROM reports
            WHERE borough IS NOT NULL
            GROUP BY borough, rating
            ORDER BY borough ASC, report_count DESC;
        """)
        agg_rows = cur.fetchall()
        if not agg_rows:
            print("No data available to aggregate.")
        else:
            print(f"{'Borough':15} | {'Rating':10} | {'Count':5}")
            print("-" * 35)
            for agg in agg_rows:
                print(f"{str(agg['borough']):15} | {str(agg['rating']):10} | {agg['report_count']:5}")

        cur.close()
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    inspect_reports()