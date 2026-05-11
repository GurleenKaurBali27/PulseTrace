# WebSocket Real-Time Test - PowerShell Version

Write-Host "`nWebSocket Real-Time Integration Test`n" -ForegroundColor Cyan

$testEndpoints = @(
    @{ name = "Success Request"; uri = "http://localhost:4000/success"; method = "GET" },
    @{ name = "Not Found (404)"; uri = "http://localhost:4000/not-found"; method = "GET" },
    @{ name = "Unauthorized (401)"; uri = "http://localhost:4000/unauthorized"; method = "GET" },
    @{ name = "Server Error (500)"; uri = "http://localhost:4000/fail"; method = "GET" },
    @{ name = "Success #2"; uri = "http://localhost:4000/success"; method = "GET" }
)

Write-Host "Sending test requests..." -ForegroundColor Yellow
$counter = 0

foreach ($endpoint in $testEndpoints) {
    $counter++
    Write-Host "[$counter/$($testEndpoints.Count)] $($endpoint.name)" -ForegroundColor White
    
    try {
        Invoke-WebRequest -Uri $endpoint.uri -Method $endpoint.method -UseBasicParsing | Out-Null
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Host "  (Expected error)" -ForegroundColor Yellow
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host "`nFetching statistics..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$response = Invoke-WebRequest -Uri "http://localhost:5000/logs/stats" -Method GET -UseBasicParsing
$stats = $response.Content | ConvertFrom-Json

Write-Host "`nResults:" -ForegroundColor Cyan
Write-Host "Total Logs: $($stats.totalLogs)" -ForegroundColor Green
Write-Host "Total Errors: $($stats.totalErrors)" -ForegroundColor Green
Write-Host "Average Duration: $($stats.avgDuration)ms" -ForegroundColor Green

Write-Host "`nWebSocket Test Complete!" -ForegroundColor Green
Write-Host "Open http://localhost:3000 to see real-time updates`n" -ForegroundColor Cyan
