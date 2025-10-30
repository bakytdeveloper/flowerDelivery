// import bcrypt from 'bcrypt';
// import User from '../models/User.js';
// import Order from '../models/Order.js';
//
// // Контроллер для обновления профиля пользователя
// export const updateProfile = async (req, res) => {
//     const userId = req.params.userId;
//     const {
//         address,
//         phoneNumber,
//         name,
//         email
//     } = req.body;
//
//     try {
//         const existingUser = await User.findById(userId);
//
//         if (!existingUser) {
//             return res.status(404).json({
//                 message: 'User not found'
//             });
//         }
//
//         // Обновляем данные профиля
//         existingUser.address = address;
//         existingUser.phoneNumber = phoneNumber;
//         existingUser.name = name;
//         existingUser.email = email;
//
//         const updatedUser = await existingUser.save();
//
//         // Обновляем последний заказ пользователя
//         const latestOrder = await Order.findOne({
//             user: userId
//         }).sort({
//             date: -1
//         });
//
//         if (latestOrder) {
//             latestOrder.address = address;
//             latestOrder.phoneNumber = phoneNumber;
//             await latestOrder.save();
//         }
//
//         res.json({
//             message: 'Profile updated successfully',
//             user: updatedUser
//         });
//     } catch (error) {
//         console.error('Error updating profile:', error);
//         res.status(500).json({
//             message: 'Internal Server Error'
//         });
//     }
// };
//
// // Контроллер для получения истории заказов
// export const getOrders = async (req, res) => {
//     try {
//         const orders = await Order.find({
//             user: req.user.userId
//         }).populate('products.product');
//         res.json(orders);
//     } catch (error) {
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };
//
// // Контроллер для обновления пароля
// export const updatePassword = async (req, res) => {
//     const userId = req.params.userId;
//     const {
//         currentPassword,
//         newPassword
//     } = req.body;
//
//     try {
//         const user = await User.findById(userId);
//
//         if (!user) {
//             return res.status(404).json({
//                 message: 'User not found'
//             });
//         }
//
//         const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
//
//         if (!isPasswordValid) {
//             return res.status(401).json({
//                 message: 'Current password is incorrect'
//             });
//         }
//
//         const hashedNewPassword = await bcrypt.hash(newPassword, 10);
//         user.password = hashedNewPassword;
//
//         await user.save();
//
//         res.json({
//             message: 'Password updated successfully'
//         });
//     } catch (error) {
//         console.error('Error updating password:', error);
//         res.status(500).json({
//             message: 'Internal Server Error'
//         });
//     }
// };
//
// // Контроллер для получения списка клиентов (для админа)
// export const getClients = async (req, res) => {
//     try {
//         const clients = await User.find({
//             role: 'customer'
//         }).select('name email address phoneNumber createdAt');
//         res.json(clients);
//     } catch (error) {
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };
//
// // Контроллер для удаления клиента
// export const deleteClient = async (req, res) => {
//     try {
//         const clientId = req.params.id;
//
//         const deletedClient = await User.findByIdAndDelete(clientId);
//
//         if (!deletedClient) {
//             return res.status(404).json({
//                 message: 'Client not found'
//             });
//         }
//
//         // Обновляем заказы, связанные с этим клиентом
//         await Order.updateMany({
//             user: clientId
//         }, {
//             $set: {
//                 "guestInfo.name": deletedClient.name,
//                 "guestInfo.email": deletedClient.email
//             },
//             $unset: {
//                 user: ""
//             }
//         });
//
//         res.status(200).json({
//             message: 'Client deleted successfully and orders updated'
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: 'Error deleting client and updating orders',
//             error
//         });
//     }
// };
//
// // Контроллер для управления избранными товарами
// export const addToFavorites = async (req, res) => {
//     const {
//         userId
//     } = req.params;
//     const {
//         productId
//     } = req.body;
//
//     if (!productId) {
//         return res.status(400).json({
//             message: 'Товар не указан'
//         });
//     }
//
//     try {
//         const user = await User.findOneAndUpdate({
//             _id: userId,
//             favorites: {
//                 $ne: productId
//             }
//         }, {
//             $push: {
//                 favorites: productId
//             }
//         }, {
//             new: true,
//             runValidators: true
//         });
//
//         if (!user) {
//             return res.status(404).json({
//                 message: 'Пользователь не найден или товар уже в избранном'
//             });
//         }
//
//         res.status(200).json(user.favorites);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: 'Ошибка сервера'
//         });
//     }
// };
//
// export const removeFromFavorites = async (req, res) => {
//     const {
//         userId,
//         productId
//     } = req.params;
//
//     try {
//         const user = await User.findOneAndUpdate({
//             _id: userId,
//             favorites: productId
//         }, {
//             $pull: {
//                 favorites: productId
//             }
//         }, {
//             new: true
//         });
//
//         if (!user) {
//             return res.status(404).json({
//                 message: 'Пользователь не найден или товар не в избранном'
//             });
//         }
//
//         res.status(200).json(user.favorites);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: 'Ошибка сервера'
//         });
//     }
// };
//
// export const getFavorites = async (req, res) => {
//     try {
//         const user = await User.findById(req.params.userId).populate('favorites');
//         if (!user) return res.status(404).json({
//             message: 'Пользователь не найден'
//         });
//
//         res.status(200).json(user.favorites);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: 'Ошибка сервера'
//         });
//     }
// };




import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Контроллер для получения профиля пользователя
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

// Контроллер для обновления профиля пользователя
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            address,
            phoneNumber,
            name,
            email
        } = req.body;

        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        // Проверяем email на уникальность (если email изменен)
        if (email && email !== existingUser.email) {
            const emailExists = await User.findOne({
                email: email,
                _id: { $ne: userId }
            });
            if (emailExists) {
                return res.status(400).json({
                    message: 'Email уже используется другим пользователем'
                });
            }
        }

        // Обновляем данные профиля
        if (name) existingUser.name = name;
        if (email) existingUser.email = email;
        if (address !== undefined) existingUser.address = address;
        if (phoneNumber !== undefined) existingUser.phoneNumber = phoneNumber;

        const updatedUser = await existingUser.save();

        // Обновляем последний заказ пользователя
        const latestOrder = await Order.findOne({
            user: userId
        }).sort({
            date: -1
        });

        if (latestOrder) {
            if (address) latestOrder.address = address;
            if (phoneNumber) latestOrder.phoneNumber = phoneNumber;
            await latestOrder.save();
        }

        res.json({
            message: 'Профиль успешно обновлен',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                address: updatedUser.address,
                phoneNumber: updatedUser.phoneNumber,
                role: updatedUser.role,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

// Контроллер для обновления пароля
export const updatePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Текущий и новый пароль обязательны'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Новый пароль должен содержать минимум 6 символов'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Текущий пароль неверен'
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        await user.save();

        res.json({
            message: 'Пароль успешно обновлен'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

// Контроллер для получения истории заказов пользователя
export const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.userId
        })
            .populate('flowerItems.product', 'name images price')
            .populate('addonItems.addonId', 'name image price type')
            .sort({ date: -1 });

        res.json({
            orders: orders.map(order => ({
                _id: order._id,
                totalAmount: order.totalAmount,
                status: order.status,
                date: order.date,
                flowerItems: order.flowerItems,
                addonItems: order.addonItems,
                paymentMethod: order.paymentMethod,
                address: order.address,
                phoneNumber: order.phoneNumber
            }))
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            message: 'Ошибка при получении заказов'
        });
    }
};

// Контроллер для получения деталей заказа пользователя
export const getUserOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user.userId
        })
            .populate('flowerItems.product', 'name images price description')
            .populate('addonItems.addonId', 'name image price type description');

        if (!order) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            message: 'Ошибка при получении деталей заказа'
        });
    }
};

// Контроллер для управления избранными товарами
export const addToFavorites = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: 'Товар не указан'
            });
        }

        const user = await User.findOneAndUpdate({
            _id: userId,
            favorites: { $ne: productId }
        }, {
            $push: { favorites: productId }
        }, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(400).json({
                message: 'Пользователь не найден или товар уже в избранном'
            });
        }

        res.status(200).json({
            message: 'Товар добавлен в избранное',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

export const removeFromFavorites = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;

        const user = await User.findOneAndUpdate({
            _id: userId,
            favorites: productId
        }, {
            $pull: { favorites: productId }
        }, {
            new: true
        });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден или товар не в избранном'
            });
        }

        res.status(200).json({
            message: 'Товар удален из избранного',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate('favorites', 'name images price description isActive');

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        // Фильтруем только активные товары
        const activeFavorites = user.favorites.filter(item => item.isActive);

        res.status(200).json(activeFavorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

// Контроллер для получения статистики пользователя
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [totalOrders, totalSpent, favoriteCount] = await Promise.all([
            Order.countDocuments({ user: userId }),
            Order.aggregate([
                { $match: { user: userId } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            User.findById(userId).select('favorites')
        ]);

        res.json({
            totalOrders: totalOrders || 0,
            totalSpent: totalSpent[0]?.total || 0,
            favoriteCount: favoriteCount?.favorites?.length || 0
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            message: 'Ошибка при получении статистики'
        });
    }
};

// АДМИН КОНТРОЛЛЕРЫ

// Контроллер для получения списка клиентов (для админа)
export const getClients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = {
            role: 'customer'
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const clients = await User.find(query)
            .select('name email address phoneNumber createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const totalClients = await User.countDocuments(query);

        res.json({
            clients,
            totalPages: Math.ceil(totalClients / limit),
            currentPage: page,
            totalClients
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            message: 'Ошибка при получении списка клиентов'
        });
    }
};

// Контроллер для получения деталей клиента (для админа)
export const getClientDetails = async (req, res) => {
    try {
        const client = await User.findById(req.params.id)
            .select('-password');

        if (!client) {
            return res.status(404).json({
                message: 'Клиент не найден'
            });
        }

        const clientOrders = await Order.find({ user: req.params.id })
            .sort({ date: -1 })
            .limit(10);

        res.json({
            client,
            recentOrders: clientOrders
        });
    } catch (error) {
        console.error('Error fetching client details:', error);
        res.status(500).json({
            message: 'Ошибка при получении деталей клиента'
        });
    }
};

// Контроллер для удаления клиента (для админа)
export const deleteClient = async (req, res) => {
    try {
        const clientId = req.params.id;

        const deletedClient = await User.findByIdAndDelete(clientId);

        if (!deletedClient) {
            return res.status(404).json({
                message: 'Клиент не найден'
            });
        }

        // Обновляем заказы, связанные с этим клиентом
        await Order.updateMany({
            user: clientId
        }, {
            $set: {
                "guestInfo.name": deletedClient.name,
                "guestInfo.email": deletedClient.email
            },
            $unset: {
                user: ""
            }
        });

        res.status(200).json({
            message: 'Клиент успешно удален, заказы обновлены'
        });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            message: 'Ошибка при удалении клиента'
        });
    }
};