import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Snackbar,
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
 * Function to normalize position coordinates
 */
const normalizePosition = (position) => {
  // Handle array format [lat, lng]
  if (Array.isArray(position) && position.length === 2) {
    if (typeof position[0] === 'number' && typeof position[1] === 'number') {
      return [
        parseFloat(position[0].toFixed(6)),
        parseFloat(position[1].toFixed(6))
      ];
    }
    return null;
  }
  
  // Handle object format {lat, lng}
  if (position && typeof position === 'object') {
    if (typeof position.lat === 'number' && typeof position.lng === 'number') {
      return {
        lat: parseFloat(position.lat.toFixed(6)),
        lng: parseFloat(position.lng.toFixed(6))
      };
    }
  }
  
  return null;
};

/**
 * Function to construct a complete address string from property fields
 */
const constructAddressString = (property) => {
  if (!property) return "Location unavailable";
  
  // Use the location field if it exists
  if (property.location) return property.location;
  
  // Otherwise construct from individual address components
  const addressParts = [
    property.addressLine1,
    property.addressLine2,
    property.upazila,
    property.cityTown,
    property.district,
    property.postalCode,
  ].filter(Boolean);
  
  return addressParts.length > 0 
    ? addressParts.join(", ") 
    : "Location details not available";
};

/**
 * MapPage Component - Fullscreen map view
 * Enhanced with better address handling for properties
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
  
  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  
  // Refs for tracking state
  const propertyPositionRef = useRef(null);
  const propertyAddressRef = useRef(null);
  const loadingPropertyRef = useRef(false);
  
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
    fetchPropertyByCode,
  } = useMapData();
  
  // Track if we've loaded a specific property
  const [specificPropertyLoaded, setSpecificPropertyLoaded] = useState(false);
  
  // Show notification helper
  const showNotification = useCallback((message, severity = "info") => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);
  
  // Close notification handler
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Fetch specific property if propertyCode is provided
  useEffect(() => {
    if (propertyCode && !specificPropertyLoaded && !loadingPropertyRef.current) {
      loadingPropertyRef.current = true;
      
      const fetchProperty = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/properties/${propertyCode}`);
          
          if (response.data) {
            // Store original property data for reference
            const property = response.data;
            
            // Construct and store the full address
            const addressString = constructAddressString(property);
            propertyAddressRef.current = addressString;
            
            // Log the address for debugging
            console.log(`Property address: ${addressString}`);
            
            // Add position data if missing or invalid
            let propertyWithPosition = { ...property };
            
            if (!propertyWithPosition.position || 
                typeof propertyWithPosition.position.lat !== 'number' || 
                typeof propertyWithPosition.position.lng !== 'number') {
              
              console.log("Property has no valid position data. Adding stable position.");
              
              // Generate a stable position for this property using its ID
              const propertyId = propertyWithPosition._id || propertyCode;
              
              // Use a hash function to generate a stable number from the ID
              const hashCode = (str) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                  const char = str.charCodeAt(i);
                  hash = ((hash << 5) - hash) + char;
                  hash = hash & hash; // Convert to 32bit integer
                }
                return hash;
              };
              
              // Generate a stable position using the hash
              const hash = hashCode(propertyId);
              const lat = 23.8103 + (Math.abs(hash % 1000) / 10000);
              const lng = 90.4125 + (Math.abs((hash >> 10) % 1000) / 10000);
              
              propertyWithPosition.position = {
                lat,
                lng
              };
            }
            
            // Normalize position coordinates
            const stablePosition = normalizePosition(propertyWithPosition.position);
            
            // Store property position for future reference
            propertyPositionRef.current = stablePosition;
            
            // Add address and position to the property
            const enhancedProperty = {
              ...propertyWithPosition,
              address: addressString, // Add the full address string
              position: stablePosition // Use normalized position
            };
            
            console.log(`Property loaded: ${propertyCode}, position: ${JSON.stringify(stablePosition)}`);
            
            // Select the property
            handleSelectProperty(enhancedProperty);
            setSpecificPropertyLoaded(true);
            
            showNotification(`Property '${enhancedProperty.title || "Unnamed Property"}' loaded`, "success");
          } else {
            showNotification(`Property with ID ${propertyCode} not found`, "error");
          }
        } catch (err) {
          console.error("Error fetching property:", err);
          showNotification(`Error loading property: ${err.message}`, "error");
        } finally {
          loadingPropertyRef.current = false;
        }
      };
      
      fetchProperty();
    }
  }, [propertyCode, handleSelectProperty, specificPropertyLoaded, showNotification]);
  
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
    showNotification("Filters reset", "info");
  };
  
  // Close filter drawer
  const handleCloseFilters = () => {
    setFiltersOpen(false);
  };
  
  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };
  
  // Handle property selection with address handling
  const onPropertySelect = useCallback((property) => {
    if (!property) return;
    
    // Add address to property if not already present
    let enhancedProperty = { ...property };
    
    if (!enhancedProperty.address) {
      enhancedProperty.address = constructAddressString(property);
    }
    
    // Use the hook's handler with the enhanced property
    handleSelectProperty(enhancedProperty);
    
    // Update position reference
    if (property && property.position) {
      propertyPositionRef.current = normalizePosition(property.position);
    }
    
    // Update address reference
    propertyAddressRef.current = enhancedProperty.address;
    
    console.log(`Selected property: ${property?._id}, address: ${enhancedProperty.address}`);
  }, [handleSelectProperty]);
  
  // Locate user handler with error handling
  const handleLocateUser = () => {
    try {
      locateUser();
      showNotification("Finding your location...", "info");
    } catch (err) {
      console.error("Error locating user:", err);
      showNotification("Failed to get your location", "error");
    }
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
        
        {propertyCode && (
          <Typography variant="subtitle1" sx={{ fontWeight: "medium", maxWidth: "250px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {propertyAddressRef.current}
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
            onClick={handleLocateUser}
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
          onClose={() => clearSelectedProperty()}
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
            onMarkerClick={onPropertySelect}
            onMapMove={handleMapMove}
          />
        )}
        
        {/* Selected property info panel */}
        {selectedProperty && <PropertyInfoPanel selectedProperty={selectedProperty} />}
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
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        message={notification.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default MapPage;