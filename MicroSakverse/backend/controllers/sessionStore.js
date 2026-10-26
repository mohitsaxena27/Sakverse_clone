/**
 * Session Store Management
 * Handles in-memory session storage and user session tracking
 * Provides methods for session CRUD operations
 */

/**
 * In-memory storage for active sessions
 * Key: sessionId
 * Value: session data object
 */
const sessions = new Map();

/**
 * Tracks which session belongs to which user
 * Key: username
 * Value: sessionId
 * Used to prevent multiple active sessions per user
 */
const userToSession = new Map();

/**
 * Retrieves a session by its ID
 * 
 */
export const getSession = (id) => sessions.get(id);

export const setSession = (id, data) => {
    // Delete any existing session for this user
    const { username } = data;
    if (username) {
        const existingSessionId = userToSession.get(username);
        if (existingSessionId && existingSessionId !== id) {
            sessions.delete(existingSessionId);
        }
        userToSession.set(username, id);
    }
    sessions.set(id, data);
};

export const deleteSession = (id) => {
    const session = sessions.get(id);
    if (session && session.username) {
        userToSession.delete(session.username);
    }
    sessions.delete(id);
};

export const hasSession = (id) => sessions.has(id);

// Clean up expired sessions
export const cleanupExpiredSessions = () => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (session.expires && session.expires < now) {
            deleteSession(id);
        }
    }
};

// Setup periodic cleanup
setInterval(cleanupExpiredSessions, 1000 * 60 * 15); // Run every 15 minutes
