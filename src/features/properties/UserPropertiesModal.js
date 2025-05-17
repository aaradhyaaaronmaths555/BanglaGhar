import React, { useEffect, useState, useRef } from 'react';
import { Modal, Box, List, ListItem, ListItemText, Typography, Divider, CircularProgress, Button, Avatar } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const UserPropertiesModal = ({ open, onClose, onSelectChat }) => {
  const { idToken, checkAuthState } = useAuth();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const retryCount = useRef(0);
  const hasProcessedInitiateChat = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  // Log component mount and props
  useEffect(() => {
    console.log('UserPropertiesModal mounted with props:', { open, onSelectChat: typeof onSelectChat, onClose: typeof onClose });
    if (open && typeof onSelectChat !== 'function') {
      console.warn('UserPropertiesModal: onSelectChat is not a function, chat selection disabled');
    }
  }, [open, onSelectChat]);

  const fetchChats = async () => {
    if (!idToken) {
      setError('Please log in to view chats.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/chats/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const fetchedChats = response.data || [];
      setChats(fetchedChats);
      retryCount.current = 0;

      const initiateChatWith = location.state?.initiateChatWith;
      console.log('initiateChatWith:', initiateChatWith);
      if (initiateChatWith && !hasProcessedInitiateChat.current) {
        hasProcessedInitiateChat.current = true;
        let partner = { ...initiateChatWith };
        if (!partner.userId && partner.email) {
          try {
            const userResponse = await axios.get(
              `${API_BASE_URL}/users/by-email/${encodeURIComponent(partner.email)}`,
              { headers: { Authorization: `Bearer ${idToken}` } }
            );
            partner = {
              userId: userResponse.data.userId,
              name: userResponse.data.name,
              email: userResponse.data.email,
              picture: userResponse.data.picture,
            };
          } catch (userError) {
            console.error('Error fetching user by email:', userError.response?.data || userError.message);
            setError('Owner not found in the system. Please try another property.');
            return;
          }
        }
        const existingChat = fetchedChats.find(
          (chat) => chat.partner.userId === partner.userId || chat.partner.email === partner.email
        );
        if (existingChat) {
          if (typeof onSelectChat === 'function') {
            onSelectChat(existingChat.partner);
            navigate('/my-chats', { replace: true, state: {} });
          } else {
            console.error('onSelectChat is not a function during existing chat selection');
            setError('Unable to open chat. Please try again.');
          }
        } else {
          try {
            const chatResponse = await axios.post(
              `${API_BASE_URL}/chats`,
              { partnerEmail: partner.email },
              { headers: { Authorization: `Bearer ${idToken}` } }
            );
            const newChat = {
              chatId: chatResponse.data.chatId,
              partner: {
                userId: partner.userId,
                name: partner.name,
                email: partner.email,
                picture: partner.picture,
              },
              lastMessage: null,
            };
            setChats((prev) => [...prev, newChat]);
            if (typeof onSelectChat === 'function') {
              onSelectChat(newChat.partner);
              navigate('/my-chats', { replace: true, state: {} });
            } else {
              console.error('onSelectChat is not a function during new chat creation');
              setError('Unable to open chat. Please try again.');
            }
          } catch (chatError) {
            console.error('Error creating chat:', chatError.response?.data || chatError.message);
            setError(chatError.response?.data?.error || 'Failed to start chat. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load chats.';
      setError(errorMessage);
      setChats([]);
      if (errorMessage.includes('Invalid or expired token') && retryCount.current < 2) {
        try {
          await checkAuthState();
          retryCount.current += 1;
          setTimeout(fetchChats, 1000);
        } catch (refreshError) {
          setError('Failed to refresh authentication token. Please log in again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
      hasProcessedInitiateChat.current = false;
      fetchChats();
    }
  }, [open, idToken]);

  const handleRetry = () => {
    retryCount.current = 0;
    fetchChats();
  };

  const handleChatClick = (partner) => {
    if (typeof onSelectChat === 'function') {
      onSelectChat(partner);
    } else {
      console.error('onSelectChat is not a function when clicking chat');
      setError('Unable to open chat. Please try again.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="chat-list-modal"
      aria-describedby="chat-list"
    >
      <Box
        ref={modalRef}
        tabIndex={-1}
        sx={{
          width: { xs: '90%', sm: 600 },
          maxHeight: '80%',
          bgcolor: 'background.paper',
          p: 2,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          overflowY: 'auto',
          borderRadius: 2,
          boxShadow: 24,
        }}
      >
        <Typography id="chat-list-modal" variant="h6" gutterBottom>
          My Chats
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography color="error">{error}</Typography>
            <Button
              variant="contained"
              onClick={handleRetry}
              sx={{ mt: 2 }}
              aria-label="Retry loading chats"
            >
              Retry
            </Button>
          </Box>
        ) : chats.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No chats yet. Start a conversation!
          </Typography>
        ) : (
          <List id="chat-list">
            {chats.map((chat) => (
              <ListItem
                button
                key={chat.chatId}
                onClick={() => handleChatClick(chat.partner)}
                sx={{ py: 1, alignItems: 'center' }}
                disabled={typeof onSelectChat !== 'function'}
              >
                <Avatar
                  src={chat.partner.picture || undefined}
                  alt={chat.partner.name}
                  sx={{ mr: 2, width: 40, height: 40 }}
                >
                  {chat.partner.name?.charAt(0) || 'U'}
                </Avatar>
                <ListItemText
                  primary={chat.partner.name || 'Unknown User'}
                  secondary={`Last message: ${chat.lastMessage || 'No messages'}`}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Modal>
  );
};

UserPropertiesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectChat: PropTypes.func, // Made optional
};

export default UserPropertiesModal;