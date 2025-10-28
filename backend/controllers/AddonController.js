import Addon from '../models/Addon.js';

export const addonController = {
    // Создание нового дополнения
    createAddon: async (req, res) => {
        try {
            const addon = new Addon(req.body);
            await addon.save();
            res.status(201).json(addon);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Получение всех доступных дополнений
    getAvailableAddons: async (req, res) => {
        try {
            const addons = await Addon.find({
                isActive: true,
                quantity: { $gt: 0 }
            });
            res.json(addons);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Получение дополнений по типу
    getAddonsByType: async (req, res) => {
        try {
            const addons = await Addon.find({
                type: req.params.type,
                isActive: true,
                quantity: { $gt: 0 }
            });
            res.json(addons);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Получение всех дополнений (для админа)
    getAllAddons: async (req, res) => {
        try {
            const addons = await Addon.find();
            res.json(addons);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Обновление дополнения
    updateAddon: async (req, res) => {
        try {
            const addon = await Addon.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!addon) {
                return res.status(404).json({ error: 'Дополнение не найдено' });
            }
            res.json(addon);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Удаление дополнения
    deleteAddon: async (req, res) => {
        try {
            const addon = await Addon.findByIdAndDelete(req.params.id);
            if (!addon) {
                return res.status(404).json({ error: 'Дополнение не найдено' });
            }
            res.json({ message: 'Дополнение удалено' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};