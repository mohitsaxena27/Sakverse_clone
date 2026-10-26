/**
 * Business Controller
 * Handles all business analysis related operations including:
 * - Idea management
 * - User story publishing
 * - Business analysis resource management
 * - File uploads and processing
 */

import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';
import { generateExcel, generateWord } from '../helper/BA/baHelper.js';

dotenv.config();
const baseIP = process.env.BASE_IP;

/**
 * Multer configuration for file uploads
 * Temporarily stores files in the uploads directory
 */
const upload = multer({ dest: 'uploads/' }).array('files');

export const GetIdea = async (req, res) => {
  const session = req.session;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Missing ID parameter' });
  }

  try {
    const response = await axios.get(`${baseIP}/get-idea/${id}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch idea:', error.message);
    res.status(500).json({ message: 'Error fetching idea' });
  }
};

export const PublishUserStory = async (req, res) => {
  const session = req.session;
  const { userstory_ref_id, project_id } = req.body;

  if (!userstory_ref_id) {
    return res.status(400).json({ message: 'Missing userstory_ref_id' });
  }

  try {
    const response = await axios.post(
      `${baseIP}/publish_user_story`,
      { userstory_ref_id, project_id },
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to process request:', error.message);
    res.status(500).json({ message: 'Error processing the request' });
  }
};

export const UploadBAResource = (req, res) => {
  const session = req.session;

  upload(req, res, async function (err) {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(500).json({ message: 'File upload error', error: err.message });
    }

    const { text, pr_id } = req.body;
    const files = req.files;

    if (!text && (!files || files.length === 0)) {
      return res.status(400).json({ message: 'Text or at least one file is required' });
    }

    try {
      const form = new FormData();
      if (text) form.append('text', text);
      if (pr_id) form.append('pr_id', pr_id);

      files.forEach((file) => {
        form.append('files', fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype
        });
      });

      const response = await axios.post(`${baseIP}/ba_resource/`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${session.token}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Cleanup uploaded files
      files.forEach(file => fs.unlinkSync(file.path));

      res.json({
        message: 'BA resource uploaded successfully',
        request_id: response.data.request_id
      });
    } catch (error) {
      console.error('Failed to upload BA resource:', error.message);
      // Cleanup on error
      if (files) {
        files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
      }
      res.status(500).json({ message: 'Error uploading BA resource' });
    }
  });
};

export const getProcessedIdea = async (req, res) => {
  const session = req.session;
  const { pr_id } = req.params;

  if (!pr_id) {
    return res.status(400).json({ message: 'pr_id is required' });
  }

  try {
    const response = await axios.get(
      `${baseIP}/get_processed_idea/${pr_id}`,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    return res.status(200).json({
      message: 'Processed idea fetched successfully',
      data: response.data,
    });

  } catch (error) {
    console.error('Error fetching processed idea:', error.message);

    return res.status(error.response?.status || 500).json({
      message: 'Failed to fetch processed idea',
      error: error.response?.data || error.message,
    });
  }
};

/**
 * Download feature analysis as Excel file
 * GET /downloadFeature/:id
 */
export const downloadFeature = async (req, res) => {
  try {
    const data = req.body;
    const workbook = await generateExcel(data);
    
    const filename = `marketplace_features_${Date.now()}.xlsx`;
    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',
      `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('[downloadFeature]', err);
    res.status(500).json({ error: 'Failed to generate Excel file.' });
  }
};

/**
 * Download feature analysis as Word document
 * GET /downloadFeatureDoc/:id
 */
export const downloadFeatureDoc = async (req, res) => {
  try {
    const data = req.body;
    const buffer = await generateWord(data);
    
    const filename = `marketplace_features_${Date.now()}.docx`;
    res.setHeader('Content-Type', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

  } catch (err) {
    console.error('[downloadFeatureDoc]', err);
    res.status(500).json({ error: 'Failed to generate Word document.' });
  }
};