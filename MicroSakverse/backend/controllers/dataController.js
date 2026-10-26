import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const dataIP = process.env.DATAIP ;

// POST /generate-csv - Generate CSV
export const generateCsv = async (req, res) => {
  const session = req.session;

  try {
    const response = await axios.post(
      `${dataIP}/generate-csv`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to generate CSV:', error.message);

    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message ||
        'Error generating CSV',
    });
  }
};