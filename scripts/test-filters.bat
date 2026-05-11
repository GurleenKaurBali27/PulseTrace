@echo off
REM Test Filtering System

echo ===================================
echo API Failure Visualizer - Filter Tests
echo ===================================

echo.
echo Generating test data...
curl -s http://localhost:4000/success > nul
curl -s http://localhost:4000/success > nul
curl -s -X GET http://localhost:4000/fail > nul 2>&1
curl -s http://localhost:4000/not-found > nul 2>&1
curl -s -X POST -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"test@example.com\"}" http://localhost:4000/create-data > nul

timeout /t 2 /nobreak > nul

echo.
echo ===== TEST 1: All Logs =====
curl -s "http://localhost:5000/logs" | powershell -Command "ConvertFrom-Json | Select-Object -ExpandProperty data | ForEach-Object { '{0} {1} {2}' -f $_.method, $_.route, $_.statusCode }"

echo.
echo ===== TEST 2: Filter by Status Range (5xx) =====
curl -s "http://localhost:5000/logs?statusRange=5xx" | powershell -Command "ConvertFrom-Json | Select-Object -ExpandProperty data | ForEach-Object { '{0} {1} {2}' -f $_.method, $_.route, $_.statusCode }"

echo.
echo ===== TEST 3: Filter by Method (GET) =====
curl -s "http://localhost:5000/logs?method=GET" | powershell -Command "ConvertFrom-Json | Select-Object -ExpandProperty data | ForEach-Object { '{0} {1} {2}' -f $_.method, $_.route, $_.statusCode }"

echo.
echo ===== TEST 4: Filter by Route (success) =====
curl -s "http://localhost:5000/logs?route=success" | powershell -Command "ConvertFrom-Json | Select-Object -ExpandProperty data | ForEach-Object { '{0} {1} {2}' -f $_.method, $_.route, $_.statusCode }"

echo.
echo ===== TEST 5: Filter by Status Range (4xx) =====
curl -s "http://localhost:5000/logs?statusRange=4xx" | powershell -Command "ConvertFrom-Json | Select-Object -ExpandProperty data | ForEach-Object { '{0} {1} {2}' -f $_.method, $_.route, $_.statusCode }"

echo.
echo ===== TEST 6: Combined Filters (GET method + 2xx status) =====
curl -s "http://localhost:5000/logs?method=GET&statusRange=2xx" | powershell -Command "ConvertFrom-Json | Select-Object -ExpandProperty data | ForEach-Object { '{0} {1} {2}' -f $_.method, $_.route, $_.statusCode }"

echo.
echo Tests completed!
