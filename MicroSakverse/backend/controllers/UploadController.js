/**
 * Upload Controller
 * Handles all file system operations including:
 * - File uploads
 * - Directory management
 * - File structure retrieval
 * - File/folder creation and deletion
 */

import fs from 'fs';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv'
dotenv.config();

/**
 * Base path for all file operations
 * All files and folders will be created under this directory
 */
const BASE_PATH = process.env.PATH;

// Util: Format timestamp
function formatDate(date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(',', '');
}


// Util: Recursively get folder structure
function getDirectoryStructure(dirPath) {
  const stats = fs.statSync(dirPath);
  if (stats.isFile()) return null;

  const folderName = path.basename(dirPath);
  if (!folderName.endsWith('Documents')) return null;

  const children = fs.readdirSync(dirPath)
    .map(child => {
      const childPath = path.join(dirPath, child);
      const childStats = fs.statSync(childPath);

      if (childStats.isFile()) {
        return {
          type: 'file',
          name: child,
          size: childStats.size,
          lastModified: formatDate(childStats.mtime),
        };
      } else {
        return getDirectoryStructure(childPath);
      }
    })
    .filter(Boolean);

  return {
    type: 'folder',
    name: folderName,
    children,
  };
}

// GET /folder-structure
export function getFolderStructure(req, res) {
  try {
    if (!fs.existsSync(BASE_PATH)) {
      return res.status(404).json({ error: 'Base folder does not exist' });
    }

    const entries = fs.readdirSync(BASE_PATH)
      .map(name => path.join(BASE_PATH, name))
      .map(getDirectoryStructure)
      .filter(Boolean);

    return res.status(200).json(entries);
  } catch (error) {
    console.error('Error reading directory:', error);
    return res.status(500).json({ error: 'Server error reading directory' });
  }
}

// POST /CreateFile/:folderName
export function createFileOrFolder(req, res) {
  const folderName = req.params.folderName;
  const { relativePath, isFolder, content } = req.body;

  const folderPath = path.join(BASE_PATH, folderName);
  const fullPath = path.join(folderPath, relativePath);

  try {
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: 'Target folder does not exist' });
    }

    if (fs.existsSync(fullPath)) {
      return res.status(400).json({ error: 'File or folder already exists' });
    }

    if (isFolder) {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      const parentDir = path.dirname(fullPath);
      fs.mkdirSync(parentDir, { recursive: true });
      fs.writeFileSync(fullPath, content || '', 'utf8');
    }

    return res.status(201).json({ message: 'Created successfully' });
  } catch (err) {
    console.error('Error creating:', err);
    return res.status(500).json({ error: 'Error creating file or folder' });
  }
}

// DELETE /DeleteFile/:folderName
export function deleteFileOrFolder(req, res) {
  const folderName = req.params.folderName;
  const { relativePath } = req.body;

  const folderPath = path.join(BASE_PATH, folderName);
  const fullPath = path.join(folderPath, relativePath);

  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Target file or folder does not exist' });
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }

    return res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting:', err);
    return res.status(500).json({ error: 'Error deleting file or folder' });
  }
}

// Setup multer for multiple file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderName = req.params.folderName;
    const uploadPath = path.join(BASE_PATH, folderName);

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage }).array('files');

// POST /UploadFiles/:folderName
export function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    return res.status(200).json({
      message: 'Files uploaded successfully',
      files: req.files.map(file => ({
        originalName: file.originalname,
        storedPath: file.path,
        size: file.size,
      }))
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
}
