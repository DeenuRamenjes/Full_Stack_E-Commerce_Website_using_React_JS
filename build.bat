@echo off

REM Remove existing node_modules and package-lock.json
rmdir /s /q frontend\node_modules
del /f /q frontend\package-lock.json

REM Install dependencies with legacy peer deps
cd frontend
call npm install --legacy-peer-deps

REM Build the frontend
call npm run build

REM Return to root directory
cd ..

REM Install backend dependencies
call npm install

REM Start the server
call npm start 