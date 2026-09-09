@echo off
rem Change to project root
cd /d "%~dp0"
rem Apply Supabase migrations
supabase db push
if %errorlevel% neq 0 (
  echo Migration failed with exit code %errorlevel%
) else (
  echo Migration completed successfully
)
pause
