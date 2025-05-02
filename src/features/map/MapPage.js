import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Drawer,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";

// Import components and hooks with correct paths
import MapComponent from "./components/MapComponent";
import PropertyInfoPanel from "./components/PropertyInfoPanel";
import FilterSidebar from "../properties/components/FilterSidebar";
import useMapData from "./hooks/useMapData";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

/**
 * MapPage Component - Fullscreen map view
 */
const MapPage = () => {
  const { propertyCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get filter type from URL query params (e.g., ?type=rent)
  const queryParams = new URLSearchParams(location.search);
  const listingType = queryParams.get('type');
  
  // State for filter drawer
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 50000000],
    bedrooms: "any",
    bathrooms: "any",
    propertyType: "any",
  });
  
  // Use the map data hook
  const {
    properties,
    loading,
    error,
    userLocation,
    mapCenter,
    mapZoom,
    selectedProperty,
    locateUser,
    handleSelectProperty,
    clearSelectedProperty,
    handleMapMove,
  } = useMapData();
  
  // Used to track if we've loaded a specific property
  const [specificPropertyLoaded, setSpecificPropertyLoaded] = useState(false);
  
  // Fetch specific property if propertyCode is provided
  useEffect(() => {
    if (propertyCode && !specificPropertyLoaded) {
      const fetchProperty = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/properties/${propertyCode}`);
          
          if (response.data) {
            // Add position data if missing (you would normally have this from your backend)
            if (!response.data.position) {
              console.log("Property has no position data. Adding default position.");
              // Generate a position near Dhaka for demo purposes
              response.data.position = {
                lat: 23.8103 + (Math.random() * 0.1 - 0.05),
                lng: 90.4125 + (Math.random() * 0.1 - 0.05)
              };
            }
            
            // Select the property
            handleSelectProperty(response.data);
            setSpecificPropertyLoaded(true);
          }
        } catch (err) {
          console.error("Error fetching property:", err);
        }
      };
      
      fetchProperty();
    } else if (!propertyCode) {
      // If no propertyCode, fetch properties based on filters
      // This would normally be handled in your useMapData hook
      
      // Add position data to properties if missing - for demo purposes
      if (properties.length > 0) {
        const propertiesWithPositions = properties.map((property, index) => {
          if (!property.position) {
            // Add a position near Dhaka
            return {
              ...property,
              position: {
                lat: 23.8103 + (Math.floor(index / 5) * 0.01),
                lng: 90.4125 + ((index % 5) * 0.01)
              }
            };
          }
          return property;
        });
        
        // Log for debugging
        console.log(`Added positions to ${propertiesWithPositions.length} properties`);
      }
    }
  }, [propertyCode, handleSelectProperty, properties, specificPropertyLoaded]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 50000000],
      bedrooms: "any",
      bathrooms: "any",
      propertyType: "any",
    });
  };
  
  // Close filter drawer
  const handleCloseFilters = () => {
    setFiltersOpen(false);
  };
  
  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box 
      sx={{
        height: "calc(100vh - 64px)", // Full height minus navbar
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Top Controls */}
      <Box 
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          zIndex: 1000,
          backgroundColor: "rgba(255,255,255,0.85)",
          boxShadow: 1,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
          size="small"
        >
          {t("back", "Back")}
        </Button>
        
        {listingType && (
          <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
            {listingType === "rent" ? t("rental_properties", "Rental Properties") : 
             listingType === "buy" ? t("properties_for_sale", "Properties for Sale") : 
             t("properties", "Properties")}
          </Typography>
        )}
        
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(true)}
            variant="outlined"
            size="small"
          >
            {t("filters", "Filters")}
          </Button>
          
          <Button
            startIcon={<MyLocationIcon />}
            onClick={locateUser}
            variant="contained"
            size="small"
          >
            {t("my_location", "My Location")}
          </Button>
        </Box>
      </Box>
      
      {/* Error alert */}
      {error && (
        <Alert 
          severity="error"
          sx={{ 
            position: "absolute", 
            top: "60px", 
            left: "50%", 
            transform: "translateX(-50%)",
            zIndex: 1001,
            width: "90%",
            maxWidth: "600px"
          }}
        >
          {error}
        </Alert>
      )}
      
      {/* Map Component */}
      <Box sx={{ flexGrow: 1, position: "relative" }}>
        {loading ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>{t("loading_map", "Loading map data...")}</Typography>
          </Box>
        ) : (
          <MapComponent
            properties={properties}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            userLocation={userLocation}
            selectedProperty={selectedProperty}
            onMarkerClick={handleSelectProperty}
            onMapMove={handleMapMove}
          />
        )}
        
        {/* Selected property info panel */}
        {selectedProperty && (
          <PropertyInfoPanel selectedProperty={selectedProperty} />
        )}
      </Box>
      
      {/* Filters Drawer */}
      <Drawer
        anchor="left"
        open={filtersOpen}
        onClose={handleCloseFilters}
        PaperProps={{ sx: { width: "80%", maxWidth: "350px" } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">{t("filters", "Filters")}</Typography>
            <IconButton onClick={handleCloseFilters} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ my: 1 }} />
          
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            isMobile={true}
            onClose={handleCloseFilters}
          />
        </Box>
      </Drawer>
    </Box>
  );
};

export default MapPage;