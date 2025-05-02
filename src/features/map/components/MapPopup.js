import React from "react";
import { Popup } from "react-leaflet";
import { Box, Typography, Button, Divider } from "@mui/material";
import BedIcon from "@mui/icons-material/Bed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import { useTranslation } from "react-i18next";

/**
 * Custom MapPopup component for displaying property information when marker is clicked
 */
const MapPopup = ({
  property,
  onViewDetails,
}) => {
  const { t } = useTranslation();

  if (!property) return null;

  // Helper to format price
  const formatPrice = (price, listingType) => {
    if (price === null || price === undefined) return "N/A";
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) return "Invalid Price";
    return `৳ ${numericPrice.toLocaleString()}${
      listingType === "rent" ? "/mo" : ""
    }`;
  };

  // Helper to construct location string
  const locationString = property.location || 
    [
      property.addressLine1,
      property.cityTown,
      property.district
    ].filter(Boolean).join(', ') || "Location unavailable";

  // Determine if property is land or commercial
  const isLandOrCommercial = 
    property.propertyType === "land" || 
    property.propertyType === "commercial";

  return (
    <Popup closeButton={true} minWidth={200} maxWidth={300}>
      <Box sx={{ p: 0.5 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {property.title || "Unnamed Property"}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {locationString}
        </Typography>
        
        <Typography variant="subtitle2" color="primary" fontWeight="bold">
          {formatPrice(property.price, property.listingType)}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: "flex", justifyContent: "space-between", my: 1 }}>
          {!isLandOrCommercial && property.bedrooms !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BedIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {property.bedrooms} {property.bedrooms === 1 ? t("bed", "Bed") : t("beds", "Beds")}
              </Typography>
            </Box>
          )}
          
          {!isLandOrCommercial && property.bathrooms !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BathtubIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {property.bathrooms} {property.bathrooms === 1 ? t("bath", "Bath") : t("baths", "Baths")}
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
        </Box>
        
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={() => onViewDetails && onViewDetails(property)}
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