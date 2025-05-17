const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], 
  lastMessage: { type: String },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);