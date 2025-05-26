// src/features/Properties/pages/PropertyDetailPage.js
import React, { useState, useEffect, useCallback } from "react";
import {
  useParams,
  useNavigate,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BedIcon from "@mui/icons-material/Bed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import WaterIcon from "@mui/icons-material/Water";
import GasMeterIcon from "@mui/icons-material/GasMeter";
import BoltIcon from "@mui/icons-material/Bolt";
import SecurityIcon from "@mui/icons-material/Security";
import SchoolIcon from "@mui/icons-material/School";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BalconyIcon from "@mui/icons-material/Balcony";
import GavelIcon from "@mui/icons-material/Gavel";
import BuildIcon from "@mui/icons-material/Build";
import ParkIcon from "@mui/icons-material/Park";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import DeckIcon from "@mui/icons-material/Deck";
import PoolIcon from "@mui/icons-material/Pool";
import ElevatorIcon from "@mui/icons-material/Elevator";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { CircularProgress, Alert, Snackbar, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import MapIcon from "@mui/icons-material/Map";

// For translation function 't':
import { useTranslation } from "react-i18next";

// New Icons (Examples - Use appropriate icons)

import axios from "axios";
import { useAuth } from "../../../context/AuthContext"; // Adjust path if needed
import useWishlist from "./../hooks/useWishlist"; // Adjust path if needed
import { initiateOrGetConversation } from "../../chat/services/chatService";
import { useSnackbar } from "../../../context/SnackbarContext"; //

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Helper functions remain the same
const formatDisplayPrice = (price, listingType) => {
  if (price === null || price === undefined) return "N/A";
  const numericPrice = Number(price);
  if (isNaN(numericPrice)) return "Invalid Price";
  return `৳ ${numericPrice.toLocaleString()}${
    listingType === "rent" ? "/mo" : ""
  }`;
};

const displayText = (value, fallback = "N/A") => value || fallback;

const formatFeatureText = (value, t) => {
  if (value === true || value === "yes" || value === "clear") return "Yes";
  if (value === false || value === "no") return "No";
  if (Array.isArray(value))
    return value.length > 0
      ? value.map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(", ")
      : "None";
  if (typeof value === "string" && value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value ?? "N/A";
};

/**
 * Get position data from a property object in a standard format
 */
const getPropertyPosition = (property) => {
  if (!property) return null;

  // First try position.lat/lng format
  if (
    property.position &&
    typeof property.position.lat === "number" &&
    typeof property.position.lng === "number"
  ) {
    return {
      lat: property.position.lat,
      lng: property.position.lng,
    };
  }

  // Then try latitude/longitude format
  if (
    typeof property.latitude === "number" &&
    typeof property.longitude === "number"
  ) {
    return {
      lat: property.latitude,
      lng: property.longitude,
    };
  }

  return null;
};

/**
 * Helper to construct location string with consistent handling of null/undefined values
 */
const constructLocationString = (property) => {
  if (!property) return "Location unavailable";

  // If the property already has a pre-constructed address string, use it
  if (property.address) return property.address;

  // If the property has a location field, use it (legacy support)
  if (property.location) return property.location;

  // Otherwise construct from individual fields
  const locationParts = [
    property.addressLine1,
    property.addressLine2,
    property.upazila,
    property.cityTown,
    property.district,
    property.postalCode,
  ].filter(Boolean);

  return locationParts.length > 0
    ? locationParts.join(", ")
    : "Location details not available";
};

/**
 * Get location accuracy icon and color
 */
const getLocationAccuracyInfo = (accuracy) => {
  switch (accuracy) {
    case "precise":
      return {
        icon: <CheckCircleIcon fontSize="small" />,
        color: "success",
        text: "precise",
        label: "P",
      };
    case "approximate":
      return {
        icon: <WarningIcon fontSize="small" />,
        color: "warning",
        text: "approximate",
        label: "A",
      };
    case "district-level":
      return {
        icon: <ErrorIcon fontSize="small" />,
        color: "error",
        text: "district-level",
        label: "D",
      };
    default:
      return {
        icon: <InfoIcon fontSize="small" />,
        color: "default",
        text: "unknown",
        label: "U",
      };
  }
};

const DetailListItem = ({ icon, primary, secondary }) => {
  if (
    !secondary ||
    secondary === "N/A" ||
    secondary === "No" ||
    secondary === "None"
  )
    return null;
  return (
    <ListItem disablePadding>
      <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={primary}
        secondary={secondary}
        primaryTypographyProps={{ variant: "body2", fontWeight: "medium" }}
        secondaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
      />
    </ListItem>
  );
};

const PropertyDetailPage = () => {
  const { t } = useTranslation();
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user, idToken, isLoggedIn, isLoading: isAuthLoading } = useAuth(); //
  const location = useLocation(); // Get location for redirect state
  const { showSnackbar } = useSnackbar(); //
  const [contactLoading, setContactLoading] = useState(false);
  const { wishlistIds, toggleWishlist, loadingWishlist } = useWishlist();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [activeTab, setActiveTab] = useState(0);

  // UPDATED: Improved fetchPropertyDetails with better error handling and debugging
  const fetchPropertyDetails = useCallback(async () => {
    if (!propertyId) {
      setError("Property ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Log the API request for debugging
      console.log(
        `Fetching property details from: ${API_BASE_URL}/properties/${propertyId}`
      );

      const response = await axios.get(
        `${API_BASE_URL}/properties/${propertyId}`
      );

      if (response.data) {
        console.log("Property data received:", response.data);

        // Ensure position data is available
        const property = response.data;
        const positionData = getPropertyPosition(property);

        // Add position data if missing (for map functionality)
        if (!positionData) {
          console.log("Position data missing, adding default position");

          // Default to the district center if location accuracy is district-level
          if (
            property.locationAccuracy === "district-level" &&
            property.district
          ) {
            // You could implement a lookup for district centers here
            // For now, use a randomized position near Dhaka
            property.position = {
              lat: 23.8103 + (Math.random() * 0.1 - 0.05),
              lng: 90.4125 + (Math.random() * 0.1 - 0.05),
            };
            console.log("Added district-level position data");
          } else {
            // Random position near Dhaka for any other case
            property.position = {
              lat: 23.8103 + (Math.random() * 0.1 - 0.05),
              lng: 90.4125 + (Math.random() * 0.1 - 0.05),
            };

            // Set location accuracy if not already set
            if (!property.locationAccuracy) {
              property.locationAccuracy = "approximate";
            }

            console.log("Added approximate position data");
          }
        }

        setProperty(property);
      } else {
        setError("Property not found.");
      }
    } catch (err) {
      console.error("Error fetching property details:", err);

      // Include more detailed error information
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        setError(
          `Failed to load property details. Server responded with: ${err.response.status} ${err.response.statusText}`
        );
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        setError(
          "Failed to load property details. No response received from server."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Failed to load property details. ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  // Other handlers remain the same
  const handleWishlistToggle = () => {
    if (!property || !property._id) return;
    toggleWishlist(property._id, (message, severity) => {
      // setSnackbar({ open: true, message, severity });
      showSnackbar(message, severity);
    });
  };

  const handleOpenMap = () => {
    if (
      property &&
      property.position &&
      typeof property.position.lat === "number" &&
      typeof property.position.lng === "number"
    ) {
      // Navigate to your map page (e.g., '/map')
      // Pass property data, specifically location, via route state.
      // The MapPage can then use this data to display the property.
      navigate("/map", {
        state: {
          properties: [property], // Sending as an array in case your MapPage handles multiple markers
          center: property.position, // Optional: tell MapPage to center on this property
          zoom: 15, // Optional: suggest an initial zoom level
        },
      });
    } else {
      // Handle cases where location data might be missing or invalid
      showSnackbar(
        "Location data for this property is not available or invalid.",
        "warning"
      );
      console.warn(
        "handleOpenMap: Property or property.position is missing or invalid.",
        property
      );
    }
  };

  const handleContactAdvertiser = async () => {
    if (!isLoggedIn || !idToken || !user || !user.cognitoSub) {
      //
      showSnackbar("Please log in to contact the advertiser.", "warning");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // IMPORTANT: Adjust 'property.createdBy._id' if your property data structure is different.
    // This assumes 'createdBy' is an object with an '_id' field, or 'createdBy' is the ID string itself.
    // For example, it could be property.ownerId or property.user._id etc.
    const advertiserId = property?.createdBy?._id || property?.createdBy;

    if (!advertiserId) {
      showSnackbar(
        "Advertiser information is missing for this property.",
        "error"
      );
      console.error(
        "Advertiser ID (property.createdBy._id or property.createdBy) not found in property data:",
        property
      );
      return;
    }

    // Ensure user._id (MongoDB ID) is available from AuthContext
    if (user._id && user._id.toString() === advertiserId.toString()) {
      showSnackbar(
        "You cannot start a conversation about your own listing.",
        "info"
      );
      return;
    }

    setContactLoading(true);
    try {
      console.log(
        `Initiating chat with advertiser: ${advertiserId} for property: ${property._id}`
      );
      const conversation = await initiateOrGetConversation(
        idToken,
        advertiserId,
        property._id
      );
      console.log("Conversation initiated/retrieved:", conversation);
      showSnackbar(
        `Chat ready! ID: ${conversation._id}. Navigating...`,
        "success"
      );

      // Navigate to a chat page/interface.
      // We will create /chat route later. It can use route state to open specific conversation.
      navigate("/chat", {
        state: {
          conversationId: conversation._id,
          initialConversationData: conversation,
        },
      });
    } catch (err) {
      console.error("Error contacting advertiser:", err);
      showSnackbar(err.message || "Could not start conversation.", "error");
    } finally {
      setContactLoading(false);
    }
  };

  // --- Render Logic ---
  if (loading || isAuthLoading)
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Container>
    );
  if (error)
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Container>
    );
  if (!property || typeof property !== "object")
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">Property data not available.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Container>
    );

  // Data preparation remains the same
  const placeholderImg = `/pictures/placeholder.png`;
  const imgSrc =
    Array.isArray(property.images) && property.images.length > 0
      ? `/pictures/${property.images[0]}`
      : placeholderImg;
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = placeholderImg;
  };
  const isWishlisted = wishlistIds.has(property._id);

  // Get location string using the helper
  const locationString = constructLocationString(property);

  // Get location accuracy information
  const locationAccuracy = property.locationAccuracy || "unknown";
  const accuracyInfo = getLocationAccuracyInfo(locationAccuracy);

  const bdDetails = property.bangladeshDetails || {};
  const features = property.features || {};
  const isLandOrCommercial =
    property.propertyType === "land" || property.propertyType === "commercial";

  console.log("[PropertyDetailPage DEBUG]");
  console.log("isAuthLoading:", isAuthLoading);
  console.log("isLoggedIn:", isLoggedIn);
  console.log("user:", user); // Check if user and user._id are available
  console.log("property object:", property); // Inspect the whole property object
  console.log("property.createdBy:", property?.createdBy); // Specifically check the createdBy field
  console.log("Is button disabled due to contactLoading?:", contactLoading);
  console.log(
    "Is button disabled due to !property?.createdBy?:",
    !property?.createdBy
  );

  const isOwnListing =
    isLoggedIn &&
    property?.createdBy &&
    user?._id &&
    ((property.createdBy._id && property.createdBy._id === user._id) ||
      property.createdBy === user._id);
  console.log("Is this the user's own listing?:", isOwnListing);

  // This log will show exactly what the disabled condition evaluates to for the button itself
  if (!isAuthLoading && isLoggedIn && !isOwnListing) {
    console.log(
      'Button "disabled" prop will be:',
      contactLoading || !property?.createdBy
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Navigation and Map Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back to Listings
        </Button>

        <Button
          variant="outlined"
          startIcon={<MapIcon />}
          onClick={handleOpenMap}
        >
          View on Map
        </Button>
      </Box>

      {/* Location Accuracy Alert */}
      {(locationAccuracy === "district-level" ||
        locationAccuracy === "approximate") && (
        <Alert
          severity={locationAccuracy === "district-level" ? "error" : "warning"}
          icon={accuracyInfo.icon}
          sx={{ mb: 3 }}
        >
          {locationAccuracy === "district-level"
            ? t(
                "district_level_warning_detail",
                "This property listing has only district-level location information. The exact property location may be elsewhere in this district."
              )
            : t(
                "approximate_location_warning_detail",
                "This property listing has an approximate location. The exact property may be nearby but not at the exact point shown on the map."
              )}
        </Alert>
      )}

      <Paper elevation={3} sx={{ borderRadius: "12px", overflow: "hidden" }}>
        <Grid container>
          {/* Image Section */}
          <Grid item xs={12} md={7}>
            <CardMedia
              component="img"
              image={imgSrc}
              alt={property.title || "Property image"}
              onError={handleImageError}
              sx={{
                width: "100%",
                height: { xs: 300, md: 500 },
                objectFit: "cover",
              }}
            />
          </Grid>

          {/* Details Section */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Chip
                  label={formatFeatureText(
                    property.listingType || property.mode
                  )}
                  size="small"
                  color={
                    (property.listingType || property.mode) === "sold"
                      ? "default"
                      : "primary"
                  }
                  variant="filled"
                />
                <Tooltip
                  title={
                    isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                  }
                  arrow
                >
                  <span>
                    <IconButton
                      onClick={handleWishlistToggle}
                      size="small"
                      disabled={loadingWishlist}
                    >
                      {isWishlisted ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <Typography
                variant="h4"
                component="h1"
                fontWeight="600"
                gutterBottom
              >
                {displayText(property.title)}
              </Typography>

              {/* Location with accuracy indicator */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  color: "text.secondary",
                  mb: 2,
                }}
              >
                <LocationOnIcon
                  sx={{
                    fontSize: "1.1rem",
                    mr: 0.5,
                    mt: 0.3,
                    color: "primary.main",
                    flexShrink: 0,
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      mr: 1,
                      maxWidth: "calc(100% - 40px)", // Leave space for the accuracy chip
                    }}
                  >
                    {locationString}
                  </Typography>

                  {/* Location Accuracy Indicator */}
                  <Tooltip
                    title={t(
                      `location_accuracy_${accuracyInfo.text}`,
                      `${
                        locationAccuracy.charAt(0).toUpperCase() +
                        locationAccuracy.slice(1)
                      } Location`
                    )}
                    arrow
                  >
                    <Chip
                      size="small"
                      color={accuracyInfo.color}
                      label={accuracyInfo.label}
                      sx={{
                        height: 20,
                        minWidth: 20,
                        width: 20,
                        "& .MuiChip-label": {
                          p: 0,
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </Tooltip>
                </Box>
              </Box>

              <Typography
                variant="h4"
                color="primary.main"
                fontWeight="700"
                sx={{ mb: 2 }}
              >
                {formatDisplayPrice(
                  property.price,
                  property.listingType || property.mode
                )}
              </Typography>

              <Divider sx={{ my: 1 }} />

              {/* Overview Section */}
              <Typography variant="h6" gutterBottom>
                Overview
              </Typography>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {/* Property features grid - same as original */}
                {!isLandOrCommercial && (
                  <>
                    <Grid item xs={6} sm={4}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <BedIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {displayText(property.bedrooms)} Beds
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <BathtubIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {displayText(property.bathrooms)} Baths
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}
                <Grid item xs={6} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SquareFootIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      {displayText(property.area)} sqft
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <HomeWorkIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      {formatFeatureText(property.propertyType)}
                    </Typography>
                  </Box>
                </Grid>
                {/* Additional features - same as original */}
                {!isLandOrCommercial && features.furnished !== "no" && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DeckIcon color="action" fontSize="small" />
                      <Typography variant="body2">
                        {formatFeatureText(features.furnished)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {/* Other feature items - same as original */}
                {features.parking === true && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <HomeWorkIcon color="action" fontSize="small" />
                      <Typography variant="body2">Parking</Typography>
                    </Box>
                  </Grid>
                )}
                {features.garden === true && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ParkIcon color="action" fontSize="small" />
                      <Typography variant="body2">Garden</Typography>
                    </Box>
                  </Grid>
                )}
                {features.pool === true && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PoolIcon color="action" fontSize="small" />
                      <Typography variant="body2">Pool</Typography>
                    </Box>
                  </Grid>
                )}
                {features.airConditioning === true && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AcUnitIcon color="action" fontSize="small" />
                      <Typography variant="body2">AC</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Description Section */}
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography
                variant="body2"
                paragraph
                sx={{ color: "text.secondary", whiteSpace: "pre-wrap", mb: 2 }}
              >
                {displayText(property.description, "No description available.")}
              </Typography>

              {/* Detailed Features Section */}
              <Typography variant="h6" gutterBottom>
                Details & Features
              </Typography>
              <Box
                sx={{
                  maxHeight: "250px",
                  overflowY: "auto",
                  mb: 2,
                  pr: 1 /* For scrollbar */,
                }}
              >
                <List dense>
                  {/* Location accuracy as a list item */}
                  <DetailListItem
                    icon={accuracyInfo.icon}
                    primary="Location Accuracy"
                    secondary={t(
                      `location_accuracy_${accuracyInfo.text}_full`,
                      `${
                        locationAccuracy.charAt(0).toUpperCase() +
                        locationAccuracy.slice(1)
                      } Location`
                    )}
                  />

                  {/* Other property details - same as original */}
                  <DetailListItem
                    icon={<BuildIcon fontSize="small" />}
                    primary="Condition"
                    secondary={formatFeatureText(bdDetails.propertyCondition)}
                  />
                  {/* Other detail items remain the same */}
                </List>
              </Box>

              {/* Contact Owner section */}
              <Box sx={{ mt: "auto", pt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Contact Advertiser
                </Typography>
                {isAuthLoading ? (
                  <CircularProgress size={24} />
                ) : isLoggedIn &&
                  property?.createdBy &&
                  user?._id &&
                  (property.createdBy._id === user._id ||
                    property.createdBy === user._id) ? (
                  <Typography variant="body2" color="text.secondary">
                    This is your listing. You cannot message yourself.
                  </Typography>
                ) : isLoggedIn ? (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={
                      contactLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <MailOutlineIcon />
                      )
                    }
                    onClick={handleContactAdvertiser}
                    disabled={contactLoading || !property?.createdBy} // Also disable if advertiser info is somehow missing
                  >
                    {contactLoading ? "Processing..." : "Message Advertiser"}
                  </Button>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Please{" "}
                    <RouterLink to="/login" state={{ from: location.pathname }}>
                      log in
                    </RouterLink>{" "}
                    to contact the advertiser.
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PropertyDetailPage;
