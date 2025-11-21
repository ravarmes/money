@echo off
setlocal
set PORT=%1
if "%PORT%"=="" set PORT=8000
set URL=http://localhost:%PORT%/index.html
start "" %URL%
python -m http.server %PORT%