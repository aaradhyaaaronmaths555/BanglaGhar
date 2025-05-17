import React, { useState, useCallback, useEffect } from 'react';
import { Chat } from '@mui/icons-material';
import { Fab, Box } from '@mui/material';
import UserPropertiesModal from './UserPropertiesModal';
import PropertyChat from './PropertyChat';
import { useLocation, useNavigate } from 'react-router-dom';

const ChatManager = () => {
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatPartner, setSelectedChatPartner] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleOpenChatModal = useCallback(() => {
    setChatModalOpen(true);
    if (location.pathname !== '/my-chats') {
      navigate('/my-chats', { replace: true });
    }
  }, [navigate, location.pathname]);

  const handleCloseChatModal = useCallback(() => {
    setChatModalOpen(false);
    if (location.pathname === '/my-chats') {
      navigate(-1);
    }
  }, [navigate, location.pathname]);

  const handleSelectChat = useCallback((partner) => {
    if (partner?.userId) {
      setSelectedChatPartner(partner);
      setChatModalOpen(false);
    } else {
      console.warn('Invalid chat partner selected:', partner);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/my-chats' && !chatModalOpen && !selectedChatPartner) {
      setChatModalOpen(true);
    }
  }, [location.pathname, chatModalOpen, selectedChatPartner]);

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1300 }}>
        <Fab color="primary" onClick={handleOpenChatModal} aria-label="My Chats">
          <Chat />
        </Fab>
      </Box>
      <UserPropertiesModal
        open={chatModalOpen}
        onClose={handleCloseChatModal}
        onSelectChat={handleSelectChat}
      />
      {selectedChatPartner && (
        <PropertyChat
          chatPartner={selectedChatPartner}
          onClose={() => setSelectedChatPartner(null)}
          open={!!selectedChatPartner}
        />
      )}
    </>
  );
};

export default ChatManager;