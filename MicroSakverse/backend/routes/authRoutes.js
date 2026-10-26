import express from 'express';
import {loginUser,logoutUser } from '../controllers/authController.js';
import { checkAuth } from '../controllers/authController.js';
import { verifySession } from '../middleware/authMiddleware.js';
import { getAssignedProjects } from '../controllers/projectController.js';
const router = express.Router();

router.post('/login', loginUser);
router.post('/logout',verifySession, logoutUser);
router.get('/check', checkAuth,verifySession);
router.get('/project', verifySession, getAssignedProjects);



router.get('/us_list', verifySession, getAssignedProjects);

export default router;