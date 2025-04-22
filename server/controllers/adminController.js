// server/controllers/adminController.js
const UserProfile = require("../models/UserProfile");
const Property = require("../models/property");
const mongoose = require("mongoose"); // Required for ObjectId validation
const { subDays } = require("date-fns");

// --- NEW: Get Dashboard Statistics ---
exports.getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = subDays(new Date(), 7); // Calculate date 7 days ago

    // Parallel execution for efficiency
    const [
      totalActiveListings,
      pendingUsersCount,
      totalUsersCount,
      recentListingsCount, // Optional: Listings added in last 7 days
      recentUsersCount, // Optional: Users registered in last 7 days
    ] = await Promise.all([
      Property.countDocuments({ isHidden: { $ne: true } }), // Active listings are not hidden
      UserProfile.countDocuments({ approvalStatus: "pending" }),
      UserProfile.countDocuments({}),
      Property.countDocuments({ createdAt: { $gte: sevenDaysAgo } }), // Listings created >= 7 days ago
      UserProfile.countDocuments({ createdAt: { $gte: sevenDaysAgo } }), // Users created >= 7 days ago
    ]);

    res.status(200).json({
      totalActiveListings,
      pendingUsersCount,
      totalUsersCount,
      recentListingsCount,
      recentUsersCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats." });
  }
};

// Get users pending approval
exports.getPendingApprovals = async (req, res) => {
  try {
    // Find users whose status is 'pending'
    // Select only necessary fields to send back
    const pendingUsers = await UserProfile.find({
      approvalStatus: "pending",
    }).select("name email createdAt govtIdUrl _id approvalStatus"); // Added _id and status

    res.status(200).json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Server error fetching pending users." });
  }
};

// Approve a user's listing request
exports.approveUser = async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameter

  // Validate if userId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format." });
  }

  try {
    const userProfile = await UserProfile.findById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Check if user is actually pending (optional, but good practice)
    if (userProfile.approvalStatus !== "pending") {
      console.log(
        `User ${userId} is not pending approval (status: ${userProfile.approvalStatus}). No action taken.`
      );
      // Return success but indicate no change or return a specific message
      return res.status(200).json({
        message: `User is already ${userProfile.approvalStatus}.`,
        profile: userProfile,
      });
    }

    userProfile.approvalStatus = "approved";
    await userProfile.save();

    console.log(
      `Admin ${req.user.email} approved user ${userId} (${userProfile.email})`
    );
    res
      .status(200)
      .json({ message: "User approved successfully.", profile: userProfile }); // Return updated profile
  } catch (error) {
    console.error(`Error approving user ${userId}:`, error);
    res.status(500).json({ message: "Server error approving user." });
  }
};

// Reject a user's listing request
exports.rejectUser = async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameter

  // Validate if userId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format." });
  }

  try {
    const userProfile = await UserProfile.findById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Check if user is actually pending (optional)
    if (userProfile.approvalStatus !== "pending") {
      console.log(
        `User ${userId} is not pending approval (status: ${userProfile.approvalStatus}). No action taken.`
      );
      return res.status(200).json({
        message: `User is already ${userProfile.approvalStatus}.`,
        profile: userProfile,
      });
    }

    userProfile.approvalStatus = "rejected";
    // Optionally clear the govtIdUrl upon rejection? Depends on policy.
    // userProfile.govtIdUrl = null;
    await userProfile.save();

    console.log(
      `Admin ${req.user.email} rejected user ${userId} (${userProfile.email})`
    );
    res
      .status(200)
      .json({ message: "User rejected successfully.", profile: userProfile }); // Return updated profile
  } catch (error) {
    console.error(`Error rejecting user ${userId}:`, error);
    res.status(500).json({ message: "Server error rejecting user." });
  }
};

// ... (keep existing functions: getPendingApprovals, approveUser, rejectUser) ...

// Get all users (for Manage Users page)
exports.getAllUsers = async (req, res) => {
  try {
    // --- Query Parameters ---
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 25; // Default to 25 users per page
    const sortField = req.query.sort || "name"; // Default sort by name
    const sortOrder = req.query.order === "desc" ? -1 : 1; // Default asc (1)
    const searchTerm = req.query.search || ""; // Search term for name/email
    const statusFilter = req.query.status || ""; // Filter by approvalStatus

    // --- Calculate Skip ---
    const skip = (page - 1) * limit;

    // --- Build Filter Query ---
    let filterQuery = {};
    if (searchTerm) {
      // Case-insensitive search on name and email
      const regex = new RegExp(searchTerm, "i");
      filterQuery.$or = [{ name: regex }, { email: regex }];
    }
    if (
      statusFilter &&
      ["not_started", "pending", "approved", "rejected"].includes(statusFilter)
    ) {
      filterQuery.approvalStatus = statusFilter;
    }
    // Add other filters as needed (e.g., isAdmin: req.query.isAdmin === 'true')

    // --- Build Sort Object ---
    const sortObject = {};
    sortObject[sortField] = sortOrder;
    // Add a secondary sort key for consistency if primary keys are equal (optional)
    if (sortField !== "_id") {
      sortObject["_id"] = 1; // Ascending by ID
    }

    // --- Fetch Data ---
    // Get total count matching the filter *before* pagination
    const totalUsers = await UserProfile.countDocuments(filterQuery);

    // Get paginated, sorted, and filtered users
    const users = await UserProfile.find(filterQuery)
      .select("name email createdAt isAdmin approvalStatus accountStatus _id")
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    // --- Calculate Total Pages ---
    const totalPages = Math.ceil(totalUsers / limit);

    // --- Send Response ---
    res.status(200).json({
      users: users,
      currentPage: page,
      totalPages: totalPages,
      totalUsers: totalUsers,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

// change user status for approval

exports.updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { isAdmin, approvalStatus, accountStatus } = req.body; // Get updates from request body

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format." });
  }

  // Validate input data
  const updates = {};
  if (typeof isAdmin === "boolean") {
    updates.isAdmin = isAdmin;
  }
  if (
    approvalStatus &&
    ["not_started", "pending", "approved", "rejected"].includes(approvalStatus)
  ) {
    updates.approvalStatus = approvalStatus;
  }

  if (
    accountStatus &&
    ["active", "blocked"].includes(accountStatus) // Validate accountStatus
  ) {
    updates.accountStatus = accountStatus;
  }

  // Check if there are any valid fields to update
  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "No valid fields provided for update." });
  }

  try {
    // Find the user profile by ID
    const userProfile = await UserProfile.findById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Prevent admin from modifying their own status via this specific route (optional but safer)
    // Assumes req.userProfile is populated by middleware
    if (req.userProfile && req.userProfile._id.toString() === userId) {
      // Check if attempting to change own admin status
      if (
        updates.hasOwnProperty("isAdmin") &&
        updates.isAdmin !== req.userProfile.isAdmin
      ) {
        console.warn(
          `Admin ${req.user.email} attempted to change their own admin status via bulk update route.`
        );
        return res.status(403).json({
          message: "Cannot change your own admin status using this control.",
        });
      }
      // Prevent admin from blocking themselves via this interface
      if (
        updates.hasOwnProperty("accountStatus") &&
        updates.accountStatus === "blocked"
      ) {
        console.warn(
          `Admin ${req.user.email} attempted to block their own account via admin update route.`
        );
        return res.status(403).json({
          message: "You cannot block your own account.",
        });
      }
      // Can potentially allow changing own approval status if needed, otherwise add similar check
    }

    // Apply the updates
    Object.assign(userProfile, updates);

    // Save the updated profile
    const updatedUserProfile = await userProfile.save();

    console.log(
      `Admin ${req.user.email} updated status for user ${userId}. New status:`,
      updates
    );

    // Return the updated user profile (select relevant fields)
    const responseProfile = await UserProfile.findById(userId).select(
      "name email createdAt isAdmin approvalStatus accountStatus _id"
    );

    res.status(200).json({
      message: "User status updated successfully.",
      user: responseProfile, // Send back the updated user data
    });
  } catch (error) {
    console.error(`Error updating status for user ${userId}:`, error);
    res.status(500).json({ message: "Server error updating user status." });
  }
};

// Get all property listings (with Pagination, Sorting, Filtering)
exports.getAllListings = async (req, res) => {
  try {
    // --- Query Parameters ---
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const sortField = req.query.sort || "createdAt"; // Default sort by creation date
    const sortOrder = req.query.order === "asc" ? 1 : -1; // Default desc (-1)
    const searchTerm = req.query.search || ""; // Search term for title, address parts
    const statusFilter = req.query.status || ""; // Filter by listingType ('rent', 'buy', 'sold')

    // --- Calculate Skip ---
    const skip = (page - 1) * limit;

    // --- Build Filter Query ---
    let filterQuery = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      filterQuery.$or = [
        { title: regex },
        { addressLine1: regex },
        { cityTown: regex },
        { upazila: regex },
        { district: regex },
        { createdBy: regex }, // Search by creator email too
      ];
    }
    if (statusFilter && ["rent", "buy", "sold"].includes(statusFilter)) {
      filterQuery.listingType = statusFilter;
    }
    // Add other filters if needed (e.g., isHidden: req.query.hidden === 'true')

    // --- Build Sort Object ---
    const sortObject = {};
    sortObject[sortField] = sortOrder;
    if (sortField !== "_id") {
      sortObject["_id"] = 1; // Secondary sort
    }

    // --- Fetch Data ---
    const totalListings = await Property.countDocuments(filterQuery);

    const listings = await Property.find(filterQuery)
      .select(
        // Select fields needed for the admin table
        "title price addressLine1 cityTown district upazila propertyType listingType createdBy createdAt images isHidden featuredAt" // Ensure all needed fields are here
      )
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    // --- Calculate Total Pages ---
    const totalPages = Math.ceil(totalListings / limit);

    // --- Send Response ---
    res.status(200).json({
      listings: listings,
      currentPage: page,
      totalPages: totalPages,
      totalListings: totalListings,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching all listings for admin:", error); // Log specific context
    res.status(500).json({ message: "Server error fetching listings." });
  }
};

//hidden listing?
exports.updateListingVisibility = async (req, res) => {
  const { listingId } = req.params;
  const { isHidden } = req.body; // Expect { isHidden: true } or { isHidden: false }

  // Validate listingId
  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    return res.status(400).json({ message: "Invalid listing ID format." });
  }

  // Validate input data
  if (typeof isHidden !== "boolean") {
    return res
      .status(400)
      .json({ message: "Invalid value for isHidden. Must be true or false." });
  }

  try {
    // Find the property by ID
    const property = await Property.findById(listingId);

    if (!property) {
      return res.status(404).json({ message: "Property listing not found." });
    }

    // Update the isHidden status
    property.isHidden = isHidden;

    // Save the updated property
    await property.save();

    console.log(
      `Admin ${req.user.email} updated visibility for listing ${listingId} to isHidden=${isHidden}.`
    );

    // Return success response (can return updated property if needed)
    res.status(200).json({
      message: `Listing visibility updated successfully.`,
      listing: { _id: property._id, isHidden: property.isHidden }, // Return minimal updated info
    });
  } catch (error) {
    console.error(`Error updating visibility for listing ${listingId}:`, error);
    res
      .status(500)
      .json({ message: "Server error updating listing visibility." });
  }
};

// --- NEW: Feature/Unfeature Listing ---
exports.featureListing = async (req, res) => {
  const { listingId } = req.params;
  const { feature } = req.body; // Expect { feature: true } or { feature: false }
  const FEATURE_LIMIT = 25; // Define the limit

  // Validate listingId
  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    return res.status(400).json({ message: "Invalid listing ID format." });
  }

  // Validate input data
  if (typeof feature !== "boolean") {
    return res.status(400).json({
      message: "Invalid value for feature flag. Must be true or false.",
    });
  }

  try {
    // Find the target property
    const property = await Property.findById(listingId);
    if (!property) {
      return res.status(404).json({ message: "Property listing not found." });
    }

    if (feature) {
      // --- Logic to FEATURE a listing ---

      // Check if already featured (idempotency)
      if (property.featuredAt !== null) {
        console.log(`Listing ${listingId} is already featured.`);
        return res.status(200).json({
          message: "Listing is already featured.",
          listing: { _id: property._id, featuredAt: property.featuredAt },
        });
      }

      // Count currently featured listings (excluding the current one)
      const currentFeaturedCount = await Property.countDocuments({
        featuredAt: { $ne: null },
        _id: { $ne: listingId }, // Exclude the current one if it somehow had a date
      });

      // If limit is reached or exceeded, remove the oldest one(s)
      if (currentFeaturedCount >= FEATURE_LIMIT) {
        const excessCount = currentFeaturedCount - FEATURE_LIMIT + 1; // +1 because we're adding one more
        console.log(
          `Featured limit (${FEATURE_LIMIT}) reached. Removing ${excessCount} oldest featured listing(s).`
        );

        // Find the oldest 'excessCount' featured listings
        const oldestFeatured = await Property.find({
          featuredAt: { $ne: null },
          _id: { $ne: listingId },
        })
          .sort({ featuredAt: 1 }) // Sort ascending by date (oldest first)
          .limit(excessCount)
          .select("_id featuredAt"); // Select only ID needed for update

        const idsToUnfeature = oldestFeatured.map((p) => p._id);

        if (idsToUnfeature.length > 0) {
          // Set featuredAt to null for the oldest ones
          const updateResult = await Property.updateMany(
            { _id: { $in: idsToUnfeature } },
            { $set: { featuredAt: null } }
          );
          console.log(
            `Unfeatured ${updateResult.modifiedCount} oldest listing(s).`
          );
        }
      }

      // Now, set the featuredAt date for the target listing
      property.featuredAt = new Date();
    } else {
      // --- Logic to UNFEATURE a listing ---
      property.featuredAt = null;
    }

    // Save the changes to the target property
    await property.save();

    const action = feature ? "featured" : "unfeatured";
    console.log(`Admin ${req.user.email} ${action} listing ${listingId}.`);

    res.status(200).json({
      message: `Listing ${action} successfully.`,
      listing: { _id: property._id, featuredAt: property.featuredAt },
    });
  } catch (error) {
    console.error(
      `Error updating feature status for listing ${listingId}:`,
      error
    );
    res.status(500).json({ message: "Server error updating feature status." });
  }
};

// --- NEW: Delete Multiple Listings ---
exports.deleteMultipleListings = async (req, res) => {
  // Expect an array of listing IDs in the request body
  const { listingIds } = req.body;

  // Basic validation
  if (!Array.isArray(listingIds) || listingIds.length === 0) {
    return res.status(400).json({
      message:
        "Invalid request: Listing IDs must be provided as a non-empty array.",
    });
  }

  // Validate each ID (optional but recommended)
  const validIds = listingIds.filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  if (validIds.length !== listingIds.length) {
    console.warn(
      "Admin delete request contained invalid IDs. Only valid IDs will be processed."
    );
    // Decide whether to proceed with valid IDs or reject the whole request
    // For now, let's proceed with valid ones.
  }

  if (validIds.length === 0) {
    return res.status(400).json({ message: "No valid listing IDs provided." });
  }

  try {
    // Perform the bulk deletion
    const deleteResult = await Property.deleteMany({
      _id: { $in: validIds },
    });

    // Check if any documents were actually deleted
    if (deleteResult.deletedCount === 0) {
      console.log(
        `Admin ${req.user.email} attempted to delete listings, but none matched the provided IDs:`,
        validIds
      );
      // You might return 404 if you expect IDs to always exist,
      // or 200 if it's okay that some might already be deleted.
      return res
        .status(404)
        .json({ message: "No matching listings found to delete." });
    }

    console.log(
      `Admin ${req.user.email} deleted ${deleteResult.deletedCount} listing(s):`,
      validIds
    );

    res.status(200).json({
      message: `${deleteResult.deletedCount} listing(s) deleted successfully.`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting multiple listings:", error);
    res.status(500).json({ message: "Server error during bulk deletion." });
  }
};
