@echo off
rem Change to project root
cd /d "%~dp0"
rem Install dependencies
npm install
if %errorlevel% neq 0 (
  echo npm install failed with exit code %errorlevel%
  exit /b %errorlevel%
)
rem Start dev server
npm run dev
