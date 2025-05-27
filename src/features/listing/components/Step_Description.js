import React from "react";
import {
  Grid,
  TextField,
  Button,
  CircularProgress,
  Box,
  FormHelperText,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useTranslation } from "react-i18next";

const Step_Description = ({
  formData,
  errors,
  handleChange,
  generateDescription,
  loadingAI,
}) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            id="description"
            name="description"
            label={t("property_description", "Description")}
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={formData.description || ""}
            onChange={handleChange}
            error={!!errors.description}
            helperText={
              errors.description ||
              t(
                "description_helper",
                "Describe the property's key features, condition, and surroundings. You can also use the AI generator."
              )
            }
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={generateDescription}
              disabled={loadingAI}
              startIcon={
                loadingAI ? <CircularProgress size={16} /> : <AutoFixHighIcon />
              }
              sx={{ textTransform: "none" }}
            >
              {loadingAI
                ? t("sending", "Generating...")
                : t("generate_ai", "Generate with AI")}
            </Button>
          </Box>
          {errors.description?.includes("Failed to generate") && (
            <FormHelperText error sx={{ mt: 1 }}>
              {errors.description}
            </FormHelperText>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Step_Description;
