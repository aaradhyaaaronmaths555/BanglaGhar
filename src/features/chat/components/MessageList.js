import React from 'react';
import { List, ListItem, ListItemText, CircularProgress, Typography } from '@mui/material';

const MessageList = ({ messages, loading }) => {
  if (loading) {
    return <CircularProgress />;
  }
  if (messages.length === 0) {
    return <Typography variant="body2">No messages yet.</Typography>;
  }
  return (
    <List>
      {messages.map((msg) => (
        <ListItem key={msg.id || msg._id}>
          <ListItemText primary={msg.senderName || msg.sender} secondary={msg.text} />
        </ListItem>
      ))}
    </List>
  );
};

export default MessageList;