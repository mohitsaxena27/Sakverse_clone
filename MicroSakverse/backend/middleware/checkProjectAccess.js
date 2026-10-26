/**
 * Project Access Control Middleware
 * Handles authorization for project-specific routes
 * Ensures users can only access projects they are assigned to
 */

import {
  setSession,
  deleteSession,
  getSession,
  hasSession
} from '../controllers/sessionStore.js';

/**
 * Middleware to verify user's project access permissions
 * - Validates session
 * - Extracts project ID from request
 * - Checks if user is assigned to the requested project
 * - Prevents unauthorized access to project resources
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void|Response} Continues to next middleware or returns 401/403 if unauthorized
 */
export const checkProjectAccess = (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  // Check if sessionId is present and valid
  if (!sessionId || !hasSession(sessionId)) {
    return res.status(401).json({ isAuthenticated: false });
  }

  // Get session data from session store
  const session = getSession(sessionId);

  // Get project ID from route or query
  const projectId = req.params.projectId || req.query.pr_id || req.body.pr_id;


  if (!projectId) {
    return res.status(400).json({ message: "Missing or invalid project ID" });
  }

  if (!session.allowedProjects || !Array.isArray(session.allowedProjects)) {
    return res.status(401).json({ message: "Unauthorized: Session not valid" });
  }

  // Ensure consistent types for comparison
  const allowedProjects = session.allowedProjects.map(String);
  const projectIdStr = String(projectId);

  if (!allowedProjects.includes(projectIdStr)) {
    return res.status(403).json({ message: "Access denied: Not allowed for this project" });
  }

  // Attach session to request (optional but useful)
  req.session = session;

  next();
};

export const checkSession = (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId || !hasSession(sessionId)) {
    return res.status(401).json({ isAuthenticated: false, message: 'Session expired please Login again' });
  }

  const session = getSession(sessionId);
  req.session = session; // Attach session for later use

  next();
};

