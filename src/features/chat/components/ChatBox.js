import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import useChat from '../hooks/useChat';

const ChatBox = ({ open, onClose, chatId }) => {
  const { messages, loading, sendMessage } = useChat(chatId);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Chat</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          <MessageList messages={messages} loading={loading} />
        </Box>
        <Divider />
        <Box sx={{ p: 1 }}>
          <ChatInput onSend={sendMessage} />
        </Box>
      </Box>
    </Drawer>
  );
};

export default ChatBox;