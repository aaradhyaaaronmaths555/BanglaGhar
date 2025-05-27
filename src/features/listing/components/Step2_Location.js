import React from "react";
import { Grid, TextField, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

const Step2_Location = ({ formData, errors, handleChange }) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            id="addressLine1"
            name="addressLine1"
            label={t(
              "address_line_1",
              "Address Line 1 (House/Road/Village/Area)"
            )}
            fullWidth
            variant="outlined"
            value={formData.addressLine1}
            onChange={handleChange}
            error={!!errors.addressLine1}
            helperText={
              errors.addressLine1 ||
              t(
                "address_l1_helper",
                "Enter the main address (required)"
              )
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="addressLine2"
            name="addressLine2"
            label={t(
              "address_line_2",
              "Address Line 2 (Optional, Flat/Unit/Floor)"
            )}
            fullWidth
            variant="outlined"
            value={formData.addressLine2}
            onChange={handleChange}
            error={!!errors.addressLine2}
            helperText={errors.addressLine2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="cityTown"
            name="cityTown"
            label={t("city_town", "City/Town")}
            fullWidth
            variant="outlined"
            value={formData.cityTown}
            onChange={handleChange}
            error={!!errors.cityTown}
            helperText={errors.cityTown}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="upazila"
            name="upazila"
            label={t("upazila_thana", "Upazila/Thana")}
            fullWidth
            variant="outlined"
            value={formData.upazila}
            onChange={handleChange}
            error={!!errors.upazila}
            helperText={errors.upazila}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="district"
            name="district"
            label={t("district", "District")}
            fullWidth
            variant="outlined"
            value={formData.district}
            onChange={handleChange}
            error={!!errors.district}
            helperText={errors.district}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="postalCode"
            name="postalCode"
            label={t("postal_code", "Postal Code")}
            fullWidth
            variant="outlined"
            value={formData.postalCode}
            onChange={handleChange}
            error={!!errors.postalCode}
            helperText={errors.postalCode}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Step2_Location;
