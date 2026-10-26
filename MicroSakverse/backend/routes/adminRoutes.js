import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import { projectOnboarding ,GetProjectList,GetUserList} from '../controllers/adminController.js';

const router = express.Router();

// Streaming form-data proxy — no multer, no extra headers
router.post('/project_onboarding', verifySession, projectOnboarding);
router.get('/projects', GetProjectList);
router.get('/user', GetUserList);

export default router;
