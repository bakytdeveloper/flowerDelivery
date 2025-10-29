import Wrapper from '../models/Wrapper.js';

/**
 * Создать новую обертку
 */
export const createWrapper = async (req, res) => {
    try {
        const wrapper = new Wrapper(req.body);
        await wrapper.save();
        res.status(201).json(wrapper);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Получить все доступные обертки (для клиентов)
 */
export const getAvailableWrappers = async (req, res) => {
    try {
        const wrappers = await Wrapper.find({
            isActive: true,
            quantity: { $gt: 0 }
        });
        res.json(wrappers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Получить все обертки (для админа)
 */
export const getAllWrappers = async (req, res) => {
    try {
        const wrappers = await Wrapper.find();
        res.json(wrappers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Обновить обертку
 */
export const updateWrapper = async (req, res) => {
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
};

/**
 * Удалить обертку
 */
export const deleteWrapper = async (req, res) => {
    try {
        const wrapper = await Wrapper.findByIdAndDelete(req.params.id);
        if (!wrapper) {
            return res.status(404).json({ error: 'Обертка не найдена' });
        }
        res.json({ message: 'Обертка удалена' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
