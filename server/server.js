import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

// Импорты маршрутов
import apiRoutes from './routes/index.js';
import cleanupGuestCarts from './cron/cleanupGuestCarts.js';

// Загружаем .env файл ДО всего остального
dotenv.config();

// ES6 модули не имеют __dirname, создаем его
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5506;

// Middleware
app.use(cors());
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));
app.use(express.json());
app.use(compression());

// ОПТИМИЗИРОВАННЫЙ КОД ДЛЯ СТАТИЧЕСКИХ ФАЙЛОВ:
// Убедимся, что директории существуют
const uploadsDir = path.join(__dirname, 'uploads');
const thumbnailsDir = path.join(__dirname, 'uploads', 'thumbnails');

import fs from 'fs';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Обслуживание статических файлов - ОДНА строка вместо нескольких
app.use('/uploads', express.static(uploadsDir));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ БАЗА ДАННЫХ MONGODB ПОДКЛЮЧЕННА!!!'))
    .catch((error) => {
        console.error('❌ Ошибка подключения к MongoDB:', error);
        process.exit(1);
    });

// Обработка событий MongoDB
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Регистрация маршрутов API
app.use('/api', apiRoutes);

// Обработка несуществующих маршрутов
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack
        })
    });
});

// Настройка cron jobs
cron.schedule('0 0 3 * * *', cleanupGuestCarts);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT. Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM. Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 БАКЫТ, СЕРВЕР РАБОТАЕТ НА ${PORT} ПОРТУ!!!`);
    console.log(`🔗 API доступно по: http://localhost:${PORT}/`);
    console.log(`📁 Статические файлы доступны по: http://localhost:${PORT}/uploads/`);
});