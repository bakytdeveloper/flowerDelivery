import Wrapper from '../models/Wrapper.js';

export const wrapperController = {
    // Создание новой обертки
    createWrapper: async (req, res) => {
        try {
            const wrapper = new Wrapper(req.body);
            await wrapper.save();
            res.status(201).json(wrapper);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Получение всех доступных оберток
    getAvailableWrappers: async (req, res) => {
        try {
            const wrappers = await Wrapper.find({
                isActive: true,
                quantity: { $gt: 0 }
            });
            res.json(wrappers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Получение всех оберток (для админа)
    getAllWrappers: async (req, res) => {
        try {
            const wrappers = await Wrapper.find();
            res.json(wrappers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Обновление обертки
    updateWrapper: async (req, res) => {
        try {
            const wrapper = await Wrapper.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!wrapper) {
                return res.status(404).json({ error: 'Обертка не найдена' });
            }
            res.json(wrapper);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Удаление обертки
    deleteWrapper: async (req, res) => {
        try {
            const wrapper = await Wrapper.findByIdAndDelete(req.params.id);
            if (!wrapper) {
                return res.status(404).json({ error: 'Обертка не найдена' });
            }
            res.json({ message: 'Обертка удалена' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};