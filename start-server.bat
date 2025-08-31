@echo off
chcp 65001 >nul
echo 🚀 Запуск DroneVideoFix Backend Server...
echo.

REM Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен!
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js найден
echo.

REM Устанавливаем зависимости если нужно
if not exist "node_modules" (
    echo 📦 Установка зависимостей...
    npm install
    echo.
)

REM Запускаем сервер
echo 🌐 Запуск сервера на порту 3000...
echo 📁 Файлы будут сохраняться в папку 'uploads/'
echo 🔧 Обработанные файлы в папку 'processed/'
echo.
echo Для остановки нажмите Ctrl+C
echo.

npm start
pause
