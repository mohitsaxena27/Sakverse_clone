import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import {
  generateCsv,
} from '../controllers/dataController.js';

const router = express.Router();

// ==================== DATA ROUTES ====================

router.post('/generate_synthetic_data', verifySession, generateCsv);

export default router;
