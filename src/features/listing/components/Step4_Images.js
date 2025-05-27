import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardMedia,
  IconButton,
  FormHelperText,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";

const Step4_Images = ({
  imageUrls,
  imageUploadStates,
  handleImageFileSelected,
  removeImageByUrl,
  errors,
}) => {
  const { t } = useTranslation();
  const [localValidationErrors, setLocalValidationErrors] = useState(null);

  const onFileChange = useCallback(
    async (event) => {
      setLocalValidationErrors(null);
      if (event.target.files) {
        const newFiles = Array.from(event.target.files);
        const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
        const maxSize = 10 * 1024 * 1024;
        let currentErrorMessages = [];

        let filesCurrentlyBeingProcessed = Object.values(
          imageUploadStates
        ).filter((s) => s.loading).length;
        let totalPotentialImages =
          imageUrls.length + filesCurrentlyBeingProcessed;

        for (const file of newFiles) {
          if (totalPotentialImages >= 10) {
            currentErrorMessages.push(
              t(
                "max_10_images_error",
                "Maximum 10 images allowed. Some files were not processed."
              )
            );
            break;
          }

          if (!allowedTypes.includes(file.type)) {
            currentErrorMessages.push(
              t(
                "invalid_file_type_error",
                "{{fileName}}: Invalid file type (only PNG, JPG, WEBP).",
                { fileName: file.name }
              )
            );
          } else if (file.size > maxSize) {
            currentErrorMessages.push(
              t(
                "file_size_exceeds_error",
                "{{fileName}}: File size exceeds 10MB.",
                { fileName: file.name }
              )
            );
          } else {
            await handleImageFileSelected(file);
            totalPotentialImages++;
          }
        }

        if (currentErrorMessages.length > 0) {
          setLocalValidationErrors(currentErrorMessages.join(" "));
        }
        event.target.value = null;
      }
    },
    [handleImageFileSelected, imageUrls.length, imageUploadStates, t]
  );

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t("upload_images", "Upload Property Images")}
      </Typography>
      <Button
        variant="outlined"
        component="label"
        startIcon={<PhotoCameraIcon />}
        sx={{ mb: 2, textTransform: "none" }}
        disabled={
          imageUrls.length +
            Object.values(imageUploadStates).filter((s) => s.loading).length >=
          10
        }
      >
        {t("select_images", "Select Images")}
        <input
          type="file"
          hidden
          multiple
          accept="image/png, image/jpeg, image/webp"
          onChange={onFileChange}
        />
      </Button>
      {errors && errors.images && (
        <FormHelperText error sx={{ mb: 1 }}>
          {errors.images}
        </FormHelperText>
      )}
      {localValidationErrors && (
        <FormHelperText error sx={{ mb: 2 }}>
          {localValidationErrors}
        </FormHelperText>
      )}
      <Grid container spacing={2}>
        {imageUrls.map((url, idx) => (
          <Grid item xs={6} sm={4} md={3} key={url}>
            <Card sx={{ position: "relative" }}>
              <CardMedia
                component="img"
                height="150"
                image={url}
                alt={`Property Image ${idx + 1}`}
                sx={{ objectFit: "cover" }}
              />
              <IconButton
                onClick={() => removeImageByUrl(url)}
                size="small"
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.8)" },
                }}
                aria-label="delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Card>
          </Grid>
        ))}
        {Object.entries(imageUploadStates).map(([tempId, state]) => {
          if (!state.url && (state.loading || state.error)) {
            return (
              <Grid item xs={6} sm={4} md={3} key={tempId}>
                <Card
                  sx={{
                    height: 150,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    p: 1,
                    boxSizing: "border-box",
                    border: state.error ? "1px solid red" : "1px solid #eee",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      wordBreak: "break-all",
                      textAlign: "center",
                      mb: 0.5,
                      flexGrow: 1,
                      maxHeight: "3em",
                      overflow: "hidden",
                    }}
                  >
                    {state.fileName || "Uploading..."}
                  </Typography>
                  {state.loading && (
                    <CircularProgress size={24} sx={{ my: 1 }} />
                  )}
                  {state.error && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{
                        textAlign: "center",
                        fontSize: "0.7rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        mt: 0.5,
                      }}
                    >
                      {state.error}
                    </Typography>
                  )}
                </Card>
              </Grid>
            );
          }
          return null;
        })}
      </Grid>
      <Typography
        variant="caption"
        display="block"
        sx={{ mt: 2, color: "text.secondary" }}
      >
        {t(
          "image_upload_caption_s3",
          "Upload up to 10 images (JPEG, PNG, WEBP format, max 10MB each). Images are stored securely. The first image will be the main cover image."
        )}
      </Typography>
    </Box>
  );
};

export default Step4_Images;
