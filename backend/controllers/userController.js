import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Контроллер для обновления профиля пользователя
export const updateProfile = async (req, res) => {
    const userId = req.params.userId;
    const {
        address,
        phoneNumber,
        name,
        email
    } = req.body;

    try {
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Обновляем данные профиля
        existingUser.address = address;
        existingUser.phoneNumber = phoneNumber;
        existingUser.name = name;
        existingUser.email = email;

        const updatedUser = await existingUser.save();

        // Обновляем последний заказ пользователя
        const latestOrder = await Order.findOne({
            user: userId
        }).sort({
            date: -1
        });

        if (latestOrder) {
            latestOrder.address = address;
            latestOrder.phoneNumber = phoneNumber;
            await latestOrder.save();
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};

// Контроллер для получения истории заказов
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.userId
        }).populate('products.product');
        res.json(orders);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления пароля
export const updatePassword = async (req, res) => {
    const userId = req.params.userId;
    const {
        currentPassword,
        newPassword
    } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        await user.save();

        res.json({
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};

// Контроллер для получения списка клиентов (для админа)
export const getClients = async (req, res) => {
    try {
        const clients = await User.find({
            role: 'customer'
        }).select('name email address phoneNumber createdAt');
        res.json(clients);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления клиента
export const deleteClient = async (req, res) => {
    try {
        const clientId = req.params.id;

        const deletedClient = await User.findByIdAndDelete(clientId);

        if (!deletedClient) {
            return res.status(404).json({
                message: 'Client not found'
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
            message: 'Client deleted successfully and orders updated'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting client and updating orders',
            error
        });
    }
};

// Контроллер для управления избранными товарами
export const addToFavorites = async (req, res) => {
    const {
        userId
    } = req.params;
    const {
        productId
    } = req.body;

    if (!productId) {
        return res.status(400).json({
            message: 'Товар не указан'
        });
    }

    try {
        const user = await User.findOneAndUpdate({
            _id: userId,
            favorites: {
                $ne: productId
            }
        }, {
            $push: {
                favorites: productId
            }
        }, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден или товар уже в избранном'
            });
        }

        res.status(200).json(user.favorites);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

export const removeFromFavorites = async (req, res) => {
    const {
        userId,
        productId
    } = req.params;

    try {
        const user = await User.findOneAndUpdate({
            _id: userId,
            favorites: productId
        }, {
            $pull: {
                favorites: productId
            }
        }, {
            new: true
        });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден или товар не в избранном'
            });
        }

        res.status(200).json(user.favorites);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('favorites');
        if (!user) return res.status(404).json({
            message: 'Пользователь не найден'
        });

        res.status(200).json(user.favorites);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};