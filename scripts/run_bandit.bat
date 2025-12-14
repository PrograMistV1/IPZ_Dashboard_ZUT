@echo off
setlocal enableextensions enabledelayedexpansion

REM Determine repo root (parent of scripts dir)
set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..
for %%I in ("%REPO_ROOT%") do set REPO_ROOT=%%~fI

REM Optional first arg as target path
set TARGET_PATH=%REPO_ROOT%
if not "%~1"=="" set TARGET_PATH=%~1

REM Check bandit availability
where bandit >nul 2>&1
if errorlevel 1 (
  echo bandit not found. Install with: pip install bandit
  exit /b 127
)

REM Run bandit with explicit excludes
bandit -r "%TARGET_PATH%" ^
  -x "%REPO_ROOT%\src\front,%REPO_ROOT%\Szkice,%REPO_ROOT%\logs,%REPO_ROOT%\**\__pycache__" ^
  -lll
exit /b %errorlevel%

