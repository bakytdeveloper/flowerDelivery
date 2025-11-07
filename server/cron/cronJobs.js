// import cron from 'node-cron';
// import { findAndDeleteZeroQuantityProducts } from '../services/productDeletionService.js';
//
// // Запускать каждый день в 3:00 ночи
// // cron.schedule('0 3 * * *', async () => {
// cron.schedule('*/5 * * * *', async () => {
//     console.log('🕒 Запуск ежедневной очистки товаров с нулевым количеством...');
//     try {
//         const result = await findAndDeleteZeroQuantityProducts();
//         console.log('✅ Результат очистки:', result);
//     } catch (error) {
//         console.error('❌ Ошибка при автоматической очистке:', error);
//     }
// });
//
// console.log('✅ Планировщик задач запущен (очистка в 3:00 каждый день)');