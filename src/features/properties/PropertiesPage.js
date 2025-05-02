import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewListIcon from "@mui/icons-material/ViewList";
import MapIcon from "@mui/icons-material/Map";
import { useTranslation } from "react-i18next";

// Import Hooks and Components
import usePropertyFilters from "./hooks/usePropertyFilters";
import useWishlist from "./hooks/useWishlist";
import FilterSidebar from "./components/FilterSidebar";
import SortDropdown from "./components/SortDropdown";
import PropertyCard from "./components/PropertyCard";

/**
 * PropertiesPage Component - Updated with map navigation
 */
const PropertiesPage = () => {
  const { mode } = useParams(); // mode = 'rent', 'buy', 'sold' or undefined
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  // State for view mode (list only now - map redirects to MapPage)
  const [viewMode, setViewMode] = useState("list");

  // Get property data using existing hooks
  const {
    properties,
    loading,
    error,
    filters,
    searchTerm,
    sortBy,
    handleFilterChange,
    handleSearchChange,
    handleSortChange,
    resetFilters,
  } = usePropertyFilters(mode);

  const { wishlistIds, toggleWishlist, loadingWishlist, wishlistError } =
    useWishlist();

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Notification handlers
  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification((prev) => ({ ...prev, open: false }));
  };
  
  const showWishlistNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };
  
  const handleWishlistToggle = (propertyId) => {
    if (!propertyId) return;
    toggleWishlist(propertyId, showWishlistNotification);
  };
  
  const handleDrawerToggle = () => {
    setMobileFiltersOpen(!mobileFiltersOpen);
  };

  // Handle view mode toggle - redirects to map page for "map" mode
  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      if (newViewMode === "map") {
        // Navigate to the full-screen map view with listing type as query param
        const queryParam = mode ? `?type=${mode}` : '';
        navigate(`/map${queryParam}`);
      } else {
        setViewMode(newViewMode);
      }
    }
  };

  // Determine page title based on mode and translate
  const getPageTitle = () => {
    switch (mode) {
      case "rent":
        return t("properties_rent");
      case "buy":
        return t("properties_sale");
      case "sold":
        return t("properties_sold");
      default:
        return t("properties_all");
    }
  };
  const pageTitle = getPageTitle();

  const sidebarContent = (
    <FilterSidebar
      filters={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={resetFilters}
      isMobile={isMobile}
      onClose={handleDrawerToggle}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          {pageTitle}
        </Typography>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon sx={{ mr: 1 }} />
            {!isMobile && t("list_view", "List View")}
          </ToggleButton>
          <ToggleButton value="map" aria-label="map view">
            <MapIcon sx={{ mr: 1 }} />
            {!isMobile && t("map_view", "Map View")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {wishlistError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load wishlist status: {wishlistError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {!isMobile && (
          <Grid item md={3} lg={2.5}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {sidebarContent}
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={9} lg={9.5}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 3,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              borderRadius: "12px",
            }}
          >
            <TextField
              label={t("search_placeholder")}
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: "8px" },
              }}
              sx={{ flexGrow: 1, minWidth: "200px" }}
            />
            <SortDropdown sortBy={sortBy} onSortChange={handleSortChange} />
            {isMobile && (
              <IconButton
                onClick={handleDrawerToggle}
                color="primary"
                aria-label="Open filters"
              >
                <FilterListIcon />
              </IconButton>
            )}
          </Paper>

          {/* LIST VIEW CONTENT */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : properties.length > 0 ? (
            <Grid container spacing={3}>
              {properties.map((property) =>
                property && property._id ? (
                  <Grid item xs={12} sm={6} lg={4} key={property._id}>
                    <PropertyCard
                      property={property}
                      isWishlisted={wishlistIds.has(property._id)}
                      onWishlistToggle={() =>
                        handleWishlistToggle(property._id)
                      }
                    />
                  </Grid>
                ) : null
              )}
            </Grid>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                mt: 4,
                p: 4,
                backgroundColor: "rgba(0,0,0,0.02)",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                {t("no_properties_found")}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {t("adjust_filters")}
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={resetFilters}
              >
                {t("reset_filters")}
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>

      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileFiltersOpen}
          onClose={handleDrawerToggle}
          PaperProps={{ sx: { width: "80%", maxWidth: "300px" } }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filters
            </Typography>
            {sidebarContent}
          </Box>
        </Drawer>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PropertiesPage;