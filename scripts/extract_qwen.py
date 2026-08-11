import os
import json
import sqlite3
import base64
import win32crypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def get_key(user_data):
    lp = os.path.join(user_data, 'Local State')
    if not os.path.exists(lp): return None
    with open(lp, 'r', encoding='utf-8') as f:
        ls = json.load(f)
    ek = base64.b64decode(ls['os_crypt']['encrypted_key'])[5:]
    return win32crypt.CryptUnprotectData(ek, None, None, None, 0)[1]

def dec(enc, key):
    try:
        if enc.startswith(b'v10') or enc.startswith(b'v11'):
            return AESGCM(key).decrypt(enc[3:15], enc[15:], None).decode('utf-8')
        return win32crypt.CryptUnprotectData(enc, None, None, None, 0)[1].decode('utf-8')
    except Exception as e:
        return ''

def main():
    chrome_dir = os.path.expanduser(r'~\AppData\Local\Google\Chrome\User Data')
    key = get_key(chrome_dir)
    if not key:
        print("No encryption key found.")
        return

    for root, dirs, files in os.walk(chrome_dir):
        if 'Cookies' in files:
            db_path = os.path.join(root, 'Cookies')
            temp_path = os.path.join(os.environ['TEMP'], 'temp_ck.db')
            try:
                with open(db_path, 'rb') as f, open(temp_path, 'wb') as tf:
                    tf.write(f.read())
                conn = sqlite3.connect(temp_path)
                c = conn.cursor()
                c.execute("SELECT name, encrypted_value, value FROM cookies WHERE host_key LIKE '%qwen%'")
                rows = c.fetchall()
                if rows:
                    print('=== FOUND QWEN COOKIES IN:', db_path, '===')
                    cookies = [f'{n}={val or dec(e, key)}' for n, e, val in rows if (val or dec(e, key))]
                    print('; '.join(cookies))
                conn.close()
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except Exception as ex:
                pass

if __name__ == '__main__':
    main()
