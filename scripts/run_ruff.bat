@echo off
setlocal enableextensions enabledelayedexpansion

REM Determine repo root (parent of scripts dir)
set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..
for %%I in ("%REPO_ROOT%") do set REPO_ROOT=%%~fI

REM Optional first arg as target path
set TARGET_PATH=%REPO_ROOT%
if not "%~1"=="" set TARGET_PATH=%~1

REM Check ruff availability
where ruff >nul 2>&1
if errorlevel 1 (
  echo ruff not found. Install with: pip install ruff
  exit /b 127
)

REM Run ruff with explicit excludes
ruff check "%TARGET_PATH%" ^
  --exclude "%REPO_ROOT%\src\front" ^
  --exclude "%REPO_ROOT%\Szkice" ^
  --exclude "%REPO_ROOT%\logs" ^
  --exclude "__pycache__" ^
  --line-length 120
exit /b %errorlevel%

