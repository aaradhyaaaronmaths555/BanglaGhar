import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import Drawer from "@mui/material/Drawer";
import { io } from "socket.io-client";

const ChatBox = ({ open, onClose, chatId, ownerName }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (open) {
      const newSocket = io("http://localhost:5001");
      setSocket(newSocket);

      newSocket.emit("joinRoom", chatId);

      newSocket.on("receiveMessage", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [open, chatId]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData = {
        room: chatId,
        content: newMessage,
        sender: "user", // Replace with actual user identifier
      };
      socket.emit("sendMessage", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Chat with {ownerName}
        </Typography>
        <Box sx={{ maxHeight: "300px", overflowY: "auto", mb: 2 }}>
          <List>
            {messages.map((msg, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={msg.content}
                  secondary={msg.sender === "user" ? "You" : ownerName}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        <TextField
          fullWidth
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
          <Button onClick={handleSendMessage} variant="contained">
            Send
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ChatBox;