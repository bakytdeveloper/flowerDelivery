// // productOwnership.js - для проверки, что товар принадлежит админу
// import Product from '../models/Product.js';
//
// const checkProductOwnership = async (req, res, next) => {
//     try {
//         const productId = req.params.id || req.body.productId;
//
//         if (!productId) {
//             return res.status(400).json({
//                 message: 'Product ID is required'
//             });
//         }
//
//         const product = await Product.findById(productId);
//
//         if (!product) {
//             return res.status(404).json({
//                 message: 'Product not found'
//             });
//         }
//
//         // Проверяем, что товар принадлежит текущему админу
//         if (product.admin.toString() !== req.user.id) {
//             return res.status(403).json({
//                 message: 'You do not have permission to modify this product'
//             });
//         }
//
//         req.product = product;
//         next();
//     } catch (error) {
//         console.error('Error in checkProductOwnership:', error);
//         res.status(500).json({
//             message: 'Server error'
//         });
//     }
// };
//
// export {
//     checkProductOwnership
// };