import React, { useEffect, useRef } from "react";
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

// Custom hook to update map view when center or zoom changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (
      Array.isArray(center) &&
      center.length === 2 &&
      typeof center[0] === "number" &&
      typeof center[1] === "number" &&
      typeof zoom === "number"
    ) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * MapComponent - The main map component responsible for rendering the map and its elements
 * 
 * @param {Array} properties - Array of property objects to display on the map
 * @param {Array} mapCenter - [lat, lng] coordinates for the map center
 * @param {Number} mapZoom - Zoom level for the map
 * @param {Array} userLocation - [lat, lng] coordinates of the user's location
 * @param {Object} selectedProperty - The currently selected property object
 * @param {Function} onMarkerClick - Callback function when a marker is clicked
 * @param {Function} onMapMove - Callback function when the map is moved or zoomed
 * @param {Boolean} loading - Whether map data is currently loading
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

  // Default center if not provided
  const defaultCenter = [23.8103, 90.4125]; // Dhaka coordinates
  const defaultZoom = 7;

  // Handler for map move/zoom events
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      if (!onMapMove) return;

      const handleMoveEnd = () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onMapMove([center.lat, center.lng], zoom);
      };

      map.on("moveend", handleMoveEnd);
      map.on("zoomend", handleMoveEnd);

      return () => {
        map.off("moveend", handleMoveEnd);
        map.off("zoomend", handleMoveEnd);
      };
    }, [map]);
    
    return null;
  };

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
      center={
        Array.isArray(mapCenter) && mapCenter.length === 2
          ? mapCenter
          : defaultCenter
      }
      zoom={typeof mapZoom === "number" ? mapZoom : defaultZoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
      zoomControl={false} // We'll add our own zoom control in a better position
    >
      {/* Update map view when center or zoom changes */}
      <ChangeView 
        center={
          Array.isArray(mapCenter) && mapCenter.length === 2
            ? mapCenter
            : defaultCenter
        } 
        zoom={typeof mapZoom === "number" ? mapZoom : defaultZoom} 
      />
      
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
            center={userLocation}
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
      {Array.isArray(properties) && properties.map((property) => {
        if (!property || !property._id) return null;
        
        // Skip properties with invalid position data
        if (
          !property?.position ||
          typeof property.position.lat !== "number" ||
          typeof property.position.lng !== "number"
        ) {
          console.warn("Property has invalid position data:", property._id);
          return null;
        }
        
        const isSelected = selectedProperty && selectedProperty._id === property._id;
        
        return (
          <MapMarker
            key={property._id}
            property={property}
            isSelected={isSelected}
            onClick={onMarkerClick}
          >
            <MapPopup
              property={property}
              onViewDetails={() => onMarkerClick(property)}
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