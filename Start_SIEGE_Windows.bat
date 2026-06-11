@echo off
echo Starting SIEGE Cognitive Terminal...
start /B python server.py
timeout /t 2 /nobreak >nul
start http://localhost:8080/siege.html
