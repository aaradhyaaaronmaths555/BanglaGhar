const path = require("path");
const dotenv = require("dotenv");

// Load .env
const envPath = path.resolve(__dirname, "./.env");
dotenv.config({ path: envPath });

// Imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const AWS = require("aws-sdk");

// Models (load before routes to register schemas)
require("./models/Property");
require("./models/Wishlist");
require("./models/UserProfile");
require("./models/Chat");
require("./models/Message");

// Routes
const aiRoutes = require("./routes/aiRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/users");

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-production-url.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Connect to MongoDB
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("❌ Error: No Mongo URI found in ENV! Check your .env file.");
  process.exit(1);
}
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas successfully!");
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB Atlas:", err);
    process.exit(1);
  });

// API Routes
app.use("/api", aiRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/users/:username/wishlist", wishlistRoutes);
app.use("/api/user-profiles", userProfileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err.message, err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Test Route
app.get("/", (req, res) => {
  res.send("Hello from the backend server! MongoDB connection is active.");
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});