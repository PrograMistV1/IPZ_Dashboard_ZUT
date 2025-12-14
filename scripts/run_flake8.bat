@echo off
setlocal enableextensions enabledelayedexpansion

REM Determine repo root (parent of scripts dir)
set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..
for %%I in ("%REPO_ROOT%") do set REPO_ROOT=%%~fI

REM Check flake8 availability
where flake8 >nul 2>&1
if errorlevel 1 (
  echo flake8 not found. Install with: pip install flake8
  exit /b 127
)

echo Running flake8 in %REPO_ROOT% with inline config
flake8 "%REPO_ROOT%\src" ^
  --max-line-length 120 ^
  --extend-exclude ".git,__pycache__,.venv,venv,env,.mypy_cache,.ruff_cache,.pytest_cache,build,dist,node_modules,src/front,Szkice,logs"
exit /b %errorlevel%
