/**
 * Authentication Controller
 * Handles user authentication, session management, and authorization
 */

import axios from 'axios';
import crypto from 'crypto';
import {
  setSession,
  deleteSession,
  getSession,
  hasSession
} from './sessionStore.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config();

const java = process.env.JAVA_IP

/**
 * Generates a cryptographically secure random session ID
 * @returns {string} 64-character hexadecimal session ID
 */
const generateSessionId = () => crypto.randomBytes(32).toString('hex');

/**
 * User Login Handler
 * Authenticates user credentials and creates a new session
 * Stores session data in memory and sets session cookie
 */


export const loginUser = async (req, res) => {
  const { username, password: encodedPassword } = req.body;

  // Validate input
  if (!username || !encodedPassword) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Decode base64 password safely
  let password;
  try {
    password = Buffer.from(encodedPassword, 'base64').toString('utf8');
    if (!password) throw new Error('Decoded password is empty');
  } catch (e) {
    console.error('Password decoding error:', e.message);
    return res.status(400).json({ message: 'Invalid password encoding' });
  }

  try {
    // Step 1: Authenticate with Java backend
    const response = await axios.post(`${java}/api/auth/login`, {
      username,
      password,
    });

    const { token, displayName } = response.data || {};
    if (!token) {
      throw new Error('No token received from authentication server');
    }

    // Step 2: Fetch allowed projects (non-blocking)
    let allowedProjects = [];
    try {
      const projectRes = await axios.get(`${java}/api/assigned-projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      allowedProjects = Array.isArray(projectRes.data)
        ? projectRes.data.map(p => String(p.project_id))
        : [];
    } catch (err) {
      console.warn('⚠️ Could not fetch allowed projects:', err.message);
    }

    // Step 3: Create a session
    const sessionId = generateSessionId();
    try {
      setSession(sessionId, {
        httpOnly: true,
        token,
        displayName,
        username,
        allowedProjects,
        expires: Date.now() + 24 * 60 * 60 * 1000,
      });
    } catch (sessionError) {
      console.error('Session storage error:', sessionError.message);
      return res.status(500).json({ message: 'Failed to create user session' });
    }

    // Step 4: Manage cookies
    try {
      res.clearCookie('sessionId', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
      });

      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });


    } catch (cookieError) {
      console.error('Cookie handling error:', cookieError.message);
      return res.status(500).json({ message: 'Failed to set session cookie' });
    }

    // Step 5: Success
    return res.status(200).json({ displayName, allowedProjects });
  } catch (error) {
    // Handle various error scenarios from the Java backend or network
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message ||
        (status === 401 ? 'Invalid username or password' : 'Authentication failed');
      console.error(`Auth API error [${status}]:`, message);
      return res.status(status).json({ message });
    } else if (error.request) {
      console.error('No response from authentication server:', error.message);
      return res.status(503).json({ message: 'Authentication service unavailable' });
    } else {
      console.error('Unexpected login error:', error.message);
      return res.status(500).json({ message: 'Internal server error during login' });
    }
  }
};





export const logoutUser = (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    deleteSession(sessionId);
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
    });
  }
  res.status(200).json({ message: 'Logged out successfully' });
};

// export const checkAuth = async (req, res) => {
//   const sessionId = req.cookies.sessionId;

//   if (!sessionId || !hasSession(sessionId)) {
//     return res.status(401).json({ isAuthenticated: false });
//   }

//   const session = getSession(sessionId);
//   if (session.expires < Date.now()) {
//     deleteSession(sessionId);
//     return res.status(401).json({ isAuthenticated: false });
//   }

//   const role = session.displayName === "Admin" ? "admin" : "user";

//   try {
//     const response = await axios.get(`${config.JavaIP}/api/assigned-projects`, {
//       headers: {
//         Authorization: `Bearer ${session.token}`
//       }
//     });

//     const projectIds = response.data.map(project => project.project_id);

//     res.status(200).json({ 
//       isAuthenticated: true, 
//       role, 
//       displayName: session.displayName,
//       allowedProjects: projectIds
//     });
//   } catch (error) {
//     console.error('Error fetching assigned projects:', error.message);
//     // Still send auth success, but with empty projects if fetch fails
//     res.status(200).json({ 
//       isAuthenticated: true, 
//       role, 
//       displayName: session.displayName,
//       allowedProjects: []
//     });
//   }
// };



export const checkAuth = async (req, res) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId || !hasSession(sessionId)) {
    return res.status(401).json({ isAuthenticated: false });
  }

  const session = getSession(sessionId);
  if (session.expires < Date.now()) {
    deleteSession(sessionId);
    return res.status(401).json({ isAuthenticated: false });
  }

  let role = null;

  try {
    const decodedToken = jwt.decode(session.token);
    role = decodedToken?.roles ?? null;
  } catch (err) {
    console.error('Error decoding token:', err.message);
  }

  try {
    const response = await axios.get(`${java}/api/assigned-projects`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });

    const projectIds = response.data.map(project => project.project_id);

    res.status(200).json({
      isAuthenticated: true,
      role, // ⬅️ just numeric role
      displayName: session.displayName,
      allowedProjects: projectIds
    });
  } catch (error) {
    console.error('Error fetching assigned projects:', error.message);
    res.status(200).json({
      isAuthenticated: true,
      role,
      displayName: session.displayName,
      allowedProjects: []
    });
  }
};