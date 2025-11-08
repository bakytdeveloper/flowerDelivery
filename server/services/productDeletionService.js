// // import fs from 'fs';
// // import path from 'path';
// // import Product from '../models/Product.js';
// // import User from '../models/User.js';
// // import {
// //     transporter
// // } from '../smtp/otpService.js';
// // import {
// //     fileURLToPath
// // } from 'url';
// //
// // const __filename = fileURLToPath(
// //     import.meta.url);
// // const __dirname = path.dirname(__filename);
// //
// // // Функция для отправки уведомлений администратору о удалении товара
// // async function notifyAdminAboutProductDeletion(productName, adminId) {
// //     try {
// //         // Находим администратора по ID
// //         const admin = await User.findById(adminId);
// //
// //         if (admin && admin.email) {
// //             const mailOptions = {
// //                 from: process.env.EMAIL_USER,
// //                 to: admin.email,
// //                 subject: `Удаление товара: ${productName}`,
// //                 html: `
// //                     <div style="font-family: Arial, sans-serif; line-height: 1.6;">
// //                         <h3>Уведомление об удалении товара</h3>
// //                         <p>Дорогой ${admin.name},</p>
// //                         <p>Товар <strong>"${productName}"</strong> был автоматически удалён из системы по следующим причинам:</p>
// //                         <ul>
// //                             <li>Нулевое количество на складе</li>
// //                             <li>Автоматическая очистка неактивных товаров</li>
// //                         </ul>
// //                         <p>Если это произошло по ошибке, пожалуйста, восстановите товар вручную через панель администратора.</p>
// //                         <br>
// //                         <p>С уважением,<br>Система автоматического управления магазином</p>
// //                     </div>
// //                 `,
// //                 text: `Дорогой ${admin.name},\n\nТовар "${productName}" был автоматически удалён из-за нулевого количества на складе.\n\nЕсли это произошло по ошибке, пожалуйста, восстановите товар вручную через панель администратора.\n\nС уважением,\nСистема автоматического управления магазином`
// //             };
// //
// //             await transporter.sendMail(mailOptions);
// //             console.log(`Notification sent to admin about product deletion: ${productName}`);
// //         }
// //     } catch (error) {
// //         console.error('Error sending deletion notification to admin:', error);
// //     }
// // }
// //
// // // Функция для отправки уведомления всем администраторам
// // async function notifyAllAdminsAboutProductDeletion(productName) {
// //     try {
// //         // Находим всех администраторов
// //         const admins = await User.find({
// //             role: 'admin'
// //         });
// //
// //         if (admins.length > 0) {
// //             const adminEmails = admins.map(admin => admin.email).filter(email => email);
// //
// //             if (adminEmails.length > 0) {
// //                 const mailOptions = {
// //                     from: process.env.EMAIL_USER,
// //                     to: adminEmails,
// //                     subject: `Автоматическое удаление товара: ${productName}`,
// //                     html: `
// //                         <div style="font-family: Arial, sans-serif; line-height: 1.6;">
// //                             <h3>Автоматическое удаление товара</h3>
// //                             <p>Товар <strong>"${productName}"</strong> был автоматически удалён из системы.</p>
// //                             <p><strong>Причина:</strong> Нулевое количество на складе</p>
// //                             <p><strong>Время удаления:</strong> ${new Date().toLocaleString('ru-RU')}</p>
// //                             <br>
// //                             <p>Это автоматическое уведомление. Если требуется восстановление товара, используйте панель администратора.</p>
// //                             <br>
// //                             <p>С уважением,<br>Система автоматического управления</p>
// //                         </div>
// //                     `,
// //                     text: `Товар "${productName}" был автоматически удалён из-за нулевого количества на складе.\n\nВремя удаления: ${new Date().toLocaleString('ru-RU')}\n\nЭто автоматическое уведомление.`
// //                 };
// //
// //                 await transporter.sendMail(mailOptions);
// //                 console.log(`Notification sent to all admins about product deletion: ${productName}`);
// //             }
// //         }
// //     } catch (error) {
// //         console.error('Error sending deletion notification to all admins:', error);
// //     }
// // }
// //
// // // Функция для безопасного удаления файла изображения
// // async function deleteProductImages(images) {
// //     if (!images || !Array.isArray(images)) {
// //         return;
// //     }
// //
// //     for (const imageUrl of images) {
// //         try {
// //             if (imageUrl && typeof imageUrl === 'string') {
// //                 const imageName = path.basename(imageUrl);
// //                 const imagePath = path.join(__dirname, '..', 'uploads', imageName);
// //
// //                 // Проверяем существует ли файл перед удалением
// //                 if (fs.existsSync(imagePath)) {
// //                     fs.unlinkSync(imagePath);
// //                     console.log(`Deleted image file: ${imageName}`);
// //                 } else {
// //                     console.log(`Image file not found, skipping: ${imageName}`);
// //                 }
// //             }
// //         } catch (error) {
// //             console.error(`Error deleting image ${imageUrl}:`, error);
// //             // Продолжаем выполнение даже если одно изображение не удалилось
// //         }
// //     }
// // }
// //
// // // Основная функция для обработки удаления товаров
// // async function processDeletionAsync(productsToDelete) {
// //     if (!productsToDelete || !Array.isArray(productsToDelete)) {
// //         console.log('No products provided for deletion');
// //         return;
// //     }
// //
// //     console.log(`Starting deletion process for ${productsToDelete.length} products`);
// //
// //     for (const product of productsToDelete) {
// //         try {
// //             if (!product || !product._id) {
// //                 console.log('Invalid product data, skipping');
// //                 continue;
// //             }
// //
// //             const productId = product._id;
// //             const productName = product.name || 'Unknown Product';
// //
// //             console.log(`Processing deletion for product: ${productName} (${productId})`);
// //
// //             // 1. Удаляем изображения товара
// //             await deleteProductImages(product.images);
// //
// //             // 2. Отправляем уведомление администратору
// //             if (product.admin && product.admin._id) {
// //                 await notifyAdminAboutProductDeletion(productName, product.admin._id);
// //             } else {
// //                 // Если администратор не указан, отправляем всем администраторам
// //                 await notifyAllAdminsAboutProductDeletion(productName);
// //             }
// //
// //             // 3. Удаляем товар из базы данных
// //             await Product.findByIdAndDelete(productId);
// //
// //             console.log(`Successfully deleted product: ${productName} (${productId})`);
// //
// //         } catch (error) {
// //             console.error(`Error in deletion process for product ${product?._id}:`, error);
// //             // Продолжаем обработку следующих товаров даже при ошибке
// //         }
// //     }
// //
// //     console.log(`Deletion process completed. Processed ${productsToDelete.length} products`);
// // }
// //
// // // Функция для поиска и удаления товаров с нулевым количеством
// // async function findAndDeleteZeroQuantityProducts() {
// //     try {
// //         console.log('Starting automatic zero quantity products cleanup...');
// //
// //         // Находим все товары с quantity = 0
// //         const zeroQuantityProducts = await Product.find({
// //             quantity: {
// //                 $lte: 0
// //             },
// //             isActive: true // Только активные товары
// //         }).populate('admin', 'name email');
// //
// //         if (zeroQuantityProducts.length === 0) {
// //             console.log('No zero quantity products found for deletion');
// //             return {
// //                 deleted: 0,
// //                 message: 'No products to delete'
// //             };
// //         }
// //
// //         console.log(`Found ${zeroQuantityProducts.length} products with zero quantity`);
// //
// //         // Обрабатываем удаление
// //         await processDeletionAsync(zeroQuantityProducts);
// //
// //         return {
// //             deleted: zeroQuantityProducts.length,
// //             message: `Successfully deleted ${zeroQuantityProducts.length} products with zero quantity`
// //         };
// //
// //     } catch (error) {
// //         console.error('Error in automatic zero quantity products cleanup:', error);
// //         throw error;
// //     }
// // }
// //
// // // Функция для принудительного удаления товара по ID (для администратора)
// // async function forceDeleteProduct(productId) {
// //     try {
// //         const product = await Product.findById(productId).populate('admin', 'name email');
// //
// //         if (!product) {
// //             throw new Error('Product not found');
// //         }
// //
// //         console.log(`Force deleting product: ${product.name} (${productId})`);
// //
// //         // Создаем массив для совместимости с processDeletionAsync
// //         const productsToDelete = [product];
// //         await processDeletionAsync(productsToDelete);
// //
// //         return {
// //             success: true,
// //             message: `Product "${product.name}" has been force deleted`
// //         };
// //
// //     } catch (error) {
// //         console.error(`Error force deleting product ${productId}:`, error);
// //         throw error;
// //     }
// // }
// //
// // export {
// //     processDeletionAsync,
// //     findAndDeleteZeroQuantityProducts,
// //     forceDeleteProduct,
// //     deleteProductImages
// // };
//
//
// import fs from 'fs';
// import path from 'path';
// import Product from '../models/Product.js';
// import Addon from '../models/Addon.js';
// import Wrapper from '../models/Wrapper.js';
// import User from '../models/User.js';
// import { transporter } from '../smtp/otpService.js';
// import { fileURLToPath } from 'url';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// // Функция для отправки уведомления об удалении товара
// async function notifyAdminAboutProductDeletion(product, itemType = 'flower') {
//     try {
//         const itemTypeText = {
//             'flower': 'Цветы',
//             'addon': 'Дополнительный товар',
//             'wrapper': 'Упаковка'
//         }[itemType] || 'Товар';
//
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: process.env.ADMIN_EMAIL,
//             subject: `🗑️ АВТОМАТИЧЕСКОЕ УДАЛЕНИЕ: ${product.name}`,
//             html: `
//                 <!DOCTYPE html>
//                 <html>
//                 <head>
//                     <meta charset="utf-8">
//                     <style>
//                         body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
//                         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//                         .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
//                         .content { background: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; }
//                         .info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc3545; }
//                         .action-required { background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="container">
//                         <div class="header">
//                             <h1>🗑️ ТОВАР УДАЛЁН ИЗ СИСТЕМЫ</h1>
//                             <p>Автоматическая очистка базы данных</p>
//                         </div>
//
//                         <div class="content">
//                             <div class="info-card">
//                                 <h2>${product.name}</h2>
//                                 <p><strong>Тип товара:</strong> ${itemTypeText}</p>
//                                 <p><strong>Категория:</strong> ${product.category || 'Не указана'}</p>
//                                 <p><strong>Цена:</strong> ${product.price} сом</p>
//                                 <p><strong>Было продано:</strong> ${product.soldCount || 0} шт.</p>
//                             </div>
//
//                             <div class="action-required">
//                                 <h3>📋 Причина удаления:</h3>
//                                 <ul>
//                                     <li>Нулевое количество на складе (0 шт.)</li>
//                                     <li>Автоматическая очистка неактивных позиций</li>
//                                 </ul>
//                             </div>
//
//                             <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 5px;">
//                                 <p><strong>🔄 Если требуется восстановление:</strong></p>
//                                 <ol>
//                                     <li>Войдите в панель администратора</li>
//                                     <li>Проверьте архив удалённых товаров</li>
//                                     <li>Восстановите товар при необходимости</li>
//                                 </ol>
//                             </div>
//
//                             <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
//                                 <strong>Время удаления:</strong> ${new Date().toLocaleString('ru-RU')}<br>
//                                 <strong>ID товара:</strong> ${product._id}
//                             </p>
//                         </div>
//                     </div>
//                 </body>
//                 </html>
//             `,
//             text: `Товар "${product.name}" (${itemTypeText}) был автоматически удалён из-за нулевого количества на складе.\n\nВремя удаления: ${new Date().toLocaleString('ru-RU')}\nID: ${product._id}\n\nЕсли это произошло по ошибке, восстановите товар через панель администратора.`
//         };
//
//         await transporter.sendMail(mailOptions);
//         console.log(`✅ Уведомление об удалении отправлено: ${product.name}`);
//     } catch (error) {
//         console.error('❌ Ошибка отправки уведомления об удалении:', error);
//     }
// }
//
// // Функция для безопасного удаления файла изображения
// async function deleteProductImages(images) {
//     if (!images || !Array.isArray(images)) {
//         return;
//     }
//
//     let deletedCount = 0;
//     for (const imageUrl of images) {
//         try {
//             if (imageUrl && typeof imageUrl === 'string') {
//                 const imageName = path.basename(imageUrl);
//                 const imagePath = path.join(__dirname, '..', 'uploads', imageName);
//
//                 if (fs.existsSync(imagePath)) {
//                     fs.unlinkSync(imagePath);
//                     deletedCount++;
//                     console.log(`✅ Удалено изображение: ${imageName}`);
//                 }
//             }
//         } catch (error) {
//             console.error(`❌ Ошибка удаления изображения ${imageUrl}:`, error);
//         }
//     }
//
//     if (deletedCount > 0) {
//         console.log(`✅ Удалено ${deletedCount} изображений`);
//     }
// }
//
// // Основная функция для обработки удаления товаров
// async function processDeletionAsync(productsToDelete, itemType = 'flower') {
//     if (!productsToDelete || !Array.isArray(productsToDelete)) {
//         console.log('❌ Нет товаров для удаления');
//         return;
//     }
//
//     console.log(`🚀 Начало процесса удаления для ${productsToDelete.length} товаров (тип: ${itemType})`);
//
//     for (const product of productsToDelete) {
//         try {
//             if (!product || !product._id) {
//                 console.log('❌ Некорректные данные товара, пропускаем');
//                 continue;
//             }
//
//             const productId = product._id;
//             const productName = product.name || 'Неизвестный товар';
//
//             console.log(`🔍 Обработка удаления: ${productName} (${productId})`);
//
//             // 1. Удаляем изображения товара
//             if (product.images) {
//                 await deleteProductImages(product.images);
//             }
//
//             // 2. Отправляем уведомление администратору
//             await notifyAdminAboutProductDeletion(product, itemType);
//
//             // 3. Удаляем товар из базы данных
//             let deletedItem;
//             if (itemType === 'flower') {
//                 deletedItem = await Product.findByIdAndDelete(productId);
//             } else if (itemType === 'addon') {
//                 deletedItem = await Addon.findByIdAndDelete(productId);
//             } else if (itemType === 'wrapper') {
//                 deletedItem = await Wrapper.findByIdAndDelete(productId);
//             }
//
//             if (deletedItem) {
//                 console.log(`✅ Успешно удалён: ${productName} (${productId})`);
//             } else {
//                 console.log(`⚠️ Товар не найден в БД: ${productName} (${productId})`);
//             }
//
//         } catch (error) {
//             console.error(`❌ Ошибка при удалении товара ${product?._id}:`, error);
//         }
//     }
//
//     console.log(`✅ Процесс удаления завершён. Обработано ${productsToDelete.length} товаров`);
// }
//
// // Функция для поиска и удаления товаров с нулевым количеством
// async function findAndDeleteZeroQuantityProducts() {
//     try {
//         console.log('🔍 Запуск автоматической очистки товаров с нулевым количеством...');
//
//         // Находим все товары с quantity <= 0
//         const zeroQuantityProducts = await Product.find({
//             quantity: { $lte: 0 },
//             isActive: true
//         });
//
//         const zeroQuantityAddons = await Addon.find({
//             quantity: { $lte: 0 },
//             isActive: true
//         });
//
//         const zeroQuantityWrappers = await Wrapper.find({
//             quantity: { $lte: 0 },
//             isActive: true
//         });
//
//         const totalToDelete = zeroQuantityProducts.length + zeroQuantityAddons.length + zeroQuantityWrappers.length;
//
//         if (totalToDelete === 0) {
//             console.log('✅ Нет товаров с нулевым количеством для удаления');
//             return {
//                 deleted: 0,
//                 message: 'No products to delete'
//             };
//         }
//
//         console.log(`📊 Найдено для удаления:
//           - Цветы: ${zeroQuantityProducts.length}
//           - Доп. товары: ${zeroQuantityAddons.length}
//           - Упаковки: ${zeroQuantityWrappers.length}
//         `);
//
//         // Обрабатываем удаление по типам
//         if (zeroQuantityProducts.length > 0) {
//             await processDeletionAsync(zeroQuantityProducts, 'flower');
//         }
//         if (zeroQuantityAddons.length > 0) {
//             await processDeletionAsync(zeroQuantityAddons, 'addon');
//         }
//         if (zeroQuantityWrappers.length > 0) {
//             await processDeletionAsync(zeroQuantityWrappers, 'wrapper');
//         }
//
//         return {
//             deleted: totalToDelete,
//             details: {
//                 flowers: zeroQuantityProducts.length,
//                 addons: zeroQuantityAddons.length,
//                 wrappers: zeroQuantityWrappers.length
//             },
//             message: `Успешно удалено ${totalToDelete} товаров с нулевым количеством`
//         };
//
//     } catch (error) {
//         console.error('❌ Ошибка автоматической очистки товаров:', error);
//         throw error;
//     }
// }
//
// // Функция для принудительного удаления товара по ID
// async function forceDeleteProduct(productId, itemType = 'flower') {
//     try {
//         let product;
//         if (itemType === 'flower') {
//             product = await Product.findById(productId);
//         } else if (itemType === 'addon') {
//             product = await Addon.findById(productId);
//         } else if (itemType === 'wrapper') {
//             product = await Wrapper.findById(productId);
//         }
//
//         if (!product) {
//             throw new Error('Товар не найден');
//         }
//
//         console.log(`🔄 Принудительное удаление: ${product.name} (${productId})`);
//
//         const productsToDelete = [product];
//         await processDeletionAsync(productsToDelete, itemType);
//
//         return {
//             success: true,
//             message: `Товар "${product.name}" был принудительно удалён`
//         };
//
//     } catch (error) {
//         console.error(`❌ Ошибка принудительного удаления товара ${productId}:`, error);
//         throw error;
//     }
// }
//
// export {
//     processDeletionAsync,
//     findAndDeleteZeroQuantityProducts,
//     forceDeleteProduct,
//     deleteProductImages
// };




import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import Addon from '../models/Addon.js';
import Wrapper from '../models/Wrapper.js';
import User from '../models/User.js';
import { transporter } from '../smtp/otpService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция для отправки уведомления об удалении товара
async function notifyAdminAboutProductDeletion(product, itemType = 'flower') {
    try {
        const itemTypeText = {
            'flower': 'Цветы',
            'addon': 'Дополнительный товар',
            'wrapper': 'Упаковка'
        }[itemType] || 'Товар';

        // Проверяем, настроен ли email
        if (!process.env.EMAIL_USER || !process.env.SMTP_USER) {
            console.log('⚠️ Email не настроен, пропускаем отправку уведомления');
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.SMTP_USER,
            subject: `🗑️ АВТОМАТИЧЕСКОЕ УДАЛЕНИЕ: ${product.name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; }
                        .info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc3545; }
                        .action-required { background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🗑️ ТОВАР УДАЛЁН ИЗ СИСТЕМЫ</h1>
                            <p>Автоматическая очистка базы данных</p>
                        </div>
                        
                        <div class="content">
                            <div class="info-card">
                                <h2>${product.name}</h2>
                                <p><strong>Тип товара:</strong> ${itemTypeText}</p>
                                <p><strong>Категория:</strong> ${product.category || 'Не указана'}</p>
                                <p><strong>Цена:</strong> ${product.price} ₸</p>
                                <p><strong>Было продано:</strong> ${product.soldCount || 0} шт.</p>
                                <p><strong>Количество на момент удаления:</strong> ${product.quantity} шт.</p>
                            </div>

                            <div class="action-required">
                                <h3>📋 Причина удаления:</h3>
                                <ul>
                                    <li>Нулевое количество на складе (${product.quantity} шт.)</li>
                                    <li>Автоматическая очистка неактивных позиций</li>
                                </ul>
                            </div>

                            <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 5px;">
                                <p><strong>🔄 Если требуется восстановление:</strong></p>
                                <ol>
                                    <li>Войдите в панель администратора</li>
                                    <li>Проверьте архив удалённых товаров</li>
                                    <li>Восстановите товар при необходимости</li>
                                </ol>
                            </div>

                            <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                                <strong>Время удаления:</strong> ${new Date().toLocaleString('ru-RU')}<br>
                                <strong>ID товара:</strong> ${product._id}
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Товар "${product.name}" (${itemTypeText}) был автоматически удалён из-за нулевого количества на складе.\n\nДетали:\n- Количество: ${product.quantity} шт.\n- Цена: ${product.price} ₸\n- Категория: ${product.category || 'Не указана'}\n- Продано: ${product.soldCount || 0} шт.\n\nВремя удаления: ${new Date().toLocaleString('ru-RU')}\nID: ${product._id}\n\nЕсли это произошло по ошибке, восстановите товар через панель администратора.`
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Уведомление об удалении отправлено: ${product.name}`);
    } catch (error) {
        console.error('❌ Ошибка отправки уведомления об удалении:', error);
    }
}

// Функция для безопасного удаления файла изображения
async function deleteProductImages(images) {
    if (!images || !Array.isArray(images)) {
        return;
    }

    let deletedCount = 0;
    for (const imageUrl of images) {
        try {
            if (imageUrl && typeof imageUrl === 'string') {
                // Извлекаем имя файла из URL
                const imageName = path.basename(imageUrl);
                const imagePath = path.join(__dirname, '..', 'uploads', imageName);

                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    deletedCount++;
                    console.log(`✅ Удалено изображение: ${imageName}`);
                } else {
                    console.log(`⚠️ Файл изображения не найден: ${imageName}`);
                }
            }
        } catch (error) {
            console.error(`❌ Ошибка удаления изображения ${imageUrl}:`, error);
        }
    }

    if (deletedCount > 0) {
        console.log(`✅ Удалено ${deletedCount} изображений`);
    }
}

// Основная функция для обработки удаления товаров
async function processDeletionAsync(productsToDelete, itemType = 'flower') {
    if (!productsToDelete || !Array.isArray(productsToDelete) || productsToDelete.length === 0) {
        console.log('ℹ️ Нет товаров для удаления');
        return;
    }

    console.log(`🚀 Начало процесса удаления для ${productsToDelete.length} товаров (тип: ${itemType})`);

    let successfullyDeleted = 0;
    let errors = 0;

    for (const product of productsToDelete) {
        try {
            if (!product || !product._id) {
                console.log('❌ Некорректные данные товара, пропускаем');
                errors++;
                continue;
            }

            const productId = product._id;
            const productName = product.name || 'Неизвестный товар';

            console.log(`🔍 Обработка удаления: ${productName} (${productId})`);

            // 1. Удаляем изображения товара
            if (product.images && Array.isArray(product.images)) {
                await deleteProductImages(product.images);
            } else if (product.image && typeof product.image === 'string') {
                // Для дополнений и обёрток, где одно изображение
                await deleteProductImages([product.image]);
            }

            // 2. Отправляем уведомление администратору
            await notifyAdminAboutProductDeletion(product, itemType);

            // 3. Удаляем товар из базы данных
            let deletedItem;
            if (itemType === 'flower') {
                deletedItem = await Product.findByIdAndDelete(productId);
            } else if (itemType === 'addon') {
                deletedItem = await Addon.findByIdAndDelete(productId);
            } else if (itemType === 'wrapper') {
                deletedItem = await Wrapper.findByIdAndDelete(productId);
            }

            if (deletedItem) {
                console.log(`✅ Успешно удалён: ${productName} (${productId})`);
                successfullyDeleted++;
            } else {
                console.log(`⚠️ Товар не найден в БД: ${productName} (${productId})`);
                errors++;
            }

        } catch (error) {
            console.error(`❌ Ошибка при удалении товара ${product?._id}:`, error);
            errors++;
        }
    }

    console.log(`✅ Процесс удаления завершён. Успешно: ${successfullyDeleted}, Ошибок: ${errors}`);

    return {
        total: productsToDelete.length,
        successful: successfullyDeleted,
        errors: errors
    };
}

// Функция для поиска и удаления товаров с нулевым количеством
async function findAndDeleteZeroQuantityProducts() {
    try {
        console.log('🔍 Запуск автоматической очистки товаров с нулевым количеством...');
        const startTime = Date.now();

        // Находим все товары с quantity <= 0 И isActive: true
        const [zeroQuantityProducts, zeroQuantityAddons, zeroQuantityWrappers] = await Promise.all([
            Product.find({
                quantity: { $lte: 0 },
                isActive: true
            }),
            Addon.find({
                quantity: { $lte: 0 },
                isActive: true
            }),
            Wrapper.find({
                quantity: { $lte: 0 },
                isActive: true
            })
        ]);

        const totalToDelete = zeroQuantityProducts.length + zeroQuantityAddons.length + zeroQuantityWrappers.length;

        if (totalToDelete === 0) {
            console.log('✅ Нет товаров с нулевым количеством для удаления');
            return {
                deleted: 0,
                message: 'No products to delete',
                executionTime: Date.now() - startTime
            };
        }

        console.log(`📊 Найдено для удаления: 
          - Цветы: ${zeroQuantityProducts.length}
          - Доп. товары: ${zeroQuantityAddons.length}  
          - Упаковки: ${zeroQuantityWrappers.length}
          - Всего: ${totalToDelete}
        `);

        // Обрабатываем удаление по типам
        const results = {
            flowers: { total: zeroQuantityProducts.length },
            addons: { total: zeroQuantityAddons.length },
            wrappers: { total: zeroQuantityWrappers.length }
        };

        if (zeroQuantityProducts.length > 0) {
            results.flowers = await processDeletionAsync(zeroQuantityProducts, 'flower');
        }
        if (zeroQuantityAddons.length > 0) {
            results.addons = await processDeletionAsync(zeroQuantityAddons, 'addon');
        }
        if (zeroQuantityWrappers.length > 0) {
            results.wrappers = await processDeletionAsync(zeroQuantityWrappers, 'wrapper');
        }

        const executionTime = Date.now() - startTime;

        console.log(`🎉 Автоматическая очистка завершена за ${executionTime}ms`);

        return {
            deleted: totalToDelete,
            details: results,
            executionTime: executionTime,
            message: `Успешно удалено ${totalToDelete} товаров с нулевым количеством`
        };

    } catch (error) {
        console.error('❌ Ошибка автоматической очистки товаров:', error);
        throw error;
    }
}

// Функция для принудительного удаления товара по ID
async function forceDeleteProduct(productId, itemType = 'flower') {
    try {
        let product;
        if (itemType === 'flower') {
            product = await Product.findById(productId);
        } else if (itemType === 'addon') {
            product = await Addon.findById(productId);
        } else if (itemType === 'wrapper') {
            product = await Wrapper.findById(productId);
        }

        if (!product) {
            throw new Error('Товар не найден');
        }

        console.log(`🔄 Принудительное удаление: ${product.name} (${productId})`);

        const productsToDelete = [product];
        await processDeletionAsync(productsToDelete, itemType);

        return {
            success: true,
            message: `Товар "${product.name}" был принудительно удалён`
        };

    } catch (error) {
        console.error(`❌ Ошибка принудительного удаления товара ${productId}:`, error);
        throw error;
    }
}

export {
    processDeletionAsync,
    findAndDeleteZeroQuantityProducts,
    forceDeleteProduct,
    deleteProductImages
};