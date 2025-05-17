import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  CardMedia,
  Chip,
  Divider,
  Paper,
  Snackbar,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
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
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import useWishlist from "./../hooks/useWishlist";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const formatDisplayPrice = (price, listingType) => {
  if (price === null || price === undefined) return "N/A";
  const numericPrice = Number(price);
  if (isNaN(numericPrice)) return "Invalid Price";
  return `৳ ${numericPrice.toLocaleString()}${listingType === "rent" ? "/mo" : ""}`;
};

const displayText = (value, fallback = "N/A") => value || fallback;

const formatFeatureText = (value) => {
  if (value === true || value === "yes" || value === "clear") return "Yes";
  if (value === false || value === "no") return "No";
  if (Array.isArray(value))
    return value.length > 0
      ? value.map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(", ")
      : "None";
  if (typeof value === "string" && value)
    return value.charAt(0).toUpperCase() + value.slice(1);
  return value ?? "N/A";
};

const DetailListItem = ({ icon, primary, secondary }) => {
  if (!secondary || secondary === "N/A" || secondary === "No" || secondary === "None")
    return null;
  return (
    <ListItem disablePadding>
      <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>{icon}</ListItemIcon>
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
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlistIds, toggleWishlist, loadingWishlist } = useWishlist();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const fetchPropertyDetails = useCallback(async () => {
    if (!propertyId) {
      setError("Property ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/properties/${propertyId}`);
      if (response.data) {
        setProperty(response.data);
      } else {
        setError("Property not found.");
      }
    } catch (err) {
      console.error("Error fetching property details:", err);
      setError("Failed to load property details.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  const handleWishlistToggle = () => {
    if (!property || !property._id) return;
    toggleWishlist(property._id, (message, severity) => {
      setSnackbar({ open: true, message, severity });
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleContactOwner = () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "Please log in to chat with the owner.",
        severity: "warning",
      });
      return;
    }
    if (!property?.createdBy && !property?.ownerId) {
      setSnackbar({
        open: true,
        message: "Owner information not available.",
        severity: "error",
      });
      return;
    }
    // Use ownerId if available, fallback to createdBy (email) for lookup
    const chatPartner = {
      userId: property.ownerId || null,
      email: property.ownerEmail || property.createdBy || "unknown@email.com",
      name: property.ownerName || "Property Owner",
      picture: property.ownerPicture || null,
    };
    navigate("/my-chats", {
      state: {
        initiateChatWith: chatPartner,
      },
    });
  };

  if (loading)
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Back
        </Button>
      </Container>
    );
  if (!property || typeof property !== "object")
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">Property data not available.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Back
        </Button>
      </Container>
    );

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

  const locationString =
    [
      property.addressLine1,
      property.addressLine2,
      property.upazila,
      property.cityTown,
      property.district,
      property.postalCode,
    ]
      .filter(Boolean)
      .join(", ") || "Location details not available";

  const bdDetails = property.bangladeshDetails || {};
  const features = property.features || {};
  const isLandOrCommercial =
    property.propertyType === "land" || property.propertyType === "commercial";

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to Listings
      </Button>
      <Paper elevation={3} sx={{ borderRadius: "12px", overflow: "hidden" }}>
        <Grid container>
          <Grid item xs={12} md={7}>
            <CardMedia
              component="img"
              image={imgSrc}
              alt={property.title || "Property image"}
              onError={handleImageError}
              sx={{ width: "100%", height: { xs: 300, md: 500 }, objectFit: "cover" }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Box
              sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", height: "100%" }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
              >
                <Chip
                  label={formatFeatureText(property.listingType)}
                  size="small"
                  color={property.listingType === "sold" ? "default" : "primary"}
                  variant="filled"
                />
                <Tooltip title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"} arrow>
                  <span>
                    <IconButton
                      onClick={handleWishlistToggle}
                      size="small"
                      disabled={loadingWishlist}
                    >
                      {isWishlisted ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <Typography variant="h4" component="h1" fontWeight="600" gutterBottom>
                {displayText(property.title)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", mb: 2 }}>
                <LocationOnIcon sx={{ fontSize: "1.1rem", mr: 0.5, color: "primary.main" }} />
                <Typography variant="body1">{locationString}</Typography>
              </Box>
              <Typography variant="h4" color="primary.main" fontWeight="700" sx={{ mb: 2 }}>
                {formatDisplayPrice(property.price, property.listingType)}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" gutterBottom>Overview</Typography>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {!isLandOrCommercial && property.bedrooms > 0 && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BedIcon color="action" fontSize="small" />
                      <Typography variant="body2">{displayText(property.bedrooms)} Beds</Typography>
                    </Box>
                  </Grid>
                )}
                {!isLandOrCommercial && property.bathrooms > 0 && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BathtubIcon color="action" fontSize="small" />
                      <Typography variant="body2">{displayText(property.bathrooms)} Baths</Typography>
                    </Box>
                  </Grid>
                )}
                {property.area && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SquareFootIcon color="action" fontSize="small" />
                      <Typography variant="body2">{displayText(property.area)} sqft</Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={6} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <HomeWorkIcon color="action" fontSize="small" />
                    <Typography variant="body2">{formatFeatureText(property.propertyType)}</Typography>
                  </Box>
                </Grid>
                {!isLandOrCommercial && features.furnished !== "no" && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DeckIcon color="action" fontSize="small" />
                      <Typography variant="body2">{formatFeatureText(features.furnished)}</Typography>
                    </Box>
                  </Grid>
                )}
                {features.parking && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <HomeWorkIcon color="action" fontSize="small" />
                      <Typography variant="body2">Parking</Typography>
                    </Box>
                  </Grid>
                )}
                {features.garden && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ParkIcon color="action" fontSize="small" />
                      <Typography variant="body2">Garden</Typography>
                    </Box>
                  </Grid>
                )}
                {features.pool && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PoolIcon color="action" fontSize="small" />
                      <Typography variant="body2">Pool</Typography>
                    </Box>
                  </Grid>
                )}
                {features.airConditioning && !isLandOrCommercial && (
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AcUnitIcon color="action" fontSize="small" />
                      <Typography variant="body2">AC</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography
                variant="body2"
                paragraph
                sx={{ color: "text.secondary", whiteSpace: "pre-wrap", mb: 2 }}
              >
                {displayText(property.description, "No description available.")}
              </Typography>
              <Typography variant="h6" gutterBottom>Details & Features</Typography>
              <Box sx={{ maxHeight: "250px", overflowY: "auto", mb: 2, pr: 1 }}>
                <List dense>
                  <DetailListItem
                    icon={<BuildIcon fontSize="small" />}
                    primary="Condition"
                    secondary={formatFeatureText(bdDetails.propertyCondition)}
                  />
                  {!isLandOrCommercial && property.bedrooms > 0 && (
                    <DetailListItem
                      icon={<BedIcon fontSize="small" />}
                      primary="Bedrooms"
                      secondary={displayText(property.bedrooms)}
                    />
                  )}
                  {!isLandOrCommercial && property.bathrooms > 0 && (
                    <DetailListItem
                      icon={<BathtubIcon fontSize="small" />}
                      primary="Bathrooms"
                      secondary={displayText(property.bathrooms)}
                    />
                  )}
                  <DetailListItem
                    icon={<SquareFootIcon fontSize="small" />}
                    primary="Area"
                    secondary={property.area ? `${displayText(property.area)} sqft` : "N/A"}
                  />
                  {!isLandOrCommercial && (
                    <DetailListItem
                      icon={<DeckIcon fontSize="small" />}
                      primary="Furnished Status"
                      secondary={formatFeatureText(features.furnished)}
                    />
                  )}
                  {!isLandOrCommercial && bdDetails.floorNumber && (
                    <DetailListItem
                      icon={<ElevatorIcon fontSize="small" />}
                      primary="Floor Number"
                      secondary={displayText(bdDetails.floorNumber)}
                    />
                  )}
                  {!isLandOrCommercial && bdDetails.totalFloors && (
                    <DetailListItem
                      icon={<ElevatorIcon fontSize="small" />}
                      primary="Total Floors"
                      secondary={displayText(bdDetails.totalFloors)}
                    />
                  )}
                  <Divider sx={{ my: 1 }} component="li" />
                  <DetailListItem
                    icon={<WaterIcon fontSize="small" />}
                    primary="Water Source"
                    secondary={formatFeatureText(bdDetails.waterSource)}
                  />
                  <DetailListItem
                    icon={<GasMeterIcon fontSize="small" />}
                    primary="Gas Source"
                    secondary={formatFeatureText(bdDetails.gasSource)}
                  />
                  {bdDetails.gasSource === "piped" && (
                    <DetailListItem
                      icon={<GasMeterIcon fontSize="small" />}
                      primary="Gas Line Installed"
                      secondary={formatFeatureText(bdDetails.gasLineInstalled)}
                    />
                  )}
                  <DetailListItem
                    icon={<BoltIcon fontSize="small" />}
                    primary="Backup Power"
                    secondary={formatFeatureText(bdDetails.backupPower)}
                  />
                  <DetailListItem
                    icon={<SecurityIcon fontSize="small" />}
                    primary="Security Features"
                    secondary={formatFeatureText(bdDetails.securityFeatures)}
                  />
                  <DetailListItem
                    icon={<BuildIcon fontSize="small" />}
                    primary="Earthquake Resistant"
                    secondary={formatFeatureText(bdDetails.earthquakeResistance)}
                  />
                  <DetailListItem
                    icon={<HomeWorkIcon fontSize="small" />}
                    primary="Parking Type"
                    secondary={formatFeatureText(bdDetails.parkingType)}
                  />
                  {!isLandOrCommercial && bdDetails.balcony && (
                    <DetailListItem
                      icon={<BalconyIcon fontSize="small" />}
                      primary="Balcony"
                      secondary={formatFeatureText(bdDetails.balcony)}
                    />
                  )}
                  {!isLandOrCommercial && bdDetails.rooftopAccess && (
                    <DetailListItem
                      icon={<DeckIcon fontSize="small" />}
                      primary="Rooftop Access"
                      secondary={formatFeatureText(bdDetails.rooftopAccess)}
                    />
                  )}
                  <Divider sx={{ my: 1 }} component="li" />
                  <DetailListItem
                    icon={<GavelIcon fontSize="small" />}
                    primary="Ownership Papers"
                    secondary={formatFeatureText(bdDetails.ownershipPapers)}
                  />
                  <DetailListItem
                    icon={<GavelIcon fontSize="small" />}
                    primary="Property Tenure"
                    secondary={formatFeatureText(bdDetails.propertyTenure)}
                  />
                  {bdDetails.nearbySchools && (
                    <DetailListItem
                      icon={<SchoolIcon fontSize="small" />}
                      primary="Nearby Schools"
                      secondary={displayText(bdDetails.nearbySchools)}
                    />
                  )}
                  {bdDetails.nearbyHospitals && (
                    <DetailListItem
                      icon={<LocalHospitalIcon fontSize="small" />}
                      primary="Nearby Hospitals"
                      secondary={displayText(bdDetails.nearbyHospitals)}
                    />
                  )}
                  {bdDetails.nearbyMarkets && (
                    <DetailListItem
                      icon={<StorefrontIcon fontSize="small" />}
                      primary="Nearby Markets"
                      secondary={displayText(bdDetails.nearbyMarkets)}
                    />
                  )}
                </List>
              </Box>
              <Box sx={{ mt: "auto", pt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>Contact Owner/Agent</Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleContactOwner}
                  sx={{ mt: 2 }}
                >
                  Chat with Owner
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PropertyDetailPage;