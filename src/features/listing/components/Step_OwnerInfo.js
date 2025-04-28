import React from "react";
import { TextField, Grid } from "@mui/material";

const Step_OwnerInfo = ({ formData, errors, handleChange }) => {
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      handleChange(e);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          required
          id="advertiserName"
          name="advertiserName"
          label="Advertiser Name"
          fullWidth
          variant="outlined"
          value={formData.advertiserName}
          onChange={handleChange}
          error={!!errors.advertiserName}
          helperText={errors.advertiserName}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          id="advertiserPhone"
          name="advertiserPhone"
          label="Advertiser Phone"
          fullWidth
          variant="outlined"
          value={formData.advertiserPhone}
          onChange={handlePhoneChange}
          error={!!errors.advertiserPhone}
          helperText={errors.advertiserPhone}
        />
      </Grid>
    </Grid>
  );
};

export default Step_OwnerInfo;