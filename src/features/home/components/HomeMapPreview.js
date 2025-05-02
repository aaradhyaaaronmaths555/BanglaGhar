import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";

// Import the MapComponent from its correct refactored location
import MapComponent from "../../map/components/MapComponent";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

/**
 * Helper function to normalize position coordinates
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
 * HomeMapPreview Component
 *
 * Displays a preview of the Bangladesh map on the home page.
 * Enhanced with proper loading of featured properties and stable coordinates.
 */
const HomeMapPreview = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // State for featured properties to display on the map
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default map settings
  const defaultCenter = [23.8103, 90.4125]; // Dhaka coordinates
  const defaultZoom = 7;
  
  // Fetch a few featured properties to display on the map
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        // Get a limited number of featured properties
        const response = await axios.get(`${API_BASE_URL}/properties`, {
          params: {
            limit: 5, // Just show a few properties
            featured: true // Get featured properties if your API supports this
          }
        });
        
        // Process properties to ensure they have valid positions
        const validProperties = response.data
          .filter(property => 
            property && 
            property._id && 
            property.position &&
            typeof property.position.lat === 'number' &&
            typeof property.position.lng === 'number'
          )
          .map(property => ({
            ...property,
            // Normalize position to prevent drift
            position: normalizePosition(property.position)
          }));
        
        console.log(`Loaded ${validProperties.length} featured properties for map preview`);
        setFeaturedProperties(validProperties);
      } catch (err) {
        console.error("Error fetching featured properties:", err);
        setFeaturedProperties([]); // Use empty array if fetch fails
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedProperties();
  }, []);
  
  // Simple handler for marker clicks that navigates to property details
  const handleMarkerClick = (property) => {
    if (property && property._id) {
      navigate(`/properties/${property._id}`);
    }
  };
  
  // Navigate to the full map page
  const openFullMap = () => {
    navigate("/map");
  };

  return (
    <Box sx={{ py: 6, backgroundColor: "#f8f9fa" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          fontWeight={600}
          gutterBottom
          align="center"
        >
          {t("explore_on_map_title", "Explore Properties on Map")}
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          {t(
            "explore_on_map_subtitle",
            "Find properties visually in your desired locations across Bangladesh."
          )}
        </Typography>
        
        <Paper
          elevation={3}
          sx={{
            height: { xs: "300px", sm: "400px", md: "500px" },
            width: "100%",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            mb: 3,
            position: "relative" // Important for map sizing
          }}
        >
          {/* Render MapComponent with preview-specific props */}
          <MapComponent
            properties={featuredProperties}
            mapCenter={defaultCenter}
            mapZoom={defaultZoom}
            onMarkerClick={handleMarkerClick}
            // Pass static props for preview mode
            loading={loading}
            userLocation={null} // Don't show user location in preview
            selectedProperty={null} // No property selected initially
            onMapMove={null} // Disable map move tracking
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default HomeMapPreview;