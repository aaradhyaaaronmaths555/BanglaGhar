import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Keep Link for navigation
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Snackbar,
  Avatar,
  styled,
  Button, // Keep styled if using styled components here
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

// Import the new hook and form component
import useLogin from "../features/auth/hooks/useLogin"; // Adjust path as needed
import LoginForm from "../features/auth/components/LoginForm"; // Adjust path as needed

// --- Styled Components (Copied from original - Page structure specific) ---
const LoginPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper, // Use theme background
  boxShadow: "0 8px 24px rgba(43, 123, 140, 0.12)",
  borderRadius: "16px",
  padding: theme.spacing(4),
  marginTop: theme.spacing(8), // Add margin top for spacing from navbar
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  width: 56,
  height: 56,
}));

// --- Main Page Component ---

/**
 * Login Page Component
 * Renders the login page structure, including the LoginForm component.
 * Handles displaying errors and success messages from the useLogin hook.
 */
const Login = () => {
  // Use the custom hook to get state and handlers
  const navigate = useNavigate();

  const {
    email,
    password,
    error, // General error message from the hook
    isSubmitting,
    openSnackbar,
    handleEmailChange,
    handlePasswordChange,
    handleLoginSubmit,
    handleCloseSnackbar,
  } = useLogin();

  const handleCancel = () => {
    navigate("/home"); // Navigate to the home page
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ py: 8 }}>
      <LoginPaper elevation={3}>
        {" "}
        {/* Add elevation */}
        <StyledAvatar>
          <LockOutlinedIcon fontSize="large" />
        </StyledAvatar>
        <Typography
          component="h1"
          variant="h4" // Keep consistent heading size
          sx={{ mb: 3, fontWeight: 700, color: "primary.main" }} // Use theme color
        >
          Sign In
        </Typography>
        {/* Display general error messages */}
        {error && (
          <Alert
            severity="error"
            sx={{ width: "100%", mb: 2, borderRadius: "8px" }}
            aria-live="assertive" // Announce errors to screen readers
          >
            {error}
          </Alert>
        )}
        {/* Render the LoginForm component */}
        <LoginForm
          email={email}
          password={password}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          onSubmit={handleLoginSubmit}
          isSubmitting={isSubmitting}
          // error={error} // Pass error only if LoginForm needs to display field-specific errors
        />
        {/* Links for Forgot Password and Sign Up */}
        <Box
          sx={{
            width: "100%",
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2">
            <Link
              to="/forgot-password"
              style={{ color: "#2B7B8C", textDecoration: "none" }}
            >
              Forgot Password?
            </Link>
          </Typography>
          <Typography variant="body2">
          Don’t have an account? {" "}
            <Link
              to="/signup"
              style={{ color: "#2B7B8C", textDecoration: "none" }}
            >
             Sign Up
            </Link>
          </Typography>
        </Box>
        <Box
          sx={{
            width: "100%",
            mt: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="outlined"
            // Use primary color for outline - more visible & professional than inherit grey
            color="primary"
            onClick={handleCancel}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            Cancel & Go Home
          </Button>
        </Box>
      </LoginPaper>

      {/* Snackbar for success message */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Top center might be better for auth flows
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled" // Use filled for better visibility
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          Logged in successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;
