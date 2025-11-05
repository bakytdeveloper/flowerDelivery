import Addon from '../models/Addon.js';

// 🧩 Создание нового дополнения
export const createAddon = async (req, res) => {
    try {
        const addon = new Addon(req.body);
        await addon.save();
        res.status(201).json(addon);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 📦 Получение всех доступных дополнений
export const getAvailableAddons = async (req, res) => {
    try {
        const addons = await Addon.find({
            isActive: true,
            quantity: { $gt: 0 }
        });
        res.json(addons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🎯 Получение дополнений по типу
export const getAddonsByType = async (req, res) => {
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
};

// 🛠 Получение всех дополнений (для админа)
export const getAllAddons = async (req, res) => {
    try {
        const addons = await Addon.find();
        res.json(addons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔍 Получение дополнения по ID
export const getAddonById = async (req, res) => {
    try {
        const addon = await Addon.findById(req.params.id);
        if (!addon) {
            return res.status(404).json({ error: 'Дополнение не найдено' });
        }
        res.json(addon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✏️ Обновление дополнения
export const updateAddon = async (req, res) => {
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
};

// 🗑 Удаление дополнения
export const deleteAddon = async (req, res) => {
    try {
        const addon = await Addon.findByIdAndDelete(req.params.id);
        if (!addon) {
            return res.status(404).json({ error: 'Дополнение не найдено' });
        }
        res.json({ message: 'Дополнение удалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔎 Поиск дополнений
export const searchAddons = async (req, res) => {
    try {
        const { query, type } = req.query;
        const searchConditions = { isActive: true };

        if (query) {
            searchConditions.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        if (type && type !== 'all') {
            searchConditions.type = type;
        }

        const addons = await Addon.find(searchConditions);
        res.json(addons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};