import React from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Create custom icons for different property types or states
const createPropertyIcon = (isSelected, propertyType) => {
  // Base icon settings
  const iconSettings = {
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    iconSize: isSelected ? [30, 45] : [25, 41], // Bigger if selected
    iconAnchor: isSelected ? [15, 45] : [12, 41],
    popupAnchor: [0, -41],
    shadowSize: [41, 41],
  };

  // You can customize icons based on property type
  // Example: different colors for different property types
  // This would require custom marker images
  switch (propertyType) {
    case "apartment":
      // iconSettings.iconUrl = require("../../../assets/markers/apartment-marker.png");
      break;
    case "house":
      // iconSettings.iconUrl = require("../../../assets/markers/house-marker.png");
      break;
    case "land":
      // iconSettings.iconUrl = require("../../../assets/markers/land-marker.png");
      break;
    case "commercial":
      // iconSettings.iconUrl = require("../../../assets/markers/commercial-marker.png");
      break;
    default:
      // Use default marker
      break;
  }

  return new L.Icon(iconSettings);
};

/**
 * Custom MapMarker component for property markers on the map
 */
const MapMarker = ({
  property,
  isSelected = false,
  onClick,
  children,
}) => {
  // Validate property position
  if (
    !property?.position ||
    typeof property.position.lat !== "number" ||
    typeof property.position.lng !== "number"
  ) {
    console.warn("Invalid property position:", property);
    return null;
  }

  // Create custom icon based on property type and selection state
  const icon = createPropertyIcon(isSelected, property.propertyType);

  // Optional: Add CSS class for additional styling via className
  const className = isSelected ? "map-marker-selected" : "map-marker";

  // Prepare event handlers
  const eventHandlers = {
    click: () => {
      if (onClick) onClick(property);
    },
  };

  return (
    <Marker
      position={[property.position.lat, property.position.lng]}
      icon={icon}
      eventHandlers={eventHandlers}
      zIndexOffset={isSelected ? 1000 : 0} // Selected markers appear on top
    >
      {children}
    </Marker>
  );
};

export default MapMarker;