import React from "react";
import { Popup } from "react-leaflet";
import { Box, Typography, Button, Divider, Chip, Stack } from "@mui/material";
import BedIcon from "@mui/icons-material/Bed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useTranslation } from "react-i18next";

/**
 * Custom MapPopup component for displaying property information when marker is clicked
 * Enhanced with more stable handling of property data
 */
const MapPopup = ({
  property,
  onViewDetails,
}) => {
  const { t } = useTranslation();

  if (!property) return null;

  // Helper to format price with consistent handling
  const formatPrice = (price, listingType) => {
    if (price === null || price === undefined) return "N/A";
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) return "Invalid Price";
    return `৳ ${numericPrice.toLocaleString()}${
      listingType === "rent" ? "/mo" : ""
    }`;
  };

  // Helper to construct location string with consistent handling
  const getLocationString = () => {
    if (property.location) return property.location;
    
    // Construct from individual fields with fallbacks
    const locationParts = [
      property.addressLine1,
      property.cityTown,
      property.district
    ].filter(Boolean);
    
    return locationParts.length > 0 
      ? locationParts.join(', ') 
      : "Location unavailable";
  };

  // Get stable location string
  const locationString = getLocationString();

  // Determine if property is land or commercial for conditional rendering
  const isLandOrCommercial = 
    property.propertyType === "land" || 
    property.propertyType === "commercial";

  // Handle view details click with consistent context
  const handleViewDetails = () => {
    if (onViewDetails) {
      // Create a stable copy of property before passing it to handler
      const stableProperty = {
        ...property,
        position: property.position 
          ? { 
              lat: parseFloat(property.position.lat.toFixed(6)), 
              lng: parseFloat(property.position.lng.toFixed(6)) 
            }
          : property.position
      };
      onViewDetails(stableProperty);
    }
  };

  return (
    <Popup closeButton={true} minWidth={240} maxWidth={300}>
      <Box sx={{ p: 0.5 }}>
        {/* Property Title */}
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          gutterBottom
          sx={{ 
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {property.title || "Unnamed Property"}
        </Typography>
        
        {/* Location */}
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
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
        
        {/* Price */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <MonetizationOnIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            {formatPrice(property.price, property.listingType)}
          </Typography>
          {property.listingType && (
            <Chip
              label={property.listingType === "rent" ? t("for_rent", "For Rent") : t("for_sale", "For Sale")}
              size="small"
              color={property.listingType === "rent" ? "info" : "success"}
              sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
            />
          )}
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Property Features */}
        <Stack direction="row" spacing={2} sx={{ mb: 1, justifyContent: "space-between" }}>
          {!isLandOrCommercial && property.bedrooms !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BedIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {property.bedrooms}
              </Typography>
            </Box>
          )}
          
          {!isLandOrCommercial && property.bathrooms !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BathtubIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {property.bathrooms}
              </Typography>
            </Box>
          )}
          
          {property.area !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <SquareFootIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {property.area} ft²
              </Typography>
            </Box>
          )}
          
          {property.propertyType && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <HomeWorkIcon fontSize="small" color="action" />
              <Typography 
                variant="body2"
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  maxWidth: "60px"
                }}
              >
                {property.propertyType}
              </Typography>
            </Box>
          )}
        </Stack>
        
        {/* Action Button */}
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={handleViewDetails}
          sx={{ 
            mt: 1,
            textTransform: "none", 
            borderRadius: "8px",
            fontSize: "0.8rem"
          }}
        >
          {t("view_details", "View Details")}
        </Button>
      </Box>
    </Popup>
  );
};

export default MapPopup;