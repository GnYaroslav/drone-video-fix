#!/bin/bash

echo "🚀 Запуск DroneVideoFix Backend Server..."
echo ""

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Требуется Node.js версии 14 или выше!"
    echo "Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js версии $(node -v) найден"
echo ""

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
    echo ""
fi

# Запускаем сервер
echo "🌐 Запуск сервера на порту 3000..."
echo "📁 Файлы будут сохраняться в папку 'uploads/'"
echo "🔧 Обработанные файлы в папку 'processed/'"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

npm start
