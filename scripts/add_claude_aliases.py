import sqlite3
import os
import json

db_path = os.path.expanduser(r'~\AppData\Roaming\omniroute\storage.sqlite')
print("DB Path:", db_path)

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check key_value setting for modelAliases
    c.execute("SELECT value FROM key_value WHERE namespace = 'settings' AND key = 'modelAliases'")
    row = c.fetchone()
    aliases = {}
    if row and row[0]:
        try:
            aliases = json.loads(row[0])
        except Exception:
            pass
            
    print("Existing Aliases:", aliases)
    
    # Add mapping for common Claude models to Antigravity Gemini
    target = "antigravity/gemini-3.6-flash-medium"
    claude_models = [
        "claude-3-5-sonnet-20241022",
        "claude-3-7-sonnet-20250219",
        "claude-3-haiku-20240307",
        "claude-3-opus-20240229",
        "claude-sonnet-4-6",
        "claude-opus-4-6",
        "claude-haiku-4-5",
        "claude-3-5-sonnet",
        "claude-3-7-sonnet"
    ]
    
    for m in claude_models:
        aliases[m] = target
        
    new_val = json.dumps(aliases)
    c.execute("INSERT OR REPLACE INTO key_value (namespace, key, value) VALUES ('settings', 'modelAliases', ?)", (new_val,))
    conn.commit()
    print("Successfully Updated Aliases:", aliases)
    conn.close()
