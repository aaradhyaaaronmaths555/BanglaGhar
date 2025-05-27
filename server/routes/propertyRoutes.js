// server/routes/propertyRoutes.js
const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const authMiddleware = require("../middleware/authMiddleware");
const fetchUserProfileMiddleware = require("../middleware/fetchUserProfileMiddleware");
const checkListingApprovalMiddleware = require("../middleware/checkListingApprovalMiddleware.js"); // You fixed this import
const {
  handleValidationErrors,
} = require("../middleware/ValidationMiddleware");
const { body, param, query } = require("express-validator");
const multer = require("multer"); // Make sure multer is required

// >> ENSURE THIS MULTER CONFIGURATION IS PRESENT AND CORRECT <<
// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  // This line defines 'upload'
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image file."), false);
    }
  },
});

// POST /api/properties - Create Property
router.post(
  "/",
  authMiddleware, // First, authenticate
  fetchUserProfileMiddleware, // THEN, fetch the user profile <<<< ADD THIS MIDDLEWARE
  [
    // --- Basic Info ---
    body("title").notEmpty().trim().escape().withMessage("Title is required."), //
    body("price").isNumeric().withMessage("Price must be a number.").toFloat(), //

    // --- Location (Based on property.js) ---
    body("addressLine1") //
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Address Line 1 is required."),
    body("addressLine2").optional().trim().escape(), //
    body("cityTown") //
      .notEmpty()
      .trim()
      .escape()
      .withMessage("City/Town is required."),
    body("upazila") //
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Upazila is required."),
    body("district") //
      .notEmpty()
      .trim()
      .escape()
      .withMessage("District is required."),
    body("postalCode") //
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Postal Code is required."),

    // --- Property & Listing Type ---
    body("propertyType") //
      .isIn(["apartment", "house", "condo", "land", "commercial"])
      .withMessage("Invalid property type."),
    body("listingType") //
      .isIn(["rent", "buy", "sold"])
      .withMessage("Invalid listing type."),

    body("listingStatus")
      .optional() // It will default to 'available' in the controller if not provided
      .isIn(["available", "rented", "sold", "unavailable"])
      .withMessage("Invalid listing status."),

    // --- Details ---
    body("bedrooms").custom((value, { req }) => {
      const exempt = ["land", "commercial"];
      if (exempt.includes(req.body.propertyType)) return true;

      if (value === undefined || value === null || value === "") {
        throw new Error("Bedrooms are required for this property type.");
      }

      const parsed = parseInt(value, 10);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error("Bedrooms must be a non-negative integer.");
      }
      return true;
    }),

    body("bathrooms").custom((value, { req }) => {
      const exempt = ["land", "commercial"];
      if (exempt.includes(req.body.propertyType)) return true;

      if (value === undefined || value === null || value === "") {
        throw new Error("Bathrooms are required for this property type.");
      }

      const parsed = parseInt(value, 10);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error("Bathrooms must be a non-negative integer.");
      }
      return true;
    }),

    body("area") //
      .optional()
      .isNumeric()
      .withMessage("Area must be a number.")
      .toFloat(),

    // --- Features --- (Validate boolean fields)
    body("features.parking") //
      .optional()
      .isBoolean()
      .withMessage("Parking must be true or false."),
    body("features.garden") //
      .optional()
      .isBoolean()
      .withMessage("Garden must be true or false."),
    body("features.airConditioning") //
      .optional()
      .isBoolean()
      .withMessage("Air Conditioning must be true or false."),
    body("features.furnished") //
      .optional()
      .isIn(["no", "semi", "full"])
      .withMessage("Invalid furnished status."),
    body("features.pool") //
      .optional()
      .isBoolean()
      .withMessage("Pool must be true or false."),

    // --- Bangladesh Specific Details (Example subset) ---
    body("bangladeshDetails.backupPower")
      .optional() // Make it optional if 'none' is a valid non-choice or if it can be omitted
      .isIn(["ips", "generator", "solar", "none"]) // Enum from property.js
      .withMessage("Invalid backup power option."),
    body("bangladeshDetails.sewerSystem")
      .optional()
      .isIn(["covered", "open", "septic_tank", "none"]) // Enum from property.js
      .withMessage("Invalid sewer system option."),
    body("bangladeshDetails.parkingType")
      .optional()
      .isIn(["dedicated", "street", "garage", "none"]) // Enum from property.js
      .withMessage("Invalid parking type option."),

    // Also, ensure other enum fields from bangladeshDetails are validated if they are mandatory
    // or have specific enum constraints you want to check early.
    // For example, propertyCondition is required in your Step_Bangladesh_Details.js
    body("bangladeshDetails.propertyCondition")
      .notEmpty()
      .withMessage("Property condition is required.") // If it's truly required
      .isIn(["new", "under_construction", "resale"]) // Enum from property.js
      .withMessage("Invalid property condition."),
    body("bangladeshDetails.waterSource")
      .notEmpty()
      .withMessage("Water source is required.") // If it's truly required
      .isIn(["wasa", "deep_tube_well", "both", "other"]) // Enum from property.js
      .withMessage("Invalid water source."),
    body("bangladeshDetails.gasSource")
      .notEmpty()
      .withMessage("Gas source is required.") // If it's truly required
      .isIn(["piped", "cylinder", "none"]) // Enum from property.js
      .withMessage("Invalid gas source."),
    body("bangladeshDetails.gasLineInstalled")
      .optional() // Assuming 'no' is a valid default and can be overridden
      .isIn(["yes", "no", "na"]) // Enum from property.js
      .withMessage("Invalid gas line installation status."),
    body("bangladeshDetails.floodProne")
      .optional() // Assuming 'no' is a valid default
      .isIn(["yes", "no", "sometimes"]) // Enum from property.js
      .withMessage("Invalid flood prone status."),
    body("bangladeshDetails.securityFeatures.*") // For array elements
      .optional()
      .isIn(["gated", "guards", "cctv"]) // Enum from property.js
      .withMessage("Invalid security feature selected."),
    body("bangladeshDetails.earthquakeResistance")
      .optional() // Assuming 'unknown' is a valid default
      .isIn(["yes", "no", "unknown"]) // Enum from property.js
      .withMessage("Invalid earthquake resistance status."),
    body("bangladeshDetails.balcony")
      .optional() // Assuming 'no' is a valid default
      .isIn(["yes", "no"]) // Enum from property.js
      .withMessage("Invalid balcony status."),
    body("bangladeshDetails.rooftopAccess")
      .optional() // Assuming 'no' is a valid default
      .isIn(["yes", "no"]) // Enum from property.js
      .withMessage("Invalid rooftop access status."),
    body("bangladeshDetails.ownershipPapers")
      .optional() // Assuming 'unknown' is a valid default
      .isIn(["clear", "pending", "issue", "unknown"]) // Enum from property.js
      .withMessage("Invalid ownership papers status."),
    body("bangladeshDetails.propertyTenure")
      .optional()
      .isIn(["freehold", "leasehold", ""]) // Allow empty string if it's truly optional and not selected
      .withMessage("Invalid property tenure."),
  ],
  handleValidationErrors, //
  propertyController.createProperty //
);

// GET /api/properties - Get All Properties (remains the same)
router.get(
  "/",
  [
    query("random") //
      .optional()
      .isBoolean()
      .withMessage("Random must be true or false."),
    query("featured") //
      .optional()
      .isBoolean()
      .withMessage("Featured must be true or false."),
    query("limit") //
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be a positive integer."),
    query("listingType") //
      .optional()
      .isIn(["rent", "buy", "sold"])
      .withMessage("Invalid listing type filter."),
    query("listingStatus") // For explicitly querying by status
      .optional()
      .isIn(["available", "rented", "sold", "unavailable"])
      .withMessage("Invalid listing status filter."),
    query("includeUnavailable") // To fetch all statuses
      .optional()
      .isBoolean()
      .withMessage("includeUnavailable must be true or false.")
      .toBoolean(),
  ],
  handleValidationErrors, //
  propertyController.getAllProperties //
);

// GET /api/properties/:id - Get Property by ID (remains the same)
router.get(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid property ID format."), //
  ],
  handleValidationErrors, //
  propertyController.getPropertyById //
);

// PUT /api/properties/:id - Update Property
// Add fetchUserProfileMiddleware here as well if updateProperty needs req.userProfile
// and to ensure user can only update their own properties (logic for that check would be in controller)
router.put(
  "/:id",
  authMiddleware, //
  fetchUserProfileMiddleware, // <<<< ADD THIS if updates depend on user profile or for ownership checks
  [
    param("id").isMongoId().withMessage("Invalid property ID format."), //
    body("title") //
      .optional()
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Title cannot be empty if provided."),
    body("price") //
      .optional()
      .isNumeric()
      .withMessage("Price must be a number.")
      .toFloat(),
    body("addressLine1") //
      .optional()
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Address Line 1 cannot be empty if provided."),
    body("cityTown") //
      .optional()
      .notEmpty()
      .trim()
      .escape()
      .withMessage("City/Town cannot be empty if provided."),
    body("isHidden") //
      .optional()
      .isBoolean()
      .withMessage("isHidden must be true or false."),

    body("listingStatus")
      .optional()
      .isIn(["available", "rented", "sold", "unavailable"])
      .withMessage("Invalid listing status provided for update."),
  ],
  handleValidationErrors, //
  propertyController.updateProperty //
);

// DELETE /api/properties/:id - Delete Property
// Add fetchUserProfileMiddleware here as well if deleteProperty needs req.userProfile
// and to ensure user can only delete their own properties (logic for that check would be in controller)
router.post(
  "/upload-image", // This path must match what the frontend is calling
  authMiddleware,
  fetchUserProfileMiddleware,
  checkListingApprovalMiddleware,
  upload.single("propertyImage"), // 'propertyImage' is the field name from FormData
  propertyController.uploadPropertyImageToS3 // Ensure this controller function exists
);

router.delete(
  "/:id",
  authMiddleware, //
  fetchUserProfileMiddleware, // <<<< ADD THIS if deletes depend on user profile or for ownership checks
  [
    param("id").isMongoId().withMessage("Invalid property ID format."), //
  ],
  handleValidationErrors, //
  propertyController.deleteProperty //
);

module.exports = router;
