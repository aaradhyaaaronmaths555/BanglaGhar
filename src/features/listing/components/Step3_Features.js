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
      <FormGroup>
        <Grid container spacing={1}>
          {checkboxFeatureList.map((feature) => (
            <Grid item xs={12} sm={6} md={4} key={feature.key}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!features[feature.key]}
                    onChange={handleFeatureChange(feature.key)}
                  />
                }
                label={t(feature.labelKey)}
              />
            </Grid>
          ))}
        </Grid>
      </FormGroup>
    </Box>
  );
};

export default Step3_Features;
