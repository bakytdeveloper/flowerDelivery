import express from 'express';
import { wrapperController } from '../controllers/WrapperController.js';

const router = express.Router();

router.post('/', wrapperController.createWrapper);
router.get('/available', wrapperController.getAvailableWrappers);
router.get('/', wrapperController.getAllWrappers);
router.put('/:id', wrapperController.updateWrapper);
router.delete('/:id', wrapperController.deleteWrapper);

export default router;