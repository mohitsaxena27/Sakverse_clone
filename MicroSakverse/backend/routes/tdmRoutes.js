import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import {
  // Repository APIs
  getRepositories,
  createRepository,
  deleteRepository,
  
  // Table APIs
  getTableData,
  createTable,
  deleteTable,
  
  // Data Record APIs
  updateDataRecord,
  createDataRecord,
  deleteDataRecord,
  addTableColumn,
  
  // File/Download APIs
  downloadTable,
  

} from '../controllers/tdmController.js';

const router = express.Router();

// ==================== REPOSITORY ROUTES ====================
router.get('/repositories', verifySession, getRepositories);
router.post('/createrepository', verifySession, createRepository);
router.delete('/deleteRepository/:repoId', verifySession, deleteRepository);

// ==================== TABLE ROUTES ====================
router.get('/tabledata/:tableId', verifySession, getTableData);
router.post('/createtable', verifySession, createTable);
router.delete('/deleteTable/:tableId', verifySession, deleteTable);

// ==================== DATA RECORD ROUTES ====================
router.patch('/repository/:repoName/table/:tableName/row/:rowNumber/column/:columnName', verifySession, updateDataRecord);
router.post('/createdatarecord', verifySession, createDataRecord);
router.delete('/deleteDataRecord/:dataId', verifySession, deleteDataRecord);
router.patch("/table/:tableId/columns", verifySession, addTableColumn);

// ==================== FILE/DOWNLOAD ROUTES ====================
router.get('/download/:tableId', verifySession, downloadTable);

export default router;