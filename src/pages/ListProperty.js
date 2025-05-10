import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  FormHelperText,
  Divider,
  InputAdornment,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import BedIcon from "@mui/icons-material/Bed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import SellIcon from "@mui/icons-material/Sell";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DescriptionIcon from "@mui/icons-material/Description";
import CommentIcon from "@mui/icons-material/Comment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { useAuth } from "./AuthContext";
import axios from "axios";

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(43, 123, 140, 0.12)",
  backgroundColor: "#FFFFFF",
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
  position: "relative",
  paddingBottom: theme.spacing(1),
  "&:after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "40px",
    height: "3px",
    backgroundColor: theme.palette.primary.main,
    borderRadius: "10px",
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  borderRadius: "8px",
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "0 4px 10px rgba(43, 123, 140, 0.2)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 14px rgba(43, 123, 140, 0.3)",
  },
}));

const PreviewCard = styled(Card)(({ theme }) => ({
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 6px 16px rgba(43, 123, 140, 0.1)",
  height: "100%",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 24px rgba(43, 123, 140, 0.15)",
  },
}));

const ImageUpload = styled(Box)(({ theme }) => ({
  border: "2px dashed rgba(43, 123, 140, 0.3)",
  borderRadius: "12px",
  padding: theme.spacing(3),
  backgroundColor: "rgba(43, 123, 140, 0.05)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  marginBottom: theme.spacing(2),
  "&:hover": {
    backgroundColor: "rgba(43, 123, 140, 0.08)",
    borderColor: theme.palette.primary.main,
  },
}));

// Step labels for stepper
const steps = [
  "Property Details",
  "Location & Features",
  "Images & Description",
];

// Main component
const ListProperty = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    propertyType: "",
    listingType: "sell",
    price: "",
    streetWidth: "", // Renamed from streetSize
    streetWidthComment: "", // Comment for street width
    address: "",
    city: "",
    division: "", // Renamed from state
    postcode: "", // Renamed from zipCode
    bedrooms: "",
    bathrooms: "",
    area: "",
    features: {
      parking: false,
      parkingComment: "", // Comment for parking
      garden: false,
      gardenComment: "", // Comment for garden
      airConditioning: false,
      airConditioningComment: "", // Comment for air conditioning
      furnished: false,
      furnishedComment: "", // Comment for furnished
      pool: false,
      poolComment: "", // Comment for swimming pool
      liftsInstalled: false,
      liftsInstalledComment: "", // Comment for lifts installed
    },
    description: "",
    photos: [],
    nearbyAmenities: {
      educationalInstitutions: "N/A", // Renamed from institutions
      educationalInstitutionsComment: "", // Comment for educational institutions
      hospital: "N/A",
      hospitalComment: "", // Comment for hospital
      market: "N/A",
      marketComment: "", // Comment for market
    },
    freshWaterSupply: "", // New field for fresh water supply
    freshWaterSupplyComment: "", // Comment for fresh water supply
    gasSupply: "", // New field for gas supply
    gasSupplyComment: "", // Comment for gas supply
    hasLift: false, // New field for lift availability
    hasLiftComment: "", // Comment for lift availability
  });

  const [banglaDescription, setBanglaDescription] = useState(""); // State for Bangla description
  const [useBanglaDescription, setUseBanglaDescription] = useState(false); // Toggle for description language

  const [commentDialog, setCommentDialog] = useState({
    open: false,
    field: "",
    value: "",
  });

  // Handle opening the comment dialog
  const handleOpenCommentDialog = (field, value) => {
    setCommentDialog({ open: true, field, value });
  };

  // Handle closing the comment dialog
  const handleCloseCommentDialog = () => {
    setCommentDialog({ open: false, field: "", value: "" });
  };

  // Handle saving the comment
  const handleSaveComment = () => {
    const fieldPath = commentDialog.field.split(".");
    setFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData };
      let current = updatedFormData;

      // Traverse the nested structure to the correct field
      for (let i = 0; i < fieldPath.length - 1; i++) {
        current = current[fieldPath[i]];
      }

      // Update the specific field with the comment value
      current[fieldPath[fieldPath.length - 1]] = commentDialog.value;

      return updatedFormData;
    });

    handleCloseCommentDialog();
  };

  // Form validation errors
  const [errors, setErrors] = useState({});
  const generateDescriptionWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        "http://localhost:5001/api/generate-description",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            propertyData: {
              title: formData.title,
              propertyType: formData.propertyType,
              listingType: formData.listingType,
              price: formData.price,
              address: formData.address,
              city: formData.city,
              division: formData.division,
              postcode: formData.postcode,
              bedrooms: formData.bedrooms,
              bathrooms: formData.bathrooms,
              area: formData.area,
              streetWidth: formData.streetWidth, // Renamed from streetSize
              streetWidthComment: formData.streetWidthComment,
              features: formData.features,
              nearbyAmenities: formData.nearbyAmenities,
              descriptionKeywords: formData.description, // Include manual description as keywords
              freshWaterSupply: formData.freshWaterSupply, // Include fresh water supply
              freshWaterSupplyComment: formData.freshWaterSupplyComment,
              gasSupply: formData.gasSupply, // Include gas supply
              gasSupplyComment: formData.gasSupplyComment,
              hasLift: formData.hasLift, // Include lift availability
              hasLiftComment: formData.hasLiftComment,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      const data = await response.json();
      setAiGeneratedDescription(data.description);
    } catch (error) {
      console.error("Error generating description:", error);
      setErrors({
        ...errors,
        description: "Failed to generate description. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to translate description into Bangla
  const translateToBangla = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: aiGeneratedDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to translate description");
      }

      const data = await response.json();
      setBanglaDescription(data.translatedText);
    } catch (error) {
      console.error("Error translating description:", error);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when value changes
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Handle feature toggles
  const handleFeatureToggle = (feature) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature],
      },
    });
  };

  // Handle nearby amenities changes
  const handleNearbyAmenityChange = (amenity, value) => {
    setFormData({
      ...formData,
      nearbyAmenities: {
        ...formData.nearbyAmenities,
        [amenity]: value ? "Yes" : "N/A",
      },
    });
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    // Step 1 validation
    if (activeStep === 0) {
      if (!formData.title) newErrors.title = "Title is required";
      if (!formData.propertyType)
        newErrors.propertyType = "Property type is required";
      if (!formData.price) {
        newErrors.price = "Price is required";
      } else {
        const numberPrice = Number(formData.price);
        if (isNaN(numberPrice) || numberPrice <= 0) {
          newErrors.price = "Price must be a positive number";
        } else if (numberPrice >= 1000000000) {
          newErrors.price = "Price is too high";
        }
      }
    }

    // Step 2 validation
    else if (activeStep === 1) {
      if (!formData.address) newErrors.address = "Address is required";
      if (!formData.city) newErrors.city = "City is required";
      if (!formData.division) newErrors.division = "Division is required";
      if (!formData.postcode) newErrors.postcode = "Postcode is required";
      if (!formData.bedrooms)
        newErrors.bedrooms = "Number of bedrooms is required";
      if (!formData.bathrooms)
        newErrors.bathrooms = "Number of bathrooms is required";
      if (!formData.area) newErrors.area = "Area is required";
      else if (isNaN(formData.area) || formData.area <= 0)
        newErrors.area = "Area must be a positive number";
    }

    // Step 3 validation
    else if (activeStep === 2) {
      if (!formData.description)
        newErrors.description = "Description is required";
      if (formData.description && formData.description.length < 50)
        newErrors.description = "Description should be at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateForm()) {
      if (activeStep === steps.length - 1) {
        // Submit form
        handleSubmit();
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Clean up the price field
    const rawPrice = formData.price || "";
    const cleanedPrice = parseFloat(rawPrice.replace(/[^\d.]/g, ""));

    // Construct the propertyData object
    const propertyData = {
      title: formData.title,
      price: cleanedPrice,
      location: `${formData.address}, ${formData.city}, ${formData.division} ${formData.postcode}`,
      mode: formData.listingType === "rent" ? "rent" : "buy",
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      area: Number(formData.area),
      description: formData.description,
      images:
        formData.photos && formData.photos.length > 0
          ? formData.photos
          : ["house1.png"],
      streetWidth: formData.streetWidth,
      streetWidthComment: formData.streetWidthComment, // Include street width comment
      freshWaterSupply: formData.freshWaterSupply,
      freshWaterSupplyComment: formData.freshWaterSupplyComment, // Include fresh water supply comment
      gasSupply: formData.gasSupply,
      gasSupplyComment: formData.gasSupplyComment, // Include gas supply comment
      hasLift: formData.hasLift,
      hasLiftComment: formData.hasLiftComment, // Include lift availability comment
      features: formData.features, // Include all features and their comments
      nearbyAmenities: formData.nearbyAmenities, // Include all nearby amenities and their comments
      createdBy: user?.email || user?.username || "unknown", // Set createdBy using user context
    };

    // Log the propertyData object for debugging
    console.log("Submitting property data:", JSON.stringify(propertyData, null, 2));

    try {
      const response = await axios.post("http://localhost:5001/api/properties", propertyData);
      if (response.status === 200) {
        setOpenSnackbar(true);
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      console.error("Error submitting property:", error.response?.data || error.message);
      setErrors({
        ...errors,
        submit: error.response?.data?.error || "Failed to submit property",
      });
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    // Discard the uploaded file and use a default seed image.
    setFormData((prevData) => ({
      ...prevData,
      photos: ["house1.png"],
    }));
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setOpenSuccess(false);
  };

  // Image placeholder function
  const renderImageUpload = () => (
    <ImageUpload
      onClick={() => document.getElementById("photo-upload").click()}
    >
      <input
        id="photo-upload"
        type="file"
        multiple
        accept="image/*"
        onChange={handlePhotoUpload}
        style={{ display: "none" }}
      />
      <PhotoCameraIcon sx={{ fontSize: 48, color: "#2B7B8C", mb: 2 }} />
      <Typography variant="body1" align="center" fontWeight={500}>
        Click to upload property photos
      </Typography>
      <Typography
        variant="body2"
        align="center"
        color="textSecondary"
        sx={{ mt: 1 }}
      >
        You can select multiple images
      </Typography>

      {formData.photos.length > 0 && (
        <Box sx={{ mt: 2, width: "100%" }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Selected photos ({formData.photos.length}):
          </Typography>
          <Grid container spacing={1}>
            {formData.photos.map((photo, index) => (
              <Grid item xs={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "8px",
                    backgroundColor: "rgba(43, 123, 140, 0.1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Typography variant="caption" noWrap>
                    {photo}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </ImageUpload>
  );

  // Property type options
  const propertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Condo",
    "Townhouse",
    "Land",
    "Commercial",
  ];

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Property Title"
                fullWidth
                value={formData.title}
                onChange={handleChange}
                error={Boolean(errors.title)}
                helperText={errors.title}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeWorkIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.propertyType)}>
                <InputLabel id="property-type-label">Property Type</InputLabel>
                <Select
                  labelId="property-type-label"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  label="Property Type"
                  sx={{ borderRadius: "10px" }}
                >
                  {propertyTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.propertyType && (
                  <FormHelperText>{errors.propertyType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="listing-type-label">Listing Type</InputLabel>
                <Select
                  labelId="listing-type-label"
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleChange}
                  label="Listing Type"
                  sx={{ borderRadius: "10px" }}
                >
                  <MenuItem value="sell">For Sale</MenuItem>
                  <MenuItem value="rent">For Rent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="price"
                label={
                  formData.listingType === "rent"
                    ? "Monthly Rent (৳)"
                    : "Price (৳)"
                }
                fullWidth
                type="number"
                value={formData.price}
                onChange={handleChange}
                error={Boolean(errors.price)}
                helperText={errors.price}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SellIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
          </Grid>
        );
      case 1: // Second page: Location & Features
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                fullWidth
                value={formData.address}
                onChange={handleChange}
                error={Boolean(errors.address)}
                helperText={errors.address}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="city"
                label="City"
                fullWidth
                value={formData.city}
                onChange={handleChange}
                error={Boolean(errors.city)}
                helperText={errors.city}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="division"
                label="Division"
                fullWidth
                value={formData.division}
                onChange={handleChange}
                error={Boolean(errors.division)}
                helperText={errors.division}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="postcode"
                label="Postcode"
                fullWidth
                value={formData.postcode}
                onChange={handleChange}
                error={Boolean(errors.postcode)}
                helperText={errors.postcode}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="bedrooms"
                label="Bedrooms"
                fullWidth
                type="number"
                value={formData.bedrooms}
                onChange={handleChange}
                error={Boolean(errors.bedrooms)}
                helperText={errors.bedrooms}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BedIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="bathrooms"
                label="Bathrooms"
                fullWidth
                type="number"
                value={formData.bathrooms}
                onChange={handleChange}
                error={Boolean(errors.bathrooms)}
                helperText={errors.bathrooms}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BathtubIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="area"
                label="Area (sq.ft)"
                fullWidth
                value={formData.area}
                onChange={handleChange}
                error={Boolean(errors.area)}
                helperText={errors.area}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SquareFootIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <SectionTitle variant="h6">Features</SectionTitle>
              <Grid container spacing={2}>
                {[
                  { label: "Parking", field: "parking" },
                  { label: "Garden", field: "garden" },
                  { label: "Air Conditioning", field: "airConditioning" },
                  { label: "Furnished", field: "furnished" },
                  { label: "Swimming Pool", field: "pool" },
                  { label: "Lifts Installed", field: "liftsInstalled" },
                ].map((feature) => (
                  <Grid item xs={6} md={4} key={feature.field}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.features[feature.field]}
                          onChange={() => handleFeatureToggle(feature.field)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {feature.label}
                          <CommentIcon
                            color="primary"
                            sx={{ cursor: "pointer", ml: 1 }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the Switch toggle
                              handleOpenCommentDialog(
                                `features.${feature.field}Comment`,
                                formData.features[`${feature.field}Comment`] || ""
                              );
                            }}
                          />
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );
      case 2: // Third page: Images & Description
        return (
          <Grid container spacing={3}>
            {/* Street Width */}
            <Grid item xs={12} md={6}>
              <TextField
                name="streetWidth"
                label="Street Width (in feet)"
                fullWidth
                type="number"
                value={formData.streetWidth}
                onChange={handleChange}
                error={Boolean(errors.streetWidth)}
                helperText={errors.streetWidth}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SquareFootIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <CommentIcon
                        color="primary"
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          handleOpenCommentDialog("streetWidthComment", formData.streetWidthComment)
                        }
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>

            {/* Fresh Water Supply */}
            <Grid item xs={12} md={6}>
              <TextField
                name="freshWaterSupply"
                label="Fresh Water Supply per day (in hours)"
                fullWidth
                type="number"
                value={formData.freshWaterSupply}
                onChange={handleChange}
                error={Boolean(errors.freshWaterSupply)}
                helperText={errors.freshWaterSupply}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SquareFootIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <CommentIcon
                        color="primary"
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          handleOpenCommentDialog("freshWaterSupplyComment", formData.freshWaterSupplyComment)
                        }
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
            </Grid>

            {/* Gas Supply */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.gasSupply)}>
                <InputLabel id="gas-supply-label">Gas Supply</InputLabel>
                <Select
                  labelId="gas-supply-label"
                  name="gasSupply"
                  value={formData.gasSupply}
                  onChange={handleChange}
                  label="Gas Supply"
                  sx={{ borderRadius: "10px" }}
                  endAdornment={
                    <InputAdornment position="end">
                      <CommentIcon
                        color="primary"
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          handleOpenCommentDialog("gasSupplyComment", formData.gasSupplyComment)
                        }
                      />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="Pipelines">Pipelines </MenuItem>
                  <MenuItem value="Cylinders">Cylinders </MenuItem>
                </Select>
                {errors.gasSupply && <FormHelperText>{errors.gasSupply}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Nearby amenities questions */}
            <Grid item xs={12}>
              <SectionTitle variant="h6">Nearby Amenities</SectionTitle>
              <Grid container spacing={2}>
                {[
                  { label: "Nearby Educational Institutions", field: "educationalInstitutions" },
                  { label: "Nearby Hospital", field: "hospital" },
                  { label: "Nearby Market", field: "market" },
                ].map((amenity) => (
                  <Grid item xs={12} md={4} key={amenity.field}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.nearbyAmenities[amenity.field] === "Yes"}
                          onChange={(e) =>
                            handleNearbyAmenityChange(amenity.field, e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {amenity.label}
                          <CommentIcon
                            color="primary"
                            sx={{ cursor: "pointer", ml: 1 }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the Switch toggle
                              handleOpenCommentDialog(
                                `nearbyAmenities.${amenity.field}Comment`,
                                formData.nearbyAmenities[`${amenity.field}Comment`] || ""
                              );
                            }}
                          />
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Existing content for Images & Description */}
            {/* Generate with AI description box */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <StyledButton
                  variant="outlined"
                  onClick={generateDescriptionWithAI}
                  disabled={isGenerating || !formData.title}
                  startIcon={<DescriptionIcon />}
                  sx={{ mb: 1 }}
                >
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </StyledButton>
              </Box>
              <TextField
                name="description"
                label="Property Description"
                multiline
                rows={6}
                fullWidth
                value={aiGeneratedDescription || formData.description}
                onChange={handleChange}
                error={Boolean(errors.description)}
                helperText={errors.description}
                variant="outlined"
                placeholder="Describe your property in detail. Include special features, recent renovations, nearby amenities, etc."
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ alignSelf: "flex-start", mt: 1.5 }}
                    >
                      <DescriptionIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                  },
                }}
              />
              {aiGeneratedDescription && (
                <Box sx={{ mt: 2, textAlign: "right" }}>
                  <Button
                    variant="text"
                    color="primary"
                    size="small"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        description: aiGeneratedDescription,
                      });
                      setAiGeneratedDescription("");
                    }}
                  >
                    Use this description
                  </Button>
                </Box>
              )}
            </Grid>

            {/* Translate to Bangla */}
            {aiGeneratedDescription && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StyledButton
                    variant="outlined"
                    onClick={translateToBangla}
                    disabled={!aiGeneratedDescription}
                    sx={{ mb: 1 }}
                  >
                    Translate to Bangla
                  </StyledButton>
                  {banglaDescription && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useBanglaDescription}
                          onChange={(e) => setUseBanglaDescription(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Use Bangla Description"
                    />
                  )}
                </Box>
              </Grid>
            )}

            {/* Display Bangla description */}
            {banglaDescription && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Bangla Description:
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {banglaDescription}
                </Typography>
              </Grid>
            )}
            {formData.title && formData.price && (
              <Grid item xs={12}>
                <SectionTitle variant="h6">Preview</SectionTitle>
                <PreviewCard>
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      fontWeight={600}
                      color="primary"
                    >
                      {formData.title}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formData.address}, {formData.city}, {formData.division}{" "}
                      {formData.postcode}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      ৳{Number(formData.price).toLocaleString()}
                      {formData.listingType === "rent" ? "/month" : ""}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <Typography variant="body2">
                        <BedIcon
                          fontSize="small"
                          sx={{ mr: 0.5, verticalAlign: "middle" }}
                        />
                        {formData.bedrooms} Beds
                      </Typography>
                      <Typography variant="body2">
                        <BathtubIcon
                          fontSize="small"
                          sx={{ mr: 0.5, verticalAlign: "middle" }}
                        />
                        {formData.bathrooms} Baths
                      </Typography>
                      <Typography variant="body2">
                        <SquareFootIcon
                          fontSize="small"
                          sx={{ mr: 0.5, verticalAlign: "middle" }}
                        />
                        {formData.area} sq.ft
                      </Typography>
                    </Box>
                  </CardContent>
                </PreviewCard>
              </Grid>
            )}
          </Grid>
        );
      default:
        return "Unknown step";
    }
  };

  // Don't render the page content if not logged in (redirect will happen)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* Existing content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
          <HomeWorkIcon sx={{ fontSize: 36, mr: 2, color: "#2B7B8C" }} />
          <Typography variant="h4" fontWeight={700} color="#2B7B8C">
            List Your Property
          </Typography>
        </Box>

        {submitted ? (
          <StyledPaper>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <SellIcon sx={{ fontSize: 64, color: "#2B7B8C", mb: 3 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Property Submitted Successfully!
              </Typography>
              <Typography variant="body1" paragraph color="text.secondary">
                Your property has been submitted for review. Our team will contact
                you shortly.
              </Typography>
              <StyledButton
                variant="contained"
                color="primary"
                onClick={() => navigate("/")}
                sx={{ mt: 2 }}
              >
                Return to Home
              </StyledButton>
            </Box>
          </StyledPaper>
        ) : (
          <StyledPaper>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box>
              {getStepContent(activeStep)}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
              >
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  color="primary"
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 500,
                    borderWidth: "2px",
                    "&:hover": {
                      borderWidth: "2px",
                    },
                  }}
                >
                  Back
                </Button>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/")}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 500,
                      borderWidth: "2px",
                      "&:hover": {
                        borderWidth: "2px",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <StyledButton
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    {activeStep === steps.length - 1
                      ? "Submit Property"
                      : "Continue"}
                  </StyledButton>
                </Box>
              </Box>
            </Box>
          </StyledPaper>
        )}

        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="success"
            sx={{
              width: "100%",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(43, 123, 140, 0.2)",
            }}
          >
            Your property has been submitted successfully!
          </Alert>
        </Snackbar>
      </Container>

      {/* Comment Dialog */}
      <Dialog open={commentDialog.open} onClose={handleCloseCommentDialog}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={commentDialog.value}
            onChange={(e) =>
              setCommentDialog({ ...commentDialog, value: e.target.value })
            }
            placeholder="Write your comment here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommentDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveComment} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ListProperty;
