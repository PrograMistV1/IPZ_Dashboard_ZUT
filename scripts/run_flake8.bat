@echo off
setlocal enableextensions enabledelayedexpansion

REM Determine repo root (parent of scripts dir)
set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..

REM Normalize path
for %%I in ("%REPO_ROOT%") do set REPO_ROOT=%%~fI

REM Check flake8 availability
where flake8 >nul 2>&1
if errorlevel 1 (
  echo flake8 not found. Install with: pip install flake8
  exit /b 127
)

echo Running flake8 in %REPO_ROOT% with config %REPO_ROOT%\.flake8
flake8 "%REPO_ROOT%" --config "%REPO_ROOT%\.flake8"
exit /b %errorlevel%

