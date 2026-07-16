@echo off
echo Initializing Git repository...
git init

echo Adding files...
git add .

echo Committing changes...
git commit -m "Added Firebase Realtime DB to frontend and admin"

echo Linking to GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/orbispvtltd-lang/VelaanFarm.git

echo Pushing to GitHub...
git push -u origin main || git push -u origin master

echo.
echo Done! Press any key to close this window.
pause >nul
