@echo off
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel% equ 0 (
    start "" "http://localhost:8000"
    py -3 -m http.server 8000
) else (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        start "" "http://localhost:8000"
        python -m http.server 8000
    ) else (
        echo Python was not found. Please open index.html directly in a browser.
        pause
    )
)
