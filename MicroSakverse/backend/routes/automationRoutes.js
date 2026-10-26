import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import {
  ExecuteTest,
  GetTestScenario,
  GetTestResult,
  AddstepsToTest,
  DeletePlannedStep,
  MovePlannedStep,
  UpdatePlannedIntent,
  UpdateExecutionStep,
  ExecuteSuiteParallel,
  OpenSuiteReport,
  CloneTest,
 GenerateReport 
} from '../controllers/automationController.js';
 
const router = express.Router();
 
router.post('/executeTest',                      verifySession, ExecuteTest);
router.post('/cloneTest',                        verifySession, CloneTest);
router.get('/GetTestScenario',                   verifySession, GetTestScenario);
router.get('/execution-result/:testID',          verifySession, GetTestResult);
router.post('/addStep',                          verifySession, AddstepsToTest);

router.delete('/delete-step/:plannedStepId',     verifySession, DeletePlannedStep);
router.put('/move-step/:plannedStepId',        verifySession, MovePlannedStep);       
router.patch('/planned-intent/:plannedStepId',   verifySession, UpdatePlannedIntent);
router.patch('/execution-step/:plannedStepId',   verifySession, UpdateExecutionStep);
router.get('/open-suite-report',                 verifySession, OpenSuiteReport);
router.post('/execute-suite-parallel',          verifySession, ExecuteSuiteParallel);
router.post('/generate-report', GenerateReport);

 
export default router;
 