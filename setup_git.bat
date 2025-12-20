@echo off
chcp 65001 >nul
cls
echo ==========================================
echo       Git 自动初始化脚本 (Auto Setup)
echo ==========================================

REM 1. 检查 Git 是否安装
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Git！
    echo 请确保您已安装 Git 并重启了编辑器/终端。
    pause
    exit /b
)

REM 2. 配置用户信息
echo.
echo [配置] Git 需要知道你是谁才能提交代码。
echo 请输入您的 GitHub 用户名和邮箱。
echo.

:ask_name
set /p git_name="请输入用户名 (例如: John Doe): "
if "%git_name%"=="" goto ask_name
git config --global user.name "%git_name%"

:ask_email
set /p git_email="请输入邮箱 (例如: john@example.com): "
if "%git_email%"=="" goto ask_email
git config --global user.email "%git_email%"

REM 3. 初始化仓库
echo.
echo [1/4] 初始化仓库...
git init

REM 4. 添加文件
echo.
echo [2/4] 添加文件...
git add .

REM 5. 提交
echo.
echo [3/4] 提交代码...
git commit -m "Initial commit"

echo.
echo ==========================================
echo       本地设置已完成！
echo ==========================================
echo.
echo 接下来的步骤:
echo 1. 去 GitHub 创建一个新仓库
echo 2. 复制页面上的 "git remote add origin..." 那三行命令
echo 3. 粘贴到这里并回车
echo.
echo (或者直接关闭此窗口，手动在终端运行)
echo.

cmd /k
