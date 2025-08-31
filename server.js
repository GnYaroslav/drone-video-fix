const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Configuration
const BOT_TOKEN = '8272202383:AAEwLuR0WnOZVuwEr3bo3VdItXMJR16Dqag';
const CHAT_ID = '173817209';

// Function to send Telegram notification
async function sendTelegramNotification(message) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        if (!response.ok) {
            console.error('Ошибка отправки в Telegram:', response.status);
        } else {
            console.log('Уведомление отправлено в Telegram');
        }
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Раздаем файлы из текущей папки

// Создаем папки для файлов
const uploadsDir = path.join(__dirname, 'uploads');
const processedDir = path.join(__dirname, 'processed');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB максимум
    },
    fileFilter: (req, file, cb) => {
        // Проверяем тип файла
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Только видео файлы разрешены!'), false);
        }
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Маршруты API

// Загрузка поврежденного файла
app.post('/api/upload-damaged', upload.single('damagedFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: req.file.path,
            uploadTime: new Date().toISOString()
        };

        console.log('Загружен поврежденный файл:', fileInfo);
        
        // Отправляем уведомление в Telegram
        const message = `🎬 <b>Новый файл загружен!</b>\n\n📁 Файл: ${fileInfo.originalName}\n📏 Размер: ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB\n⏰ Время: ${new Date().toLocaleString('ru-RU')}\n\n🔧 Готов к восстановлению!`;
        await sendTelegramNotification(message);
        
        res.json({
            success: true,
            message: 'Поврежденный файл загружен успешно',
            file: fileInfo
        });
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

// Загрузка рабочего файла (опционально)
app.post('/api/upload-working', upload.single('workingFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: req.file.path,
            uploadTime: new Date().toISOString()
        };

        console.log('Загружен рабочий файл:', fileInfo);
        
        // Отправляем уведомление в Telegram
        const message = `✅ <b>Рабочий файл загружен!</b>\n\n📁 Файл: ${fileInfo.originalName}\n📏 Размер: ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB\n⏰ Время: ${new Date().toLocaleString('ru-RU')}\n\n🎯 Это улучшит качество восстановления!`;
        await sendTelegramNotification(message);
        
        res.json({
            success: true,
            message: 'Рабочий файл загружен успешно',
            file: fileInfo
        });
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

// Запуск процесса восстановления
app.post('/api/start-recovery', async (req, res) => {
    try {
        const { damagedFile, workingFile, email, telegram } = req.body;
        
        if (!damagedFile) {
            return res.status(400).json({ error: 'Поврежденный файл не указан' });
        }

        // Здесь будет логика восстановления
        console.log('Запуск восстановления:', {
            damagedFile,
            workingFile,
            email,
            telegram,
            timestamp: new Date().toISOString()
        });

        // Симуляция процесса восстановления
        const recoveryId = Date.now().toString();
        
        // Отправляем уведомление в Telegram
        const message = `🚀 <b>Восстановление запущено!</b>\n\n📁 Файл: ${damagedFile.originalName}\n📧 Email: ${email || 'Не указан'}\n📱 Telegram: ${telegram || 'Не указан'}\n⏰ Время: ${new Date().toLocaleString('ru-RU')}\n\n🆔 ID: ${recoveryId}`;
        await sendTelegramNotification(message);
        
        res.json({
            success: true,
            message: 'Восстановление запущено',
            recoveryId: recoveryId,
            estimatedTime: '5-10 минут'
        });

        // В реальном приложении здесь запускается процесс восстановления
        // Например, вызов ffmpeg или другого инструмента
        
    } catch (error) {
        console.error('Ошибка запуска восстановления:', error);
        res.status(500).json({ error: 'Ошибка запуска восстановления' });
    }
});

// Получение статуса восстановления
app.get('/api/recovery-status/:id', (req, res) => {
    const { id } = req.params;
    
    // Здесь будет проверка реального статуса
    // Пока возвращаем заглушку
    res.json({
        recoveryId: id,
        status: 'processing',
        progress: Math.floor(Math.random() * 100),
        estimatedTime: '3 минуты'
    });
});

// Список загруженных файлов
app.get('/api/files', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir).map(filename => {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                uploadTime: stats.mtime,
                path: filePath
            };
        });
        
        res.json({ files });
    } catch (error) {
        console.error('Ошибка чтения файлов:', error);
        res.status(500).json({ error: 'Ошибка чтения файлов' });
    }
});

// Скачивание восстановленного файла
app.get('/api/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(processedDir, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Файл не найден' });
    }
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Файл слишком большой (максимум 1GB)' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Неожиданный файл в запросе' });
        }
    }
    
    if (error.message === 'Только видео файлы разрешены!') {
        return res.status(400).json({ error: error.message });
    }
    
    console.error('Ошибка сервера:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера (только если не на Vercel)
if (process.env.NODE_ENV !== 'production') {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`📁 Папка загрузок: ${uploadsDir}`);
        console.log(`📁 Папка обработанных файлов: ${processedDir}`);
        console.log(`🌐 Откройте: http://localhost:${PORT}`);
    });

    // Обработка ошибок сервера
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Порт ${PORT} уже занят!`);
            console.error('Попробуйте другой порт или остановите процесс на этом порту');
        } else {
            console.error('❌ Ошибка запуска сервера:', error);
        }
        process.exit(1);
    });

    // Обработка неожиданного завершения
    process.on('uncaughtException', (error) => {
        console.error('❌ Неожиданная ошибка:', error);
        server.close(() => {
            console.log('Сервер остановлен');
            process.exit(1);
        });
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Необработанное отклонение промиса:', reason);
        server.close(() => {
            console.log('Сервер остановлен');
            process.exit(1);
        });
    });
}

module.exports = app;
