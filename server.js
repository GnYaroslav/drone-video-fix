const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();

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
app.use(express.static(__dirname));

// Настройка multer для загрузки файлов (память вместо диска)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 100, // 100MB максимум для Vercel
    },
    fileFilter: (req, file, cb) => {
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

// Загрузка поврежденного файла
app.post('/api/upload-damaged', upload.single('damagedFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const fileInfo = {
            originalName: req.file.originalname,
            size: req.file.size,
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
            originalName: req.file.originalname,
            size: req.file.size,
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

        console.log('Запуск восстановления:', {
            damagedFile,
            workingFile,
            email,
            telegram,
            timestamp: new Date().toISOString()
        });

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
        
    } catch (error) {
        console.error('Ошибка запуска восстановления:', error);
        res.status(500).json({ error: 'Ошибка запуска восстановления' });
    }
});

// Получение статуса восстановления
app.get('/api/recovery-status/:id', (req, res) => {
    const { id } = req.params;
    
    res.json({
        recoveryId: id,
        status: 'processing',
        progress: Math.floor(Math.random() * 100),
        estimatedTime: '3 минуты'
    });
});

// Список загруженных файлов
app.get('/api/files', (req, res) => {
    res.json({ 
        files: [],
        message: 'Файлы хранятся в памяти (serverless environment)'
    });
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Файл слишком большой (максимум 100MB)' });
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

module.exports = app;
