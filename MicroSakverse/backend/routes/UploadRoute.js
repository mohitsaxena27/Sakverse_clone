import express from 'express';
import {
  getFolderStructure,
  createFileOrFolder,
  deleteFileOrFolder,
  uploadFiles,
  upload
} from '../controllers/UploadController.js';

const router = express.Router();

router.get('/folder-structure', getFolderStructure);
router.post('/CreateFile/:folderName', createFileOrFolder);
router.delete('/DeleteFile/:folderName', deleteFileOrFolder);
router.post('/UploadFiles/:folderName', upload, uploadFiles);

export default router;
