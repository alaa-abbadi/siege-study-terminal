#!/bin/bash
# Navigate to the project directory
cd "/home/alaaabbadi/code projects/siege"

# Check if the server is already running on port 8080
if ! lsof -i:8080 -t >/dev/null; then
    echo "Starting SIEGE server..."
    # Start the python server in the background
    nohup python3 server.py > server.log 2>&1 &
    # Give it a second to boot up
    sleep 1
else
    echo "SIEGE server is already running."
fi

# Open the default web browser to the local server
xdg-open "http://localhost:8080/siege.html"
