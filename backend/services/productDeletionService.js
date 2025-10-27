import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import User from '../models/User.js';
import {
    transporter
} from '../smtp/otpService.js';
import {
    fileURLToPath
} from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Функция для отправки уведомлений администратору о удалении товара
async function notifyAdminAboutProductDeletion(productName, adminId) {
    try {
        // Находим администратора по ID
        const admin = await User.findById(adminId);

        if (admin && admin.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: admin.email,
                subject: `Удаление товара: ${productName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h3>Уведомление об удалении товара</h3>
                        <p>Дорогой ${admin.name},</p>
                        <p>Товар <strong>"${productName}"</strong> был автоматически удалён из системы по следующим причинам:</p>
                        <ul>
                            <li>Нулевое количество на складе</li>
                            <li>Автоматическая очистка неактивных товаров</li>
                        </ul>
                        <p>Если это произошло по ошибке, пожалуйста, восстановите товар вручную через панель администратора.</p>
                        <br>
                        <p>С уважением,<br>Система автоматического управления магазином</p>
                    </div>
                `,
                text: `Дорогой ${admin.name},\n\nТовар "${productName}" был автоматически удалён из-за нулевого количества на складе.\n\nЕсли это произошло по ошибке, пожалуйста, восстановите товар вручную через панель администратора.\n\nС уважением,\nСистема автоматического управления магазином`
            };

            await transporter.sendMail(mailOptions);
            console.log(`Notification sent to admin about product deletion: ${productName}`);
        }
    } catch (error) {
        console.error('Error sending deletion notification to admin:', error);
    }
}

// Функция для отправки уведомления всем администраторам
async function notifyAllAdminsAboutProductDeletion(productName) {
    try {
        // Находим всех администраторов
        const admins = await User.find({
            role: 'admin'
        });

        if (admins.length > 0) {
            const adminEmails = admins.map(admin => admin.email).filter(email => email);

            if (adminEmails.length > 0) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: adminEmails,
                    subject: `Автоматическое удаление товара: ${productName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                            <h3>Автоматическое удаление товара</h3>
                            <p>Товар <strong>"${productName}"</strong> был автоматически удалён из системы.</p>
                            <p><strong>Причина:</strong> Нулевое количество на складе</p>
                            <p><strong>Время удаления:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                            <br>
                            <p>Это автоматическое уведомление. Если требуется восстановление товара, используйте панель администратора.</p>
                            <br>
                            <p>С уважением,<br>Система автоматического управления</p>
                        </div>
                    `,
                    text: `Товар "${productName}" был автоматически удалён из-за нулевого количества на складе.\n\nВремя удаления: ${new Date().toLocaleString('ru-RU')}\n\nЭто автоматическое уведомление.`
                };

                await transporter.sendMail(mailOptions);
                console.log(`Notification sent to all admins about product deletion: ${productName}`);
            }
        }
    } catch (error) {
        console.error('Error sending deletion notification to all admins:', error);
    }
}

// Функция для безопасного удаления файла изображения
async function deleteProductImages(images) {
    if (!images || !Array.isArray(images)) {
        return;
    }

    for (const imageUrl of images) {
        try {
            if (imageUrl && typeof imageUrl === 'string') {
                const imageName = path.basename(imageUrl);
                const imagePath = path.join(__dirname, '..', 'uploads', imageName);

                // Проверяем существует ли файл перед удалением
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(`Deleted image file: ${imageName}`);
                } else {
                    console.log(`Image file not found, skipping: ${imageName}`);
                }
            }
        } catch (error) {
            console.error(`Error deleting image ${imageUrl}:`, error);
            // Продолжаем выполнение даже если одно изображение не удалилось
        }
    }
}

// Основная функция для обработки удаления товаров
async function processDeletionAsync(productsToDelete) {
    if (!productsToDelete || !Array.isArray(productsToDelete)) {
        console.log('No products provided for deletion');
        return;
    }

    console.log(`Starting deletion process for ${productsToDelete.length} products`);

    for (const product of productsToDelete) {
        try {
            if (!product || !product._id) {
                console.log('Invalid product data, skipping');
                continue;
            }

            const productId = product._id;
            const productName = product.name || 'Unknown Product';

            console.log(`Processing deletion for product: ${productName} (${productId})`);

            // 1. Удаляем изображения товара
            await deleteProductImages(product.images);

            // 2. Отправляем уведомление администратору
            if (product.admin && product.admin._id) {
                await notifyAdminAboutProductDeletion(productName, product.admin._id);
            } else {
                // Если администратор не указан, отправляем всем администраторам
                await notifyAllAdminsAboutProductDeletion(productName);
            }

            // 3. Удаляем товар из базы данных
            await Product.findByIdAndDelete(productId);

            console.log(`Successfully deleted product: ${productName} (${productId})`);

        } catch (error) {
            console.error(`Error in deletion process for product ${product?._id}:`, error);
            // Продолжаем обработку следующих товаров даже при ошибке
        }
    }

    console.log(`Deletion process completed. Processed ${productsToDelete.length} products`);
}

// Функция для поиска и удаления товаров с нулевым количеством
async function findAndDeleteZeroQuantityProducts() {
    try {
        console.log('Starting automatic zero quantity products cleanup...');

        // Находим все товары с quantity = 0
        const zeroQuantityProducts = await Product.find({
            quantity: {
                $lte: 0
            },
            isActive: true // Только активные товары
        }).populate('admin', 'name email');

        if (zeroQuantityProducts.length === 0) {
            console.log('No zero quantity products found for deletion');
            return {
                deleted: 0,
                message: 'No products to delete'
            };
        }

        console.log(`Found ${zeroQuantityProducts.length} products with zero quantity`);

        // Обрабатываем удаление
        await processDeletionAsync(zeroQuantityProducts);

        return {
            deleted: zeroQuantityProducts.length,
            message: `Successfully deleted ${zeroQuantityProducts.length} products with zero quantity`
        };

    } catch (error) {
        console.error('Error in automatic zero quantity products cleanup:', error);
        throw error;
    }
}

// Функция для принудительного удаления товара по ID (для администратора)
async function forceDeleteProduct(productId) {
    try {
        const product = await Product.findById(productId).populate('admin', 'name email');

        if (!product) {
            throw new Error('Product not found');
        }

        console.log(`Force deleting product: ${product.name} (${productId})`);

        // Создаем массив для совместимости с processDeletionAsync
        const productsToDelete = [product];
        await processDeletionAsync(productsToDelete);

        return {
            success: true,
            message: `Product "${product.name}" has been force deleted`
        };

    } catch (error) {
        console.error(`Error force deleting product ${productId}:`, error);
        throw error;
    }
}

export {
    processDeletionAsync,
    findAndDeleteZeroQuantityProducts,
    forceDeleteProduct,
    deleteProductImages
};