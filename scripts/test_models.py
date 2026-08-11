import urllib.request
import json
import urllib.error

url = 'http://localhost:3000/v1/messages'
headers = {
    'Authorization': 'Bearer sk-11873e733d5b44c5-f93252-04599a95',
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
}

test_models = [
    'auto/claude-opus',
    'auto/claude-sonnet',
    'cc/claude-fable-5',
    'claude-3-5-sonnet-20241022',
    'antigravity/gemini-3.6-flash-medium'
]

for m in test_models:
    data = json.dumps({
        'model': m,
        'messages': [{'role': 'user', 'content': 'hi'}],
        'max_tokens': 10
    }).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"Model '{m}' -> Status {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f"Model '{m}' -> HTTP {e.code}: {body}")
    except Exception as e:
        print(f"Model '{m}' -> Exception: {e}")
