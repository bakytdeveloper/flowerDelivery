import Cart from '../models/Cart.js';

async function cleanupGuestCarts() {
    try {
        const oneDayAgo = new Date();
        // Удаление корзины гостей через 24 часа (сутки)
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const result = await Cart.deleteMany({
            user: {
                $exists: false
            },
            lastUpdated: {
                $lt: oneDayAgo
            }
        });

        console.log(`Cron job: Удалено ${result.deletedCount} корзин гостей старше 24 часов.`);
    } catch (error) {
        console.error('Ошибка в cron-задаче по очистке корзин:', error);
    }
}

export default cleanupGuestCarts;