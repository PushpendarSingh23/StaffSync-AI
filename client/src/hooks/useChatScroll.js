import { useEffect, useRef } from 'react';

/**
 * Returns a ref that should be attached to the bottom sentinel element
 * inside the chat messages container.
 * Scrolls smoothly into view whenever `messages` changes.
 */
const useChatScroll = (messages) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return bottomRef;
};

export default useChatScroll;
