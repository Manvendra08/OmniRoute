import sqlite3
import os
import json

db_path = os.path.expanduser(r'~\AppData\Roaming\omniroute\storage.sqlite')
print("DB Path:", db_path)

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Read existing modelAliases from key_value table
    c.execute("SELECT value FROM key_value WHERE namespace = 'settings' AND key = 'modelAliases'")
    row = c.fetchone()
    aliases = {}
    if row and row[0]:
        try:
            aliases = json.loads(row[0])
        except Exception:
            pass
            
    # Target Antigravity model
    target = "antigravity/gemini-3.6-flash-medium"
    
    # All Anthropic model IDs used by Claude Desktop and third-party tools
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
    
    for m in anthropic_models:
        aliases[m] = target
        
    new_val = json.dumps(aliases)
    c.execute("INSERT OR REPLACE INTO key_value (namespace, key, value) VALUES ('settings', 'modelAliases', ?)", (new_val,))
    conn.commit()
    print(f"Successfully mapped {len(anthropic_models)} Anthropic model IDs to '{target}'!")
    print("Mapped Aliases:", aliases)
    conn.close()
