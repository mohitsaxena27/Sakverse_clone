/**
 * Authentication Middleware
 * Provides session validation and authentication checks for protected routes
 */

import { getSession, hasSession, deleteSession } from '../controllers/sessionStore.js';

/**
 * Middleware to verify active user sessions
 * - Checks for valid session ID in cookies
 * - Validates session expiration
 * - Attaches session data to request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void|Response} Continues to next middleware or returns 401 if unauthorized
 */
export const verifySession = (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId || !hasSession(sessionId)) {
    return res.status(401).json('Unauthorized: No session found');
  }

  const session = getSession(sessionId);

  if (session.expires < Date.now()) {
    deleteSession(sessionId);
    return res.status(401).json('Session expired: Please log in again');
  }

  req.session = session;
  next();
};
