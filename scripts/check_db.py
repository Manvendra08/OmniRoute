import sqlite3
import os

db_path = os.path.expanduser(r'~\AppData\Roaming\omniroute\storage.sqlite')
print("DB Path:", db_path)
print("DB Exists:", os.path.exists(db_path))

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in c.fetchall()]
    print("Tables in database:", tables)
    
    for t in tables:
        try:
            c.execute(f"SELECT COUNT(*) FROM \"{t}\"")
            cnt = c.fetchone()[0]
            print(f"Table '{t}': {cnt} records")
        except Exception as e:
            print(f"Table '{t}': error {e}")
            
    conn.close()
