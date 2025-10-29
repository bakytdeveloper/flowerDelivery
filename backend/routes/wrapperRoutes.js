import express from 'express';
import {
    createWrapper,
    getAvailableWrappers,
    getAllWrappers,
    updateWrapper,
    deleteWrapper
}from '../controllers/wrapperController.js';

const router = express.Router();

router.post('/', createWrapper);
router.get('/available', getAvailableWrappers);
router.get('/', getAllWrappers);
router.put('/:id', updateWrapper);
router.delete('/:id', deleteWrapper);

export default router;