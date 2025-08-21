#!/usr/bin/env python3
import json
import urllib.request

# Test JDoodle API credentials
def test_jdoodle():
    client_id = "7d55d2e50822107da9ba71d057b34034"
    client_secret = "72385203a54379db140d75f0bf9be0e533a5e16d047bb27b955196c2f68c6419"
    
    data = {
        "clientId": client_id,
        "clientSecret": client_secret,
        "script": "print(\"Hello, World!\")",
        "stdin": "",
        "language": "python3",
        "versionIndex": "3",
        "compileOnly": False
    }
    
    try:
        req = urllib.request.Request(
            'https://api.jdoodle.com/v1/execute',
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; JDoodle-Test/1.0)'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("JDoodle API Response:")
            print(json.dumps(result, indent=2))
            
    except Exception as e:
        print(f"Error testing JDoodle API: {e}")

if __name__ == '__main__':
    test_jdoodle()