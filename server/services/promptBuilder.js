/**
 * promptBuilder.js
 *
 * Builds the system prompt and user message sent to Gemini on every chat request.
 * Keeping the template isolated here makes it trivial to tune without touching
 * any business logic in chatService.
 */

// ── System prompt ─────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are an HR Copilot AI assistant for StaffSync.

Your ONLY knowledge source is the HR policy context provided below.
Follow these rules strictly:

1. Answer ONLY from the provided HR policy context. Never use external knowledge.
2. If the context does not contain enough information to answer the question, respond with exactly:
   "I couldn't find this information in the HR knowledge base."
3. Do NOT speculate, invent, or make assumptions about HR policies.
4. Keep answers clear and concise — use bullet points where appropriate.
5. Always mention which HR document(s) you used at the end of your answer under a "Sources used:" section.
6. If multiple documents are relevant, cite all of them.
7. Do not include any preamble like "Based on the context provided…" — answer directly.`;

// ── User message builder ──────────────────────────────────────────────────────

/**
 * buildUserMessage
 *
 * Combines the retrieved chunks into a grounded context block, then appends
 * the user's question. This is the full human-turn message sent to Gemini.
 *
 * @param {string}   question  — raw question text from the user
 * @param {Array}    chunks    — array of { text, metadata, score } from vectorService
 * @returns {string}
 */
export const buildUserMessage = (question, chunks) => {
  if (!chunks.length) {
    // This branch is handled before calling Gemini, but kept as a safety net
    return `Question: ${question}`;
  }

  const contextBlocks = chunks
    .map(
      (chunk, i) =>
        `--- Context ${i + 1} ---\n` +
        `Document: ${chunk.metadata.title}\n` +
        `Category: ${chunk.metadata.category}\n` +
        `Chunk #${chunk.metadata.chunkIndex}\n\n` +
        chunk.text
    )
    .join('\n\n');

  return (
    `HR Policy Context:\n\n${contextBlocks}\n\n` +
    `---\n\n` +
    `Employee Question: ${question}`
  );
};

// ── Condense-question prompt (multi-turn memory) ────────────────────────────────

/**
 * CONDENSE_SYSTEM_PROMPT
 *
 * Used before retrieval on every turn that has prior conversation history.
 * Rewrites a follow-up question ("what about part-time employees?") into a
 * standalone one ("What is the parental leave policy for part-time
 * employees?") so vector search embeds something self-contained instead of
 * a fragment that only makes sense next to the previous turn.
 */
export const CONDENSE_SYSTEM_PROMPT = `You rewrite follow-up questions so they can be understood on their own, without needing the earlier conversation.

Rules:
1. If the latest question is already standalone (it doesn't depend on prior context), return it unchanged.
2. Otherwise, rewrite it into a single standalone question that preserves the user's intent, resolving pronouns and implicit references using the conversation history.
3. Never answer the question — only rewrite it.
4. Return ONLY the rewritten question text. No preamble, no quotes, no labels.`;

/**
 * buildCondenseUserMessage
 *
 * @param {Array<{question: string, answer: string}>} history — oldest → newest
 * @param {string} question — the latest, possibly context-dependent question
 * @returns {string}
 */
export const buildCondenseUserMessage = (history, question) => {
  if (!history.length) return question;

  const historyBlock = history
    .map((turn) => `Human: ${turn.question}\nAssistant: ${turn.answer}`)
    .join('\n\n');

  return (
    `Conversation history:\n\n${historyBlock}\n\n` +
    `---\n\n` +
    `Latest question: ${question}\n\n` +
    `Standalone question:`
  );
};
