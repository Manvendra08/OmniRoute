import sqlite3
import os

db_path = os.path.expanduser(r'~\AppData\Roaming\omniroute\storage.sqlite')
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("PRAGMA table_info(key_value)")
cols = c.fetchall()
print("Columns:", cols)

c.execute("SELECT * FROM key_value LIMIT 3")
rows = c.fetchall()
print("Sample rows:")
for r in rows:
    print(r)

conn.close()
