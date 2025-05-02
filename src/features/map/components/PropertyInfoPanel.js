import React from "react";
import {
  Paper,
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  CardMedia,
} from "@mui/material";
import BedIcon from "@mui/icons-material/Bed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import DirectionsIcon from "@mui/icons-material/Directions";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Helper to format price
const formatDisplayPrice = (price, listingType) => {
  if (price === null || price === undefined) return "N/A";
  const numericPrice = Number(price);
  if (isNaN(numericPrice)) return "Invalid Price";
  return `৳ ${numericPrice.toLocaleString()}${
    listingType === "rent" ? "/mo" : ""
  }`;
};

// Helper to construct location string
const constructLocationString = (property) => {
  if (property.location) return property.location;
  
  return [
    property.addressLine1,
    property.addressLine2,
    property.upazila,
    property.cityTown,
    property.district,
    property.postalCode,
  ]
    .filter(Boolean)
    .join(", ") || "Location details not available";
};

/**
 * PropertyInfoPanel Component - Enhanced for better property details display
 */
const PropertyInfoPanel = ({ selectedProperty }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!selectedProperty) {
    return null;
  }

  const placeholderImg = `/pictures/placeholder.png`;
  const imgSrc =
    Array.isArray(selectedProperty.images) && selectedProperty.images.length > 0
      ? `/pictures/${selectedProperty.images[0]}`
      : placeholderImg;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = placeholderImg;
  };

  const navigateToPropertyPage = () => {
    navigate(`/properties/${selectedProperty._id}`);
  };

  const getDirections = () => {
    if (selectedProperty?.position?.lat && selectedProperty?.position?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedProperty.position.lat},${selectedProperty.position.lng}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const locationString = constructLocationString(selectedProperty);
  const isLandOrCommercial = 
    selectedProperty.propertyType === "land" || 
    selectedProperty.propertyType === "commercial";

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
        <Grid item xs={12} sm={3} md={2}>
          <CardMedia
            component="img"
            image={imgSrc}
            alt={selectedProperty.title || "Property image"}
            onError={handleImageError}
            sx={{
              height: 80,
              width: "100%",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
        </Grid>
        <Grid item xs={12} sm={9} md={5}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
            {selectedProperty.title || "Unnamed Property"}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {locationString} •{" "}
            {formatDisplayPrice(selectedProperty.price, selectedProperty.listingType)}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1, sm: 2 },
              mt: 1,
              flexWrap: "wrap",
            }}
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
          </Box>
        </Grid>
        <Grid item xs={6} md={2.5}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DirectionsIcon />}
            onClick={getDirections}
            fullWidth
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

export default PropertyInfoPanel;