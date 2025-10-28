import express from 'express';
import { addonController } from '../controllers/AddonController.js';

const router = express.Router();

router.post('/', addonController.createAddon);
router.get('/available', addonController.getAvailableAddons);
router.get('/type/:type', addonController.getAddonsByType);
router.get('/', addonController.getAllAddons);
router.put('/:id', addonController.updateAddon);
router.delete('/:id', addonController.deleteAddon);

export default router;