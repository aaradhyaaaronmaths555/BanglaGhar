import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  CircleMarker,
  Tooltip,
  ZoomControl,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Typography } from "@mui/material";

// Import custom components
import MapMarker from "./MapMarker";
import MapPopup from "./MapPopup";

// The LayersControl allows users to switch between different map styles
const { BaseLayer } = LayersControl;

/**
 * Custom hook to update map view when center or zoom changes
 * Enhanced with better handling of position changes
 */
function ChangeView({ center, zoom }) {
  const map = useMap();
  const previousCenter = useRef(center);
  const previousZoom = useRef(zoom);
  const isAnimating = useRef(false);
  
  useEffect(() => {
    // Validate center and zoom
    if (
      !Array.isArray(center) ||
      center.length !== 2 ||
      typeof center[0] !== "number" ||
      typeof center[1] !== "number" ||
      typeof zoom !== "number"
    ) {
      console.warn("Invalid map center or zoom:", { center, zoom });
      return;
    }
    
    // Fix center coordinates to 6 decimal places for consistency
    const fixedCenter = [
      parseFloat(center[0].toFixed(6)),
      parseFloat(center[1].toFixed(6))
    ];
    
    // Check if center or zoom has actually changed significantly
    const centerChanged = 
      Math.abs(previousCenter.current[0] - fixedCenter[0]) > 0.000001 || 
      Math.abs(previousCenter.current[1] - fixedCenter[1]) > 0.000001;
    
    const zoomChanged = previousZoom.current !== zoom;
    
    // Only update if there's a meaningful change and not already animating
    if ((centerChanged || zoomChanged) && !isAnimating.current) {
      console.log(`Setting map view to center: [${fixedCenter}], zoom: ${zoom}`);
      
      // Prevent multiple animations at once
      isAnimating.current = true;
      
      // Use flyTo for smoother transitions
      map.flyTo(fixedCenter, zoom, {
        animate: true,
        duration: 0.75 // seconds
      });
      
      // Update previous values
      previousCenter.current = fixedCenter;
      previousZoom.current = zoom;
      
      // Reset animation flag when done
      setTimeout(() => {
        isAnimating.current = false;
      }, 800); // slightly longer than animation duration
    }
  }, [center, zoom, map]);
  
  return null;
}

/**
 * MapComponent - The main map component responsible for rendering the map and its elements
 * Enhanced with better stability for property positions
 */
const MapComponent = ({
  properties,
  mapCenter,
  mapZoom,
  userLocation,
  selectedProperty,
  onMarkerClick,
  onMapMove,
  loading = false,
}) => {
  const { t } = useTranslation();
  const mapRef = useRef();
  
  // Extract selected property ID for stable comparisons
  const selectedPropertyId = selectedProperty?._id;

  // Default center and zoom with fallbacks
  const defaultCenter = [23.8103, 90.4125]; // Dhaka coordinates
  const defaultZoom = 7;
  
  // Normalize center coordinates to prevent position drift
  const normalizedCenter = useMemo(() => {
    if (!Array.isArray(mapCenter) || mapCenter.length !== 2) {
      return defaultCenter;
    }
    
    if (typeof mapCenter[0] !== "number" || typeof mapCenter[1] !== "number") {
      return defaultCenter;
    }
    
    // Fix to 6 decimal places for consistency
    return [
      parseFloat(mapCenter[0].toFixed(6)),
      parseFloat(mapCenter[1].toFixed(6))
    ];
  }, [mapCenter]);
  
  // Normalize zoom level
  const normalizedZoom = useMemo(() => {
    return typeof mapZoom === "number" && !isNaN(mapZoom) 
      ? Math.round(mapZoom) // Round to nearest integer to prevent float issues
      : defaultZoom;
  }, [mapZoom]);
  
  // Handle marker click with stable property references
  const handleMarkerClick = useCallback((property) => {
    if (!property || !onMarkerClick) return;
    
    // Create a stable copy of the property with normalized position
    const stableProperty = {
      ...property,
      position: property.position 
        ? { 
            lat: parseFloat(property.position.lat.toFixed(6)), 
            lng: parseFloat(property.position.lng.toFixed(6)) 
          }
        : property.position
    };
    
    console.log("Marker clicked:", stableProperty._id, stableProperty.position);
    onMarkerClick(stableProperty);
  }, [onMarkerClick]);

  // Custom hook for map events that handles movement events
  const MapEvents = () => {
    const map = useMap();
    const moveEndTimeout = useRef(null);
    
    useEffect(() => {
      if (!onMapMove) return;

      const handleMoveEnd = () => {
        // Clear any pending timeouts to debounce events
        if (moveEndTimeout.current) {
          clearTimeout(moveEndTimeout.current);
        }
        
        // Set a new timeout to debounce rapid movements
        moveEndTimeout.current = setTimeout(() => {
          const center = map.getCenter();
          const zoom = map.getZoom();
          
          // Normalize values to prevent floating point issues
          const normalizedCenter = [
            parseFloat(center.lat.toFixed(6)),
            parseFloat(center.lng.toFixed(6))
          ];
          
          console.log("Map moved to:", normalizedCenter, zoom);
          onMapMove(normalizedCenter, zoom);
        }, 300); // 300ms debounce
      };

      map.on("moveend", handleMoveEnd);
      map.on("zoomend", handleMoveEnd);

      // Cleanup listeners and timeout on unmount
      return () => {
        map.off("moveend", handleMoveEnd);
        map.off("zoomend", handleMoveEnd);
        
        if (moveEndTimeout.current) {
          clearTimeout(moveEndTimeout.current);
        }
      };
    }, [map, onMapMove]);
    
    return null;
  };

  // Prepare valid properties list
  const validProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    
    return properties.filter(property => 
      property && 
      property._id && 
      property.position && 
      typeof property.position.lat === "number" && 
      typeof property.position.lng === "number"
    );
  }, [properties]);

  // Show loading indicator if data is loading
  if (loading) {
    return (
      <Box 
        sx={{ 
          height: "100%", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexDirection: "column",
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body1">
          {t('loading_map', 'Loading map data...')}
        </Typography>
      </Box>
    );
  }

  return (
    <MapContainer
      ref={mapRef}
      center={normalizedCenter}
      zoom={normalizedZoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
      zoomControl={false} // We'll add our own zoom control in a better position
      attributionControl={true}
      doubleClickZoom={true}
      closePopupOnClick={true}
    >
      {/* Update map view when center or zoom changes */}
      <ChangeView center={normalizedCenter} zoom={normalizedZoom} />
      
      {/* Add zoom control in top-right instead of top-left */}
      <ZoomControl position="topright" />
      
      {/* Allow users to switch between map styles */}
      <LayersControl position="topright">
        <BaseLayer checked name={t('street_map', 'Street Map')}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>
        
        <BaseLayer name={t('satellite', 'Satellite')}>
          <TileLayer
            attribution='Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
            url="https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
          />
        </BaseLayer>
        
        <BaseLayer name={t('terrain', 'Terrain')}>
          <TileLayer
            attribution='Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>
      </LayersControl>

      {/* Render User Location Marker */}
      {userLocation &&
        Array.isArray(userLocation) &&
        userLocation.length === 2 && (
          <CircleMarker
            center={[
              parseFloat(userLocation[0].toFixed(6)),
              parseFloat(userLocation[1].toFixed(6))
            ]}
            radius={8}
            pathOptions={{ 
              color: "#2196f3", 
              fillColor: "#2196f3", 
              fillOpacity: 0.6,
              weight: 2
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              {t('your_location', 'Your Location')}
            </Tooltip>
          </CircleMarker>
        )}

      {/* Render Property Markers with Custom Components */}
      {validProperties.map((property) => {
        const isSelected = selectedPropertyId === property._id;
        
        return (
          <MapMarker
            key={property._id}
            property={property}
            isSelected={isSelected}
            onClick={handleMarkerClick}
          >
            <MapPopup
              property={property}
              onViewDetails={handleMarkerClick}
            />
          </MapMarker>
        );
      })}

      {/* Map Events handler for tracking map movements */}
      {onMapMove && <MapEvents />}
    </MapContainer>
  );
};

export default MapComponent;