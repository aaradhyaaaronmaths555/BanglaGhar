import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
} from "@mui/material"; // Removed Paper import
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext"; // Adjust path if needed

// Import the ACTUAL PropertyCard component
import PropertyCard from "../../properties/components/PropertyCard"; // Uncommented and path verified

const API_BASE_URL = "http://localhost:5001/api"; // Use environment variable in production

/**
 * FeaturedProperties Component
 *
 * Fetches and displays a selection of 30 random properties using PropertyCard.
 * Includes wishlist functionality if the user is logged in.
 */
const FeaturedProperties = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoggedIn, user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]); // State to hold wishlist IDs

  // Fetch featured properties (remains the same)
  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/properties?random=true&limit=30`
        );
        setProperties(response.data || []);
      } catch (err) {
        console.error("Error fetching featured properties:", err);
        setError(
          t("error_fetching_featured", "Failed to load featured properties.")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, [t]);

  // Fetch user's wishlist if logged in (remains the same)
  useEffect(() => {
    const fetchWishlist = async () => {
      if (isLoggedIn && user?.email) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/users/${user.email}/wishlist`
          );
          setWishlist(response.data.wishlist.map((item) => item._id || item));
        } catch (error) {
          console.error("Error fetching wishlist:", error);
        }
      } else {
        setWishlist([]);
      }
    };
    fetchWishlist();
  }, [isLoggedIn, user]);

  // Function to handle wishlist toggle (remains the same)
  const toggleWishlist = async (propertyId) => {
    if (!isLoggedIn || !user?.email) {
      navigate("/login");
      return;
    }
    const isInWishlist = wishlist.includes(propertyId);
    const username = user.email;
    try {
      let updatedWishlist;
      if (isInWishlist) {
        await axios.delete(`${API_BASE_URL}/users/${username}/wishlist`, {
          data: { propertyId },
        });
        updatedWishlist = wishlist.filter((id) => id !== propertyId);
      } else {
        await axios.post(`${API_BASE_URL}/users/${username}/wishlist`, {
          propertyId,
        });
        updatedWishlist = [...wishlist, propertyId];
      }
      setWishlist(updatedWishlist);
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  // Function to handle viewing property details (remains the same)
  const handleViewDetails = (property) => {
    const mode = property.mode || "rent";
    // Option 1: Navigate to properties page and trigger dialog (requires logic on Properties page)
    navigate(`/properties/${mode}?open=${property._id}`);
    // Option 2: Navigate to a dedicated details page (if you create one)
    // navigate(`/property/${property._id}`);
  };

  return (
    <Box sx={{ py: 6, bgcolor: "rgba(43, 123, 140, 0.03)" }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h2"
              fontWeight={700}
              gutterBottom
            >
              {t("featured_properties")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("handpicked_intro")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate("/properties/rent")}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            {t("view_all_properties")}
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ textAlign: "center", my: 5 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && properties.length > 0 && (
          <Grid container spacing={3}>
            {properties.map((property) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={property._id}>
                {/* Use the actual PropertyCard component */}
                <PropertyCard
                  property={property}
                  isWishlisted={wishlist.includes(property._id)}
                  onWishlistToggle={() => toggleWishlist(property._id)}
                  onViewDetails={() => handleViewDetails(property)}
                />
                {/* Removed the placeholder Paper component */}
              </Grid>
            ))}
          </Grid>
        )}
        {!loading && !error && properties.length === 0 && (
          <Typography
            sx={{ textAlign: "center", my: 5, color: "text.secondary" }}
          >
            No featured properties available at the moment.
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default FeaturedProperties;
