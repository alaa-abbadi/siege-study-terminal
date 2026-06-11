#!/bin/bash
cd "$(dirname "$0")"
echo "Starting SIEGE Cognitive Terminal..."
python3 server.py &
sleep 2
open "http://localhost:8080/siege.html"
