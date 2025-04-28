// server/routes/propertyRoutes.js

const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");

// Import Middlewares
const authMiddleware = require("../middleware/authMiddleware");
const fetchUserProfileMiddleware = require("../middleware/fetchUserProfileMiddleware");
const checkListingApprovalMiddleware = require("../middleware/checkListingApprovalMiddleware");

// Base path: /api/properties

// Chain middlewares for property creation:
// 1. Check JWT token and get req.user (Cognito info)
// 2. Fetch MongoDB profile based on req.user.email and get req.userProfile
// 3. Check req.userProfile.approvalStatus
router.post(
  "/",
  authMiddleware,
  fetchUserProfileMiddleware,
  checkListingApprovalMiddleware,
  propertyController.createProperty // Ensure ownerInfo is handled in the controller
);

// Public routes
router.get("/", propertyController.getAllProperties);
router.get("/:id", propertyController.getPropertyById);

// Other routes (apply middleware as needed)
router.put("/:id", propertyController.updateProperty);
router.delete("/:id", propertyController.deleteProperty);

module.exports = router;
