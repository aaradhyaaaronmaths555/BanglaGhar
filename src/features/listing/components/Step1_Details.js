import React from "react";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  InputAdornment,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const Step1_Details = ({ formData, errors, handleChange }) => {
  const { t } = useTranslation();

  const showBedBath =
    formData.propertyType !== "land" && formData.propertyType !== "commercial";

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.propertyType}>
            <InputLabel id="propertyType-label">
              {t("property_type")}
            </InputLabel>
            <Select
              labelId="propertyType-label"
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              label={t("property_type")}
              onChange={handleChange}
            >
              <MenuItem value="apartment">{t("apartment")}</MenuItem>
              <MenuItem value="house">{t("house")}</MenuItem>
              <MenuItem value="condo">{t("condo")}</MenuItem>
              <MenuItem value="land">{t("land")}</MenuItem>
              <MenuItem value="commercial">{t("commercial")}</MenuItem>
            </Select>
            <FormHelperText>{errors.propertyType}</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.listingType}>
            <InputLabel id="listingType-label">
              {t("listing_type")}
            </InputLabel>
            <Select
              labelId="listingType-label"
              id="listingType"
              name="listingType"
              value={formData.listingType}
              label={t("listing_type")}
              onChange={handleChange}
            >
              <MenuItem value="rent">{t("rent")}</MenuItem>
              <MenuItem value="buy">{t("buy")}</MenuItem>
              <MenuItem value="sold">{t("sold")}</MenuItem>
            </Select>
            <FormHelperText>{errors.listingType}</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="title"
            name="title"
            label={t("property_title")}
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="price"
            name="price"
            label={t("price")}
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price}
            onChange={handleChange}
            error={!!errors.price}
            helperText={errors.price}
            InputProps={{
              startAdornment: <InputAdornment position="start">৳</InputAdornment>,
              inputProps: { min: 0 },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="area"
            name="area"
            label={t("area_sqft", "Area (sqft)")}
            type="number"
            fullWidth
            variant="outlined"
            value={formData.area}
            onChange={handleChange}
            error={!!errors.area}
            helperText={errors.area || t("optional", "Optional")}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        {showBedBath && (
          <Grid item xs={12} sm={6}>
            <TextField
              required
              id="bedrooms"
              name="bedrooms"
              label={t("bedrooms")}
              type="number"
              fullWidth
              variant="outlined"
              value={formData.bedrooms}
              onChange={handleChange}
              error={!!errors.bedrooms}
              helperText={errors.bedrooms}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
        )}
        {showBedBath && (
          <Grid item xs={12} sm={6}>
            <TextField
              required
              id="bathrooms"
              name="bathrooms"
              label={t("bathrooms")}
              type="number"
              fullWidth
              variant="outlined"
              value={formData.bathrooms}
              onChange={handleChange}
              error={!!errors.bathrooms}
              helperText={errors.bathrooms}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Step1_Details;
