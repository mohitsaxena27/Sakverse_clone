import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import {
  GetIdea,
  PublishUserStory,
  UploadBAResource,
  getProcessedIdea,
  downloadFeature,
  downloadFeatureDoc

} from '../controllers/businessController.js';

const router = express.Router();

router.get('/getUS/:id', verifySession, GetIdea);
router.post('/publishUS', verifySession, PublishUserStory);
router.post('/uploadBA', verifySession, UploadBAResource); // multer is handled inside controller
router.get('/get_processed_idea/:pr_id', verifySession, getProcessedIdea);
router.post('/downloadFeature', verifySession, downloadFeature);
router.post('/downloadFeatureDoc', verifySession, downloadFeatureDoc);

export default router;
