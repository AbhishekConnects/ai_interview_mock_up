#!/usr/bin/env python3
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        logger.debug("Received OPTIONS request")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        logger.debug(f"Received POST request to {self.path}")
        if self.path == '/execute':
            logger.info("Processing /execute request")
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            logger.debug(f"Received data: {post_data}")

            try:
                data = json.loads(post_data.decode('utf-8'))
                logger.debug(f"Parsed JSON: {data}")
                
                # Add missing fields to match working curl
                jDoodle_payload = {
                    "clientId": data.get('clientId'),
                    "clientSecret": data.get('clientSecret'),
                    "script": data.get('script'),
                    "stdin": data.get('stdin', ''),
                    "language": data.get('language'),
                    "versionIndex": data.get('versionIndex', '3'),
                    "compileOnly": False
                }
                
                jdoodle_data = json.dumps(jDoodle_payload).encode('utf-8')
                logger.debug(f"JDoodle payload: {jdoodle_data}")
                
                req = urllib.request.Request(
                    'https://api.jdoodle.com/v1/execute',
                    data=jdoodle_data,
                    headers={
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (compatible; JDoodle-Proxy/1.0)'
                    },
                    method='POST'
                )

                logger.info("Sending request to JDoodle API")
                
                with urllib.request.urlopen(req) as response:
                    result = response.read().decode('utf-8')
                    logger.debug(f"JDoodle response: {result}")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(result.encode('utf-8'))
                logger.info("Response sent successfully")
                
            except Exception as e:
                logger.error(f"Proxy error: {e}")
                self.send_response(200)  # Send 200 to avoid fetch errors
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                error_response = json.dumps({'error': str(e), 'output': '', 'memory': 0, 'cpuTime': 0})
                self.wfile.write(error_response.encode('utf-8'))

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8001), ProxyHandler)
    logger.info("Proxy server running on http://localhost:8001")
    server.serve_forever()