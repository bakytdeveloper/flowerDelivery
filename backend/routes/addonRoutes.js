import express from 'express';
import {
    createAddon,
    getAvailableAddons,
    getAddonsByType,
    getAllAddons,
    updateAddon,
    deleteAddon
} from '../controllers/addonController.js';

const router = express.Router();

router.post('/', createAddon);
router.get('/available', getAvailableAddons);
router.get('/type/:type', getAddonsByType);
router.get('/', getAllAddons);
router.put('/:id', updateAddon);
router.delete('/:id', deleteAddon);

export default router;