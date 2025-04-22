import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function useChat(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chats/${chatId}/messages`);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  useEffect(() => {
    if (!chatId) return;

    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
    pollingRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollingRef.current);
  }, [chatId]);

  const sendMessage = async (text) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chats/${chatId}/messages`, { text });
      setMessages((prev) => [...prev, response.data]);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return { messages, loading, sendMessage };
}
