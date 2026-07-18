@echo off
chcp 65001 > nul
cd /d "%~dp0"

set "NPM_COMMAND="
where npm.cmd > nul 2>&1
if not errorlevel 1 for /f "delims=" %%I in ('where npm.cmd') do if not defined NPM_COMMAND set "NPM_COMMAND=%%~fI"

if not defined NPM_COMMAND if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "NPM_COMMAND=%ProgramFiles%\nodejs\npm.cmd"
)

if not defined NPM_COMMAND (
    echo [错误] 未找到 Node.js，请先安装 Node.js 后再启动项目。
    echo.
    pause
    exit /b 1
)

echo ========================================
echo 启动璃落的城堡项目
echo ========================================
echo.
echo 正在启动开发服务器...
echo.
if defined LILUO_START_TEST exit /b 0
call "%NPM_COMMAND%" run dev
set "START_EXIT_CODE=%ERRORLEVEL%"
if not "%START_EXIT_CODE%"=="0" (
    echo.
    echo [错误] 开发服务器启动失败，错误码：%START_EXIT_CODE%
    pause
)
exit /b %START_EXIT_CODE%
