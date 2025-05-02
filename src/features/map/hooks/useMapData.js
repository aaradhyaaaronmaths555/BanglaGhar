import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
const DEFAULT_CENTER = [23.8103, 90.4125]; // Dhaka coordinates
const DEFAULT_ZOOM = 7;

/**
 * Custom Hook to manage map data, including properties, user location,
 * map state (center, zoom), and selected property.
 */
const useMapData = (propertyCode = null) => {
  const [properties, setProperties] = useState([]); // All fetched properties for the map
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // [lat, lng]
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [selectedProperty, setSelectedProperty] = useState(null); // Holds the currently selected property object

  // Fetch a specific property by code
  const fetchPropertyByCode = useCallback(async (code) => {
    if (!code) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/properties/${code}`);
      const property = response.data;
      
      if (!property) {
        setError(`Property with code ${code} not found.`);
        return null;
      }
      
      // Check if property has valid coordinates
      if (
        !property.position ||
        typeof property.position.lat !== "number" ||
        typeof property.position.lng !== "number"
      ) {
        setError(`Property with code ${code} has invalid location data.`);
        return null;
      }
      
      // Set this property as the selected one
      setSelectedProperty(property);
      // Center the map on this property
      setMapCenter([property.position.lat, property.position.lng]);
      setMapZoom(15); // Zoom in to property level
      // Add this property to the properties array if it's not already there
      setProperties(prev => {
        const exists = prev.some(p => p._id === property._id);
        return exists ? prev : [...prev, property];
      });
      
      return property;
    } catch (err) {
      console.error(`Error fetching property ${code}:`, err);
      setError(`Failed to load property: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch properties - either all properties or just the specific one
  useEffect(() => {
    if (propertyCode) {
      // If a property code is provided, fetch just that property
      fetchPropertyByCode(propertyCode);
    } else {
      // Otherwise fetch all properties for the map
      const fetchMapProperties = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(`${API_BASE_URL}/properties`);
          // Filter properties that have valid coordinates
          const mapProperties = response.data.filter(
            (p) =>
              p.position &&
              typeof p.position.lat === "number" &&
              typeof p.position.lng === "number"
          );
          setProperties(mapProperties || []);
        } catch (err) {
          console.error("Error fetching map properties:", err);
          setError("Failed to load property locations.");
          setProperties([]);
        } finally {
          setLoading(false);
        }
      };
      fetchMapProperties();
    }
  }, [propertyCode, fetchPropertyByCode]);

  // Get user's current location
  const locateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newUserLocation = [latitude, longitude];
          setUserLocation(newUserLocation);
          setMapCenter(newUserLocation); // Center map on user
          setMapZoom(13); // Zoom in closer
          // Don't clear selection when viewing a specific property
          if (!propertyCode) {
            setSelectedProperty(null);
          }
          console.log("User located:", newUserLocation);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError(
            "Could not get your location. Please ensure location services are enabled."
          );
          setUserLocation(null); // Clear location on error
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Geolocation options
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, [propertyCode]);

  // Handler for selecting a property (e.g., when marker is clicked)
  const handleSelectProperty = useCallback((property) => {
    setSelectedProperty(property);
    // Center the map on the selected property
    if (property?.position?.lat && property?.position?.lng) {
      setMapCenter([property.position.lat, property.position.lng]);
      setMapZoom(15); // Zoom in closer
    }
  }, []);

  // Handler to clear selected property
  const clearSelectedProperty = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  // Handlers to update map state if needed (e.g., on map move/zoom)
  const handleMapMove = useCallback((center, zoom) => {
    setMapCenter(center);
    setMapZoom(zoom);
  }, []);

  return {
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
    fetchPropertyByCode, // Export the new function
  };
};

export default useMapData;