@echo off
setlocal
chcp 65001 > nul
cd /d "%~dp0"

if not exist ".server_pid" (
    echo [PodGraph] 停止対象の .server_pid が見つかりません。
    exit /b 0
)

set /p TARGET_PID=<.server_pid
if "%TARGET_PID%"=="" (
    del /q ".server_pid" 2>nul
    del /q ".server_port" 2>nul
    echo [PodGraph] PID が空のためファイルのみ削除しました。
    exit /b 0
)

echo [PodGraph] PID %TARGET_PID% のサーバープロセスを停止します...
taskkill /PID %TARGET_PID% /T /F >nul 2>&1
del /q ".server_pid" 2>nul
del /q ".server_port" 2>nul
echo [PodGraph] 停止完了。
exit /b 0
