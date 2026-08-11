import sqlite3
import os
import json

db_paths = [
    os.path.expanduser(r'~\.omniroute\storage.sqlite'),
    os.path.expanduser(r'~\AppData\Roaming\omniroute\storage.sqlite')
]

target = "antigravity/gemini-3.6-flash-medium"
anthropic_models = [
    "claude-opus-4",
    "claude-sonnet-4",
    "claude-haiku-4",
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-haiku-4-5",
    "claude-3-5-sonnet",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-7-sonnet",
    "claude-3-7-sonnet-20250219",
    "claude-3-haiku",
    "claude-3-haiku-20240307",
    "claude-3-5-haiku",
    "claude-3-5-haiku-20241022",
    "claude-3-opus",
    "claude-3-opus-20240229",
    "claude-2.1",
    "claude-2.0",
    "claude-instant-1.2"
]

for db_path in db_paths:
    print("Checking DB Path:", db_path)
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("SELECT value FROM key_value WHERE namespace = 'settings' AND key = 'modelAliases'")
        row = c.fetchone()
        aliases = {}
        if row and row[0]:
            try:
                aliases = json.loads(row[0])
            except Exception:
                pass
                
        for m in anthropic_models:
            aliases[m] = target
            
        new_val = json.dumps(aliases)
        c.execute("INSERT OR REPLACE INTO key_value (namespace, key, value) VALUES ('settings', 'modelAliases', ?)", (new_val,))
        conn.commit()
        print(f"Successfully updated {db_path} with {len(anthropic_models)} model aliases!")
        conn.close()
