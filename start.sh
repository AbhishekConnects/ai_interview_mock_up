#!/bin/bash
echo "Starting AI Mock Interview System..."
echo "This will start both the web server and code execution proxy."
echo ""

# Start proxy server in background
echo "Starting code execution proxy on port 8001..."
python3 proxy-server.py &
PROXY_PID=$!

# Wait a moment for proxy to start
sleep 2

# Start main server
echo "Starting web server on port 8000..."
python3 server.py &
WEB_PID=$!

echo ""
echo "✅ Both servers are running:"
echo "   Web App: http://localhost:8000"
echo "   Proxy: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt
trap 'kill $PROXY_PID $WEB_PID; exit' INT
wait