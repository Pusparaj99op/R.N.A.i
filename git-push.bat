@echo off
echo === Rescue.Net-AI Git Push Helper ===
echo.
echo This script will stage, commit, and push your changes to GitHub.
echo.

REM Stage all changes
echo Staging all changes...
git add .

REM Commit with user-provided message
set /p commit_msg=Enter your commit message: 
echo.
echo Creating commit with message: "%commit_msg%"
git commit -m "%commit_msg%"

REM Push to main branch
echo.
echo Pushing to main branch...
echo Please enter your GitHub credentials when prompted.
git push origin main

echo.
echo Done! If the push was successful, your changes are now on GitHub.
pause
