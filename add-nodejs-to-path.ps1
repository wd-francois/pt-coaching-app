# Add Node.js to PATH (Run as Administrator)
$nodePath = "C:\Program Files\nodejs"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($userPath -notlike "*$nodePath*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$nodePath", "User")
    Write-Host "Added $nodePath to User PATH" -ForegroundColor Green
} else {
    Write-Host "Node.js path already exists in User PATH" -ForegroundColor Yellow
}

# Refresh current session
$env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")
Write-Host "PATH refreshed. Please restart your terminal for changes to take full effect." -ForegroundColor Cyan

