import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';

dotenv.config();

const javaIP = process.env.JAVA_IP;
const upload = multer({ dest: 'uploads/' }).array('files');

export const projectOnboarding = (req, res) => {
  const session = req.session;

  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(500).json({ message: 'File upload error', error: err.message });
    }

    const { data } = req.body; // This should already contain your full JSON
    const files = req.files;

    if (!data && (!files || files.length === 0)) {
      return res.status(400).json({ message: 'Text or at least one file is required' });
    }

    try {
      const form = new FormData();

      // Append JSON data exactly as-is, with content type application/json
      if (data) {
        let jsonData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Appending JSON data:', JSON.stringify(jsonData, null, 2));
        form.append('data', JSON.stringify(jsonData), { contentType: 'application/json' });
      }

      // Append files if any
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log('Appending file:', file.originalname);
          form.append('files', fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype,
          });
        });
      }

      // Send request to Java backend
      const response = await axios.post(`${javaIP}/api/admin/projectOnboarding`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${session.token}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Cleanup uploaded files
      if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));

      res.json({
        message: 'Project onboarded successfully',
        request_id: response.data.request_id,
      });

    } catch (error) {
      console.error('Failed to onboard project:', error.response?.data || error.message);

      if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));

      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Error onboarding project',
      });
    }
  });
};




export const GetProjectList = async (req, res) => {
  const session = req.session;

  try {
    const response = await axios.get(`https://bc685c8a-9ca5-48f3-a5f8-d9a6e1594dcb.mock.pstmn.io/project`, {
   
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch projects:', error.message);
    res.status(500).json({ message: 'Error fetching assigned projects' });
  }
};
export const GetUserList = async (req, res) => {
  const session = req.session;

  try {
    const response = await axios.get(`https://bc685c8a-9ca5-48f3-a5f8-d9a6e1594dcb.mock.pstmn.io/user`, {
   
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch projects:', error.message);
    res.status(500).json({ message: 'Error fetching assigned projects' });
  }
};





