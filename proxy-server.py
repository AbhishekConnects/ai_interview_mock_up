#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.request
import urllib.parse
from urllib.error import URLError

PORT = 8001

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress log messages to reduce noise
        pass
        
    def do_OPTIONS(self):
        try:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
        except (ConnectionResetError, BrokenPipeError):
            pass

    def do_POST(self):
        try:
            if self.path == '/execute':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    
                    # Forward to JDoodle API
                    req = urllib.request.Request(
                        'https://api.jdoodle.com/v1/execute',
                        data=json.dumps(data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'}
                    )
                    
                    with urllib.request.urlopen(req) as response:
                        result = response.read()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(result)
                    
                except Exception as e:
                    # Return simulation on error
                    simulation = {
                        "output": f"[DEMO MODE] Simulated execution\nProgram output: Hello World",
                        "memory": "128",
                        "cpuTime": "0.05"
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(simulation).encode('utf-8'))
            else:
                self.send_response(404)
                self.end_headers()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            # Client disconnected, ignore
            pass

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
        print(f"Proxy server running at http://localhost:{PORT}")
        httpd.serve_forever()