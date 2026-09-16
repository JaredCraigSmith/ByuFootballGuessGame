@echo off
setlocal
echo.
echo ========================================================
echo   BYU Football Guess Game - Automated Test Suite Runner
echo   Zero-Database-Mutation Safety Enforced
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    set "NODE_CMD=node"
    goto RUN
)

if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
    set "NODE_CMD=%APPDATA%\Antigravity\bin\agy-node.cmd"
    goto RUN
)

if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    goto RUN
)

echo [ERROR] Node.js not found.
echo You can run the tests directly in your browser by opening test.html
exit /b 1

:RUN
cd /d "%~dp0"
call %NODE_CMD% --test tests/scoring.test.js tests/supabase.test.js
exit /b %errorlevel%
