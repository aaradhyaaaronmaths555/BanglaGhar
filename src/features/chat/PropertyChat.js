import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Alert,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Ably from 'ably';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Singleton Ably client
let ablyInstance = null;

const getAblyClient = () => {
  if (!ablyInstance) {
    ablyInstance = new Ably.Realtime({
      key: process.env.REACT_APP_ABLY_API_KEY || 'eCpzJg.2DpgHQ:eZs-ze4b9JGwaEUpEQdUNRSd5hwdjXrstIaStIqu8_o',
      clientId: Math.random().toString(36).substring(7),
    });
    ablyInstance.connection.on('closed', () => {
      console.log('Ably connection closed');
    });
    ablyInstance.connection.on('failed', (err) => {
      console.error('Ably connection failed:', err);
    });
    ablyInstance.connection.on('connecting', () => console.log('Ably connecting'));
    ablyInstance.connection.on('connected', () => console.log('Ably connected'));
    ablyInstance.connection.on('error', (err) => console.error('Ably connection error:', err));
  }
  return ablyInstance;
};

const PropertyChat = memo(({ chatPartner, onClose, open }) => {
  const { idToken, user, checkAuthState } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const isAttachingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);
  const userId = user?.sub || 'user-unknown';
  const username = user?.name || 'Guest';
  const userEmail = user?.email || 'unknown@email.com';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize Ably client
  useEffect(() => {
    const ably = getAblyClient();
    const handleBeforeUnload = () => {
      if (process.env.NODE_ENV === 'production' && ably.connection.state !== 'closed') {
        ably.close();
        ablyInstance = null;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle channel subscription
  useEffect(() => {
    if (!open || !chatPartner?.userId || !userId) {
      if (!open) console.log('Chat drawer closed');
      if (!chatPartner?.userId || !userId) {
        console.warn('Invalid data:', { chatPartner, userId });
        if (isMountedRef.current) {
          setError('Invalid chat partner or user data. Please try again.');
          setIsLoading(false);
        }
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    const ably = getAblyClient();

    const sortedIds = [userId, chatPartner.userId].sort();
    const channelName = `chat-${sortedIds[0]}-${sortedIds[1]}`;
    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    const handleChannelError = (stateChange) => {
      console.error('Channel error:', stateChange.reason);
      if (isMountedRef.current) {
        setError('Failed to connect to chat. Please try again.');
        setIsLoading(false);
      }
    };

    channel.on('failed', handleChannelError);
    channel.on('suspended', handleChannelError);
    channel.on('attached', () => {
      console.log(`Channel ${channelName} attached`);
      isAttachingRef.current = false;
    });
    channel.on('detached', () => {
      console.log(`Channel ${channelName} detached`);
      isAttachingRef.current = false;
    });

    const fetchMessages = async () => {
      try {
        const messagesPage = await channel.history({ limit: 50 });
        if (isMountedRef.current) {
          setMessages(messagesPage.items.reverse());
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        if (isMountedRef.current) {
          setError('Failed to load messages. Please try again.');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Attach channel with timeout
    const attachChannel = async (retryCount = 0) => {
      if (retryCount > 3) {
        if (isMountedRef.current) {
          setError('Failed to connect to chat after multiple attempts. Please check your network or try again later.');
          setIsLoading(false);
        }
        return;
      }

      if (isAttachingRef.current) {
        console.log('Attach in progress, skipping...');
        return;
      }

      isAttachingRef.current = true;
      try {
        console.log(`Attempting to attach channel ${channelName}, retry ${retryCount + 1}`);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Channel attach timed out'));
          }, 10000); // Increased to 10 seconds
          channel.attach((err) => {
            clearTimeout(timeout);
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`Channel ${channelName} attached successfully`);
        fetchMessages();
        const handleNewMessage = (msg) => {
          if (isMountedRef.current) {
            setMessages((prev) => [...prev, msg]);
          }
        };
        channel.subscribe('message', handleNewMessage);
        channelRef.current.handleNewMessage = handleNewMessage;
      } catch (err) {
        console.error('Channel attach error:', err);
        if (isMountedRef.current) {
          setTimeout(() => attachChannel(retryCount + 1), 1000);
        }
      } finally {
        isAttachingRef.current = false;
      }
    };

    attachChannel();

    return () => {
      if (channelRef.current) {
        if (channelRef.current.handleNewMessage) {
          channelRef.current.unsubscribe('message', channelRef.current.handleNewMessage);
        }
        channel.off('failed', handleChannelError);
        channel.off('suspended', handleChannelError);
        if (channel.state === 'attached' && !isAttachingRef.current) {
          channel.detach((err) => {
            if (err) console.error('Error detaching channel:', err);
          });
        }
        channelRef.current = null;
      }
    };
  }, [chatPartner?.userId, userId, open]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !channelRef.current) {
      if (isMountedRef.current) {
        setError('Please enter a message or ensure chat is connected.');
      }
      return;
    }

    try {
      const messageData = {
        sender: username,
        senderId: userId,
        senderEmail: userEmail,
        receiverId: chatPartner.userId,
        receiverEmail: chatPartner.email || 'unknown@email.com',
        text: message.trim(),
        timestamp: new Date().toISOString(),
      };

      await channelRef.current.publish('message', messageData);

      let token = idToken;
      const chatData = {
        partnerEmail: chatPartner.email,
        content: message.trim(),
      };

      try {
        await axios.post('http://localhost:5001/api/chats/messages', chatData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        if (error.response?.data?.error.includes('Invalid or expired token')) {
          await checkAuthState();
          token = idToken;
          await axios.post('http://localhost:5001/api/chats/messages', chatData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          throw error;
        }
      }

      if (isMountedRef.current) {
        setMessage('');
        setError(null);
      }
    } catch (error) {
      console.error('Error sending message or saving chat:', error);
      if (isMountedRef.current) {
        setError('Failed to send message. Please try again.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-labelledby="chat-title"
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, zIndex: 1301 } }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={chatPartner?.picture || undefined}
              alt={chatPartner?.name}
              sx={{ width: 32, height: 32 }}
            >
              {chatPartner?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography id="chat-title" variant="h6">
              Chat with {chatPartner?.name || 'User'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close chat">
            <CloseIcon />
          </IconButton>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            mb: 2,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            p: 2,
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No chats yet. Start a conversation!
            </Typography>
          ) : (
            messages.map((msg, index) => (
              <Box
                key={`${msg.id || index}-${index}`}
                sx={{
                  mb: 2,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: msg.data.senderId === userId ? '#e3f2fd' : '#fff',
                  maxWidth: '80%',
                  ml: msg.data.senderId === userId ? 'auto' : 0,
                  boxShadow: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={msg.data.senderId === userId ? user?.picture : chatPartner?.picture}
                    alt={msg.data.sender}
                    sx={{ width: 24, height: 24 }}
                  >
                    {msg.data.sender?.charAt(0) || 'U'}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {msg.data.sender} •{' '}
                    {msg.data.timestamp
                      ? format(new Date(msg.data.timestamp), 'MMM d, HH:mm')
                      : 'Unknown time'}
                  </Typography>
                </Box>
                <Typography variant="body2">{msg.data.text}</Typography>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            multiline
            maxRows={4}
            aria-label="Message input"
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!message.trim() || isLoading}
            aria-label="Send message"
          >
            Send
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
});

export default PropertyChat;