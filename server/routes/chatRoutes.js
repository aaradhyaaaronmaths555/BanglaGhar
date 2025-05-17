const express = require('express');
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/ValidationMiddleware');
const axios = require('axios');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';

// POST /api/chats - Create a new chat
router.post(
  '/',
  authMiddleware,
  [
    body('partnerEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid partner email is required.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { partnerEmail } = req.body;
      const currentUserId = req.user.sub;
      console.log(`Creating chat for user ${currentUserId} with partner ${partnerEmail}`);

      // Fetch partner userId
      let partnerId;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/users/by-email/${encodeURIComponent(partnerEmail)}`,
          { headers: { Authorization: `Bearer ${req.headers.authorization}` } }
        );
        partnerId = response.data.userId;
        console.log(`Fetched partner userId: ${partnerId}`);
      } catch (error) {
        console.error('Error fetching partner user:', error.response?.data || error.message);
        return res.status(404).json({ error: `Partner user not found for email: ${partnerEmail}` });
      }

      // Validate participants
      if (currentUserId === partnerId) {
        return res.status(400).json({ error: 'Cannot create chat with yourself' });
      }

      // Check for existing chat
      const existingChat = await Chat.findOne({
        participants: { $all: [currentUserId, partnerId], $size: 2 },
      });
      if (existingChat) {
        console.log(`Existing chat found: ${existingChat._id}`);
        return res.json({
          chatId: existingChat._id,
          partner: {
            userId: partnerId,
            email: partnerEmail,
            name: response.data.name,
            picture: response.data.picture,
          },
        });
      }

      // Create new chat
      const newChat = new Chat({
        participants: [currentUserId, partnerId],
        lastMessage: null,
      });
      await newChat.save();
      console.log(`New chat created: ${newChat._id}`);

      res.status(201).json({
        chatId: newChat._id,
        partner: {
          userId: partnerId,
          email: partnerEmail,
          name: response.data.name,
          picture: response.data.picture,
        },
      });
    } catch (error) {
      console.error('Error creating chat:', error.message, error.stack);
      res.status(500).json({ error: 'Server error creating chat' });
    }
  }
);

// GET /api/chats/me - Get user's chats
router.get(
  '/me',
  authMiddleware,
  async (req, res) => {
    try {
      const currentUserId = req.user.sub;
      console.log(`Fetching chats for user ${currentUserId}`);
      const chats = await Chat.find({ participants: currentUserId })
        .sort({ updatedAt: -1 })
        .lean();

      const enrichedChats = await Promise.all(
        chats.map(async (chat) => {
          const partnerId = chat.participants.find((id) => id !== currentUserId);
          let partner = {
            userId: partnerId,
            name: 'Unknown',
            email: 'unknown@email.com',
            picture: null,
          };
          try {
            const response = await axios.get(
              `${API_BASE_URL}/users/by-id/${partnerId}`,
              { headers: { Authorization: `Bearer ${req.headers.authorization}` } }
            );
            partner = response.data;
          } catch (error) {
            console.error(`Error fetching partner ${partnerId}:`, error.response?.data || error.message);
          }
          return {
            chatId: chat._id,
            partner,
            lastMessage: chat.lastMessage,
            updatedAt: chat.updatedAt,
          };
        })
      );

      res.json(enrichedChats);
    } catch (error) {
      console.error('Error fetching chats:', error.message, error.stack);
      res.status(500).json({ error: 'Server error fetching chats' });
    }
  }
);

// POST /api/chats/messages - Send a message
router.post(
  '/messages',
  authMiddleware,
  [
    body('partnerEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid partner email is required.'),
    body('content').notEmpty().trim().withMessage('Message content is required.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { partnerEmail, content } = req.body;
      const senderId = req.user.sub;

      // Fetch partner userId
      let partnerId;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/users/by-email/${encodeURIComponent(partnerEmail)}`,
          { headers: { Authorization: `Bearer ${req.headers.authorization}` } }
        );
        partnerId = response.data.userId;
      } catch (error) {
        console.error('Error fetching partner user:', error.response?.data || error.message);
        return res.status(404).json({ error: 'Partner user not found' });
      }

      // Find or create chat
      let chat = await Chat.findOne({
        participants: { $all: [senderId, partnerId], $size: 2 },
      });
      if (!chat) {
        chat = new Chat({
          participants: [senderId, partnerId],
          lastMessage: content,
        });
        await chat.save();
      }

      // Save message
      const message = new Message({
        chatId: chat._id,
        senderId,
        content,
      });
      await message.save();

      // Update chat
      chat.lastMessage = content;
      chat.updatedAt = new Date();
      await chat.save();

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error.message, error.stack);
      res.status(500).json({ error: 'Server error sending message' });
    }
  }
);

// GET /api/chats/messages - Get messages for a chat
router.get(
  '/messages',
  authMiddleware,
  [
    query('partnerEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid partner email is required.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { partnerEmail } = req.query;
      const currentUserId = req.user.sub;

      // Fetch partner userId
      let partnerId;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/users/by-email/${encodeURIComponent(partnerEmail)}`,
          { headers: { Authorization: `Bearer ${req.headers.authorization}` } }
        );
        partnerId = response.data.userId;
      } catch (error) {
        console.error('Error fetching partner user:', error.response?.data || error.message);
        return res.status(404).json({ error: 'Partner user not found' });
      }

      // Find chat
      const chat = await Chat.findOne({
        participants: { $all: [currentUserId, partnerId], $size: 2 },
      });
      if (!chat) {
        return res.json([]); // No chat exists yet
      }

      // Fetch messages
      const messages = await Message.find({ chatId: chat._id })
        .sort({ createdAt: 1 })
        .lean();
      res.json(
        messages.map((msg) => ({
          senderId: msg.senderId === currentUserId ? 'me' : msg.senderId,
          content: msg.content,
          createdAt: msg.createdAt,
        }))
      );
    } catch (error) {
      console.error('Error fetching messages:', error.message, error.stack);
      res.status(500).json({ error: 'Server error fetching messages' });
    }
  }
);

// PUT /api/chats/update - Update chat lastMessage
router.put(
  '/update',
  authMiddleware,
  [
    body('partnerEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid partner email is required.'),
    body('lastMessage').notEmpty().trim().withMessage('Last message is required.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { partnerEmail, lastMessage } = req.body;
      const currentUserId = req.user.sub;

      // Fetch partner userId
      let partnerId;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/users/by-email/${encodeURIComponent(partnerEmail)}`,
          { headers: { Authorization: `Bearer ${req.headers.authorization}` } }
        );
        partnerId = response.data.userId;
      } catch (error) {
        console.error('Error fetching partner user:', error.response?.data || error.message);
        return res.status(404).json({ error: 'Partner user not found' });
      }

      // Find chat
      const chat = await Chat.findOne({
        participants: { $all: [currentUserId, partnerId], $size: 2 },
      });
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Update chat
      chat.lastMessage = lastMessage;
      chat.updatedAt = new Date();
      await chat.save();

      res.json({ message: 'Chat updated' });
    } catch (error) {
      console.error('Error updating chat:', error.message, error.stack);
      res.status(500).json({ error: 'Server error updating chat' });
    }
  }
);

module.exports = router;