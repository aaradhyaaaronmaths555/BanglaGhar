import React from "react";
import {
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  FormGroup,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
} from "@mui/material";
import { useTranslation } from "react-i18next";


const Step3_Features = ({ features, handleFeatureChange, formData }) => {
  const { t } = useTranslation();

  
  const isApplicable =
    formData.propertyType !== "land" && formData.propertyType !== "commercial";

  const checkboxFeatureList = [
    { key: "parking", labelKey: "parking" },
    { key: "garden", labelKey: "garden" },
    { key: "airConditioning", labelKey: "air_conditioning" },
    { key: "pool", labelKey: "swimming_pool" },
    // Add others like 'lift', 'servantRoom' if they are boolean checkboxes
  ];

  if (!isApplicable) {
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t("step_features", "Features")}
        </Typography>
        <Typography color="textSecondary">
          {t(
            "features_not_applicable",
            "Features are not applicable for Land or Commercial property types."
          )}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* <Typography variant="h6" gutterBottom>
        {t("step_features", "Features")}
      </Typography> */}
      <FormGroup>
        <Grid container spacing={1}>
          {/* Checkbox Features */}
          {checkboxFeatureList.map((feature) => (
            <Grid item xs={12} sm={6} md={4} key={feature.key}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={features[feature.key] || false}
                    onChange={handleFeatureChange} // Use the specific handler
                    name={feature.key}
                  />
                }
                label={t(feature.labelKey, feature.key)} // Use key as fallback text
              />
            </Grid>
          ))}

          {/* Furnished Status Select */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="furnished-label">
                {t("furnished", "Furnished Status")}
              </InputLabel>
              <Select
                labelId="furnished-label"
                id="furnished"
                name="furnished" 
                value={features.furnished || "no"} 
                label={t("furnished", "Furnished Status")}
                onChange={handleFeatureChange} 
              >
                <MenuItem value="no">
                  {t("furnished_no", "Not Furnished")}
                </MenuItem>
                <MenuItem value="semi">
                  {t("furnished_semi", "Semi Furnished")}
                </MenuItem>
                <MenuItem value="full">
                  {t("furnished_full", "Fully Furnished")}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Add more features if needed */}
        </Grid>
      </FormGroup>
    </Box>
  );
};

export default Step3_Features;
