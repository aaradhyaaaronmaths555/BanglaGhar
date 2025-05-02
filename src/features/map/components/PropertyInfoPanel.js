import React from "react";
import {
  Paper,
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  CardMedia,
  Stack,
  Skeleton,
} from "@mui/material";
import BedIcon from "@mui/icons-material/Bed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import DirectionsIcon from "@mui/icons-material/Directions";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Helper to format price with consistent display
 */
const formatDisplayPrice = (price, listingType) => {
  if (price === null || price === undefined) return "N/A";
  const numericPrice = Number(price);
  if (isNaN(numericPrice)) return "Invalid Price";
  return `৳ ${numericPrice.toLocaleString()}${
    listingType === "rent" ? "/mo" : ""
  }`;
};

/**
 * Helper to construct location string with consistent handling of null/undefined values
 */
const constructLocationString = (property) => {
  if (!property) return "Location unavailable";
  
  // If the property already has a pre-constructed address string, use it
  if (property.address) return property.address;
  
  // If the property has a location field, use it
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
 * Function to normalize position coordinates
 */
const normalizePosition = (position) => {
  if (!position || typeof position.lat !== 'number' || typeof position.lng !== 'number') {
    return null;
  }
  return {
    lat: parseFloat(position.lat.toFixed(6)),
    lng: parseFloat(position.lng.toFixed(6))
  };
};

/**
 * PropertyInfoPanel Component - Enhanced for better property details display
 * with improved address handling
 */
const PropertyInfoPanel = ({ selectedProperty }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // If no property is selected, return null
  if (!selectedProperty) {
    return null;
  }

  // Default image handling
  const placeholderImg = `/pictures/placeholder.png`;
  const imgSrc =
    Array.isArray(selectedProperty.images) && selectedProperty.images.length > 0
      ? `/pictures/${selectedProperty.images[0]}`
      : placeholderImg;
  
  // Get location string using the helper function
  const locationString = constructLocationString(selectedProperty);
  
  // Property type check
  const isLandOrCommercial = 
    selectedProperty.propertyType === "land" || 
    selectedProperty.propertyType === "commercial";
  
  // Price formatting
  const formattedPrice = formatDisplayPrice(
    selectedProperty.price, 
    selectedProperty.listingType
  );
  
  // Normalize position coordinates for stability
  const stablePosition = normalizePosition(selectedProperty.position);

  // Image error handler
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = `/pictures/placeholder.png`;
  };

  // Navigation handler with proper error handling
  const navigateToPropertyPage = () => {
    if (!selectedProperty._id) {
      console.error("Cannot navigate - property ID is missing");
      return;
    }
    navigate(`/properties/${selectedProperty._id}`);
  };

  // Get directions handler with position validation
  const getDirections = () => {
    if (!stablePosition) {
      console.error("Cannot get directions - property position is invalid");
      return;
    }
    
    // Try to use property address for more accurate directions
    let destination = '';
    
    if (locationString && locationString !== "Location details not available" && locationString !== "Location unavailable") {
      // Use the address string directly, encoded for a URL
      destination = encodeURIComponent(locationString);
      console.log(`Using address for directions: ${locationString}`);
    } else {
      // Fall back to coordinates if no valid address
      destination = `${stablePosition.lat},${stablePosition.lng}`;
      console.log(`Using coordinates for directions: ${destination}`);
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        p: 2,
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(5px)",
        borderTop: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Property Image */}
        <Grid item xs={12} sm={3} md={2}>
          <CardMedia
            component="img"
            image={imgSrc}
            alt={selectedProperty.title || "Unnamed Property"}
            onError={handleImageError}
            sx={{
              height: 80,
              width: "100%",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
        </Grid>
        
        {/* Property Details */}
        <Grid item xs={12} sm={9} md={5}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
            {selectedProperty.title || "Unnamed Property"}
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 0.5 }}>
            <LocationOnIcon 
              fontSize="small" 
              color="action" 
              sx={{ mt: 0.3, mr: 0.5, minWidth: 20 }}
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.2
              }}
            >
              {locationString}
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" color="primary" fontWeight="bold" sx={{ mt: 0.5 }}>
            {formattedPrice}
          </Typography>
          
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}
          >
            {!isLandOrCommercial && selectedProperty.bedrooms !== undefined && (
              <Chip
                icon={<BedIcon fontSize="small" />}
                label={`${selectedProperty.bedrooms} ${t("beds", "Beds")}`}
                size="small"
                variant="outlined"
              />
            )}
            
            {!isLandOrCommercial && selectedProperty.bathrooms !== undefined && (
              <Chip
                icon={<BathtubIcon fontSize="small" />}
                label={`${selectedProperty.bathrooms} ${t("baths", "Baths")}`}
                size="small"
                variant="outlined"
              />
            )}
            
            {selectedProperty.area !== undefined && (
              <Chip
                icon={<SquareFootIcon fontSize="small" />}
                label={`${selectedProperty.area} ft²`}
                size="small"
                variant="outlined"
              />
            )}
            
            {selectedProperty.propertyType && (
              <Chip
                icon={<HomeWorkIcon fontSize="small" />}
                label={selectedProperty.propertyType}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Grid>
        
        {/* Action Buttons */}
        <Grid item xs={6} md={2.5}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DirectionsIcon />}
            onClick={getDirections}
            fullWidth
            disabled={!stablePosition && !locationString}
            sx={{ borderRadius: "8px", textTransform: "none", py: 1 }}
          >
            {t("directions", "Directions")}
          </Button>
        </Grid>
        
        <Grid item xs={6} md={2.5}>
          <Button
            variant="outlined"
            color="primary"
            onClick={navigateToPropertyPage}
            startIcon={<OpenInNewIcon />}
            fullWidth
            sx={{ borderRadius: "8px", textTransform: "none", py: 1 }}
          >
            {t("view_details", "View Details")}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

/**
 * Skeleton loader for PropertyInfoPanel while data is loading
 */
export const PropertyInfoPanelSkeleton = () => {
  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        p: 2,
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3} md={2}>
          <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: "8px" }} />
        </Grid>
        
        <Grid item xs={12} sm={9} md={5}>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="100%" height={24} />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: "16px" }} />
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: "16px" }} />
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: "16px" }} />
          </Stack>
        </Grid>
        
        <Grid item xs={6} md={2.5}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: "8px" }} />
        </Grid>
        
        <Grid item xs={6} md={2.5}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: "8px" }} />
        </Grid>
      </Grid>
    </Paper>
  );
};

const PropertyInfoPanelWrapper = ({ selectedProperty }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  if (!selectedProperty) {
    return null;
  }
  
  return <PropertyInfoPanel selectedProperty={selectedProperty} />;
};

export default PropertyInfoPanel;