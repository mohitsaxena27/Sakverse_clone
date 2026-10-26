import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import { 
  CreateSuite, 
  GetSuiteList, 
  ExecuteSuite, 
  GetSuiteReportJson 
} from '../controllers/suiteController.js';

const router = express.Router();

router.post('/test-suites', verifySession, CreateSuite);
router.get('/test-suites', verifySession, GetSuiteList);
router.post('/execute-suite/:suite_id', verifySession, ExecuteSuite);
router.get('/test-suites/:suite_id/report/json', verifySession, GetSuiteReportJson);

export default router;