import React, { useState, useEffect, useRef, memo } from 'react';
import { Drawer, Box, Typography, TextField, Button } from '@mui/material';
import Ably from 'ably';

const ably = new Ably.Realtime({ key: 'eCpzJg.2DpgHQ:eZs-ze4b9JGwaEUpEQdUNRSd5hwdjXrstIaStIqu8_o' });

const PropertyChat = memo(({ property, onClose }) => {
  console.log('Rendering PropertyChat for property:', property); // Debug log

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const channelRef = useRef(null); // Use ref to store the channel instance
  const chatRef = useRef(null);

  useEffect(() => {
    if (!property) return;

    const channel = ably.channels.get(`property-${property._id}`);
    channelRef.current = channel; // Store the channel instance in ref

    const fetchMessages = async () => {
      try {
        const messagesPage = await channel.history({ limit: 50 });
        setMessages(messagesPage.items.reverse());
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchMessages();

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    channel.subscribe(handleNewMessage);

    return () => {
      channel.unsubscribe(handleNewMessage);
    };
  }, [property]);

  useEffect(() => {
    if (property) {
      // Set focus to the chat drawer when it opens
      chatRef.current?.focus();
      document.body.setAttribute('inert', '');
    } else {
      // Remove inert attribute when the chat drawer closes
      document.body.removeAttribute('inert');
    }

    return () => {
      document.body.removeAttribute('inert');
    };
  }, [property]);

  const sendMessage = async () => {
    if (!channelRef.current) return;
    await channelRef.current.publish('message', { sender: 'user@example.com', text: message });
    setMessage('');
  };

  return (
    <Drawer
      anchor="right"
      open={!!property}
      onClose={onClose}
      aria-labelledby="property-chat-title"
      aria-describedby="property-chat-messages"
      PaperProps={{
        sx: { zIndex: 1301 }, // Set a higher z-index to ensure the chat drawer appears above the modal
      }}
    >
      <Box
        ref={chatRef}
        tabIndex={-1}
        sx={{ width: 400, p: 2 }}
      >
        <Typography id="property-chat-title" variant="h6" gutterBottom>
          Chat for {property.title}
        </Typography>
        <Box id="property-chat-messages" sx={{ height: 400, overflowY: 'auto', my: 2 }}>
          {messages.map((msg, index) => (
            <Typography key={index} variant="body2">
              <strong>{msg.data.sender}:</strong> {msg.data.text}
            </Typography>
          ))}
        </Box>
        <TextField
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button variant="contained" fullWidth onClick={sendMessage}>
          Send
        </Button>
      </Box>
    </Drawer>
  );
});

export default PropertyChat;