/**
 * conversationMemory.js
 *
 * Multi-turn memory support for the chat pipeline. A "session" is a
 * client-generated sessionId (one per open chat window/tab) — NOT the same
 * as the user's auth session, so a single user can hold several independent
 * memory threads at once (e.g. two browser tabs).
 *
 * Used by chatService to:
 *   - condense a follow-up question into a standalone query before retrieval
 *   - thread prior turns into the LLM call as conversational context
 */

import { Conversation } from '../models/Conversation.js';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';

const CTX = 'conversationMemory';

/**
 * Fetch the most recent turns for a session, oldest → newest.
 *
 * @param {string} sessionId
 * @param {number} [limit=config.memoryTurns]
 * @returns {Promise<Array<{ question: string, answer: string }>>}
 */
export const getRecentTurns = async (sessionId, limit = config.memoryTurns) => {
  if (!sessionId) return [];

  try {
    const turns = await Conversation.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('question answer')
      .lean();

    return turns.reverse(); // oldest → newest, ready to thread into the LLM call
  } catch (err) {
    logger.error(CTX, 'Failed to load conversation memory', { sessionId, error: err.message });
    return [];
  }
};
