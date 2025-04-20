import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Input,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import { userPool } from "../aws/CognitoConfig";
import { useAuth } from "../pages/AuthContext";

const ProfilePaper = styled(Paper)(({ theme }) => ({
  backgroundColor: "#FFFFFF",
  boxShadow: "0 8px 24px rgba(43, 123, 140, 0.12)",
  borderRadius: "16px",
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginTop: theme.spacing(8),
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(4),
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  width: 80,
  height: 80,
  marginBottom: theme.spacing(2),
  position: "relative",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  padding: theme.spacing(1.5),
  borderRadius: "8px",
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 600,
  backgroundColor: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: "#236C7D",
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1),
      fontSize: "0.95rem",
    },
  },
}));

const UserProfile = () => {
  const { t } = useTranslation();
  const { logout } = useAuth(); // Use logout from AuthContext
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = () => {
    setLoading(true);
    const currentUser = userPool.getCurrentUser();

    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (err) {
          setError("Failed to get user session: " + err.message);
          setLoading(false);
          return;
        }

        currentUser.getUserAttributes((err, attributes) => {
          if (err) {
            setError("Failed to get user attributes: " + err.message);
            setLoading(false);
            return;
          }

          const userAttributes = attributes.reduce((acc, attr) => {
            acc[attr.getName()] = attr.getValue();
            return acc;
          }, {});

          setUserData({
            name: userAttributes.name || "Not set",
            email: userAttributes.email || "Not set",
            sub: userAttributes.sub || "Not set",
            email_verified: userAttributes.email_verified || "false",
            picture: userAttributes.picture || null, // Custom attribute for profile pic
          });
          setEditName(userAttributes.name || "");
          setProfilePic(userAttributes.picture || null);
          setLoading(false);
        });
      });
    } else {
      setError("No user currently signed in");
      setLoading(false);
    }
  };

  const handleEditOpen = () => setEditOpen(true);
  const handleEditClose = () => setEditOpen(false);

  const handleSaveChanges = () => {
    setLoading(true);
    const currentUser = userPool.getCurrentUser();

    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (err) {
          setError("Failed to get session: " + err.message);
          setLoading(false);
          return;
        }

        const attributeList = [
          new CognitoUserAttribute({
            Name: "name",
            Value: editName,
          }),
        ];

        currentUser.updateAttributes(attributeList, (err, result) => {
          if (err) {
            setError("Failed to update profile: " + err.message);
            setLoading(false);
            return;
          }
          setUserData((prev) => ({ ...prev, name: editName }));
          setEditOpen(false);
          setLoading(false);
        });
      });
    }
  };

  const handlePasswordOpen = () => setPasswordOpen(true);
  const handlePasswordClose = () => setPasswordOpen(false);

  const handleChangePassword = () => {
    setLoading(true);
    const currentUser = userPool.getCurrentUser();

    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (err) {
          setError("Failed to get session: " + err.message);
          setLoading(false);
          return;
        }

        currentUser.changePassword(oldPassword, newPassword, (err, result) => {
          if (err) {
            setError("Failed to change password: " + err.message);
            setLoading(false);
            return;
          }
          setPasswordOpen(false);
          setOldPassword("");
          setNewPassword("");
          setLoading(false);
        });
      });
    }
  };

  const handleDeleteOpen = () => setDeleteOpen(true);
  const handleDeleteClose = () => setDeleteOpen(false);

  const handleDeleteAccount = () => {
    setLoading(true);
    const currentUser = userPool.getCurrentUser();

    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (err) {
          setError("Failed to get session: " + err.message);
          setLoading(false);
          return;
        }

        currentUser.deleteUser((err, result) => {
          if (err) {
            setError("Failed to delete account: " + err.message);
            setLoading(false);
            return;
          }
          logout(); // Use AuthContext logout
          setDeleteOpen(false);
          setLoading(false);
          window.location.href = "/"; // Redirect to home after deletion
        });
      });
    }
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePic(base64String);
        updateProfilePic(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfilePic = (base64String) => {
    setLoading(true);
    const currentUser = userPool.getCurrentUser();

    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (err) {
          setError("Failed to get session: " + err.message);
          setLoading(false);
          return;
        }

        const attributeList = [
          new CognitoUserAttribute({
            Name: "picture",
            Value: base64String,
          }),
        ];

        currentUser.updateAttributes(attributeList, (err, result) => {
          if (err) {
            setError("Failed to update profile picture: " + err.message);
            setLoading(false);
            return;
          }
          setUserData((prev) => ({ ...prev, picture: base64String }));
          setLoading(false);
        });
      });
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    document.body.style.backgroundColor = darkMode ? "#fff" : "#333";
    document.body.style.color = darkMode ? "#000" : "#fff";
  };

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ px: 2 }}>
      <ProfilePaper elevation={3}>
        <Box sx={{ position: "relative" }}>
          <StyledAvatar src={profilePic}>
            {!profilePic && <PersonIcon fontSize="large" />}
          </StyledAvatar>
          <IconButton
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: "#fff",
            }}
            component="label"
          >
            <PhotoCamera />
            <Input
              type="file"
              accept="image/*"
              sx={{ display: "none" }}
              onChange={handleProfilePicChange}
            />
          </IconButton>
        </Box>

        <Typography
          component="h1"
          variant="h4"
          sx={{ mb: 3, fontWeight: 700, color: "#2B7B8C" }}
        >
          {userData.name}
        </Typography>

        <Box sx={{ width: "100%" }}>
          <List>
            <ListItem>
              <ListItemIcon>
                <PersonIcon sx={{ color: "#2B7B8C" }} />
              </ListItemIcon>
              <ListItemText
                primary={t("name")}
                secondary={userData.name}
                primaryTypographyProps={{ fontWeight: 600, color: "#2B7B8C" }}
                secondaryTypographyProps={{
                  fontSize: "1.1rem",
                  color: "#000000",
                  sx: { wordBreak: "break-word", overflowWrap: "break-word" },
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <EmailIcon sx={{ color: "#2B7B8C" }} />
              </ListItemIcon>
              <ListItemText
                primary={t("email")}
                secondary={userData.email}
                primaryTypographyProps={{ fontWeight: 600, color: "#2B7B8C" }}
                secondaryTypographyProps={{
                  fontSize: "1.1rem",
                  color: "#000000",
                  sx: { wordBreak: "break-word", overflowWrap: "break-word" },
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <PersonIcon sx={{ color: "#2B7B8C" }} />
              </ListItemIcon>
              <ListItemText
                primary={t("user_id")}
                secondary={userData.sub}
                primaryTypographyProps={{ fontWeight: 600, color: "#2B7B8C" }}
                secondaryTypographyProps={{
                  fontSize: "1.1rem",
                  color: "#000000",
                  sx: { wordBreak: "break-word" },
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <EmailIcon sx={{ color: "#2B7B8C" }} />
              </ListItemIcon>
              <ListItemText
                primary={t("email_verified")}
                secondary={
                  userData.email_verified === "true" ? t("yes") : t("no")
                }
                primaryTypographyProps={{ fontWeight: 600, color: "#2B7B8C" }}
                secondaryTypographyProps={{
                  fontSize: "1.1rem",
                  color: "#000000",
                }}
              />
            </ListItem>
          </List>

          <StyledButton
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEditOpen}
            fullWidth
          >
            {t("edit_name")}
          </StyledButton>

          <StyledButton
            variant="contained"
            startIcon={<LockIcon />}
            onClick={handlePasswordOpen}
            fullWidth
          >
            {t("change_password")}
          </StyledButton>

          <StyledButton
            variant="contained"
            startIcon={<Brightness4Icon />}
            onClick={toggleDarkMode}
            fullWidth
          >
            {t("toggle")} {darkMode ? t("light") : t("dark")} {t("mode")}
          </StyledButton>

          <StyledButton
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteOpen}
            fullWidth
          >
            {t("delete_account")}
          </StyledButton>
        </Box>
      </ProfilePaper>

      {/* Edit Name Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>{t("edit_profile")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("name")}
            fullWidth
            variant="outlined"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {t("email_note")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>{t("cancel")}</Button>
          <Button onClick={handleSaveChanges} variant="contained">
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onClose={handlePasswordClose}>
        <DialogTitle>{t("change_password")}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label={t("old_password")}
            type="password"
            fullWidth
            variant="outlined"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <TextField
            margin="dense"
            label={t("new_password")}
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordClose}>{t("cancel")}</Button>
          <Button onClick={handleChangePassword} variant="contained">
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose}>
        <DialogTitle>{t("delete_account")}</DialogTitle>
        <DialogContent>
          <Typography>{t("delete_warning")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>{t("cancel")}</Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
