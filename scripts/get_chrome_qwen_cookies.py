import os
import json
import sqlite3
import base64
import win32crypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def get_encryption_key(user_data_path):
    local_state_path = os.path.join(user_data_path, "Local State")
    if not os.path.exists(local_state_path):
        return None
    with open(local_state_path, "r", encoding="utf-8") as f:
        local_state = json.load(f)
    encrypted_key = base64.b64decode(local_state["os_crypt"]["encrypted_key"])
    encrypted_key = encrypted_key[5:] # strip 'DPAPI'
    return win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

def decrypt_cookie(encrypted_value, key):
    try:
        if encrypted_value.startswith(b'v10') or encrypted_value.startswith(b'v11'):
            nonce = encrypted_value[3:15]
            ciphertext = encrypted_value[15:]
            aesgcm = AESGCM(key)
            return aesgcm.decrypt(nonce, ciphertext, None).decode('utf-8')
        else:
            return win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1].decode('utf-8')
    except Exception:
        return ""

def main():
    user_data = os.path.expanduser(r"~\AppData\Local\Google\Chrome\User Data")
    key = get_encryption_key(user_data)
    if not key:
        print("Could not get encryption key.")
        return

    profiles = ["Default", "Profile 1", "Profile 2", "Profile 3", "Profile 4", "Profile 5"]
    all_cookies = []

    for prof in profiles:
        db_path = os.path.join(user_data, prof, "Network", "Cookies")
        if not os.path.exists(db_path):
            continue
        temp_db = os.path.join(os.environ["TEMP"], f"qwen_cookies_{prof}.db")
        try:
            with open(db_path, "rb") as rf, open(temp_db, "wb") as wf:
                wf.write(rf.read())
            conn = sqlite3.connect(temp_db)
            cursor = conn.cursor()
            cursor.execute("SELECT host_key, name, encrypted_value, value FROM cookies WHERE host_key LIKE '%qwen.ai%' OR host_key LIKE '%ali%'")
            for host, name, enc_val, val in cursor.fetchall():
                dec_val = val if val else decrypt_cookie(enc_val, key)
                if dec_val:
                    all_cookies.append((name, dec_val))
            conn.close()
            os.remove(temp_db)
        except Exception as e:
            pass

    if all_cookies:
        # Deduplicate by name
        seen = {}
        for name, val in all_cookies:
            seen[name] = val
        cookie_header = "; ".join([f"{k}={v}" for k, v in seen.items()])
        print("=== DECRYPTED QWEN COOKIE HEADER ===")
        print(cookie_header)
    else:
        print("No qwen cookies found in Chrome profiles.")

if __name__ == "__main__":
    main()
