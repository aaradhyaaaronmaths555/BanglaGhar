import React, { useState } from "react"; 
import {
  Container,
  Paper,
  Typography,
  Box, 
  CircularProgress, 
  Alert, 
  Snackbar,
  Button,
  Grid, 
  Divider, 
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import useProfileManagement from "./hooks/useProfileManagement";
import ProfilePicture from "./components/ProfilePicture";
import ProfileDisplay from "./components/ProfileDisplay";
import ProfileActions from "./components/ProfileActions";
import EditNameDialog from "./components/EditNameDialog";
import ChangePasswordDialog from "./components/ChangePasswordDialog";
import DeleteAccountDialog from "./components/DeleteAccountDialog";

const ProfilePaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3, 4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginTop: theme.spacing(4),
  width: "100%",
}));

const UserProfilePage = () => {
  const { t } = useTranslation();
  const {
    profileData,
    loading,
    error,
    isUpdating,
    dialogError,
    editNameOpen,
    passwordOpen,
    deleteOpen,
    editNameValue,
    oldPassword,
    newPassword,
    setEditNameValue,
    setOldPassword,
    setNewPassword,
    openEditNameDialog,
    closeEditNameDialog,
    openPasswordDialog,
    closePasswordDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleUpdateName,
    handleChangePassword,
    handleDeleteAccount,
    handleUpdatePicture,
  } = useProfileManagement();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const handleShowSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading && !profileData) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Container>
    );
  }
  if (error && !profileData) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: "center" }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          onClick={() => window.history.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      {/* --- Profile Info Section --- */}
      {/* Render profile section even if profileData is initially null but not loading/error */}
      <ProfilePaper elevation={3}>
        <Typography
          component="h1"
          variant="h4"
          sx={{ mb: 2, fontWeight: 700, color: "text.primary" }}
        >
          {t("nav_profile")}
        </Typography>
        {/* Conditionally render profile picture only if profileData exists */}
        {profileData && (
          <ProfilePicture
            picture={profileData.picture} 
            name={profileData.displayName || profileData.name} 
            onPictureChange={handleUpdatePicture}
            isUpdating={isUpdating}
            onError={(msg) => handleShowSnackbar(msg, "error")}
          />
        )}
        {/* Display general error if needed */}
        {error && (
          <Alert severity="warning" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}
        {/* Conditionally render profile display */}
        {profileData && <ProfileDisplay profileData={profileData} />}
        <ProfileActions
          onEditName={openEditNameDialog}
          onChangePassword={openPasswordDialog}
          onDeleteAccount={openDeleteDialog}
        />
      </ProfilePaper>

      {/* --- Dialogs --- */}
      <EditNameDialog
        open={editNameOpen}
        onClose={closeEditNameDialog}
        currentName={editNameValue}
        onNameChange={setEditNameValue}
        onSave={handleUpdateName}
        isLoading={isUpdating}
        error={dialogError}
      />
      <ChangePasswordDialog
        open={passwordOpen}
        onClose={closePasswordDialog}
        oldPassword={oldPassword}
        newPassword={newPassword}
        onOldPasswordChange={setOldPassword}
        onNewPasswordChange={setNewPassword}
        onSave={handleChangePassword}
        isLoading={isUpdating}
        error={dialogError}
      />
      <DeleteAccountDialog
        open={deleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteAccount}
        isLoading={isUpdating}
        error={dialogError}
      />

      {/* --- Snackbar --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserProfilePage;
