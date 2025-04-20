import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "../aws/CognitoConfig";
import axios from "axios"; // Add axios for API calls

const ForgotPasswordPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: "#FFFFFF",
  boxShadow: "0 8px 24px rgba(43, 123, 140, 0.12)",
  borderRadius: "16px",
  padding: theme.spacing(4),
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

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  padding: theme.spacing(1.5),
  borderRadius: "8px",
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 600,
  backgroundColor: theme.palette.primary.main,
  boxShadow: "0 4px 10px rgba(43, 123, 140, 0.2)",
  "&:hover": {
    backgroundColor: "#236C7D",
    boxShadow: "0 6px 14px rgba(43, 123, 140, 0.3)",
    transform: "translateY(-2px)",
  },
}));

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + Password Reset
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [cognitoUser, setCognitoUser] = useState(null);

  // Password validation states
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasMinLength, setHasMinLength] = useState(false);

  const validatePassword = (pwd) => {
    setHasNumber(/\d/.test(pwd));
    setHasSpecial(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd));
    setHasUppercase(/[A-Z]/.test(pwd));
    setHasLowercase(/[a-z]/.test(pwd));
    setHasMinLength(pwd.length >= 8);
  };

  const handlePasswordChange = (e) => {
    const newPasswordValue = e.target.value;
    setNewPassword(newPasswordValue);
    validatePassword(newPasswordValue);
  };

  // Validate user via Lambda function
  const validateUser = async (email) => {
    try {
      const response = await axios.post(
        process.env.REACT_APP_APIGATEWAY_URL, // API Gateway invoke URL
        { email },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data; // { exists: boolean, verified: boolean }
    } catch (err) {
      console.error("Validation API error:", err);
      throw new Error("Failed to validate user. Please try again.");
    }
  };

  // Send verification code to email after validation
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (!email) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const { exists, verified } = await validateUser(email);
      console.log("Validation result:", { exists, verified }); // Debug log

      if (!exists) {
        setError("No account found with this email address");
        return;
      }

      if (!verified) {
        setError(
          "Your account is not verified. Please verify your email first."
        );
        return;
      }

      // If we reach here, the user exists and is verified
      const user = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      setCognitoUser(user);

      user.forgotPassword({
        onSuccess: () => {
          console.log("OTP sent successfully for:", email);
          setStep(2); // Move to OTP + Password reset step
          setError("");
        },
        onFailure: (err) => {
          console.error("Error during forgotPassword:", err);
          setError(
            err.message || "Failed to send verification code. Please try again."
          );
        },
      });
    } catch (err) {
      setError(
        err.message || "An error occurred during validation. Please try again."
      );
    }
  };

  // Reset password with OTP
  const handleResetPassword = (e) => {
    e.preventDefault();

    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    if (
      !hasNumber ||
      !hasSpecial ||
      !hasUppercase ||
      !hasLowercase ||
      !hasMinLength
    ) {
      setError("Password doesn't meet all requirements!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!cognitoUser) {
      setError("User session not found. Please start over.");
      return;
    }

    cognitoUser.confirmPassword(otp, newPassword, {
      onSuccess: () => {
        setOpenSnackbar(true);
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      },
      onFailure: (err) => {
        setError(err.message || "Invalid verification code. Please try again.");
      },
    });
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const isPasswordValid =
    hasNumber && hasSpecial && hasUppercase && hasLowercase && hasMinLength;

  return (
    <Container component="main" maxWidth="xs" sx={{ py: 8 }}>
      <ForgotPasswordPaper>
        <StyledAvatar>
          <LockOutlinedIcon fontSize="large" />
        </StyledAvatar>

        <Typography
          component="h1"
          variant="h4"
          sx={{ mb: 3, fontWeight: 700, color: "#2B7B8C" }}
        >
          {step === 1 ? t("forgot_password") : t("reset_password")}
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ width: "100%", mb: 2, borderRadius: "8px" }}
          >
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={step === 1 ? handleSendCode : handleResetPassword}
          sx={{ width: "100%" }}
        >
          {step === 1 && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                label={t("email")}
                autoFocus
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <StyledButton type="submit" fullWidth variant="contained">
                {t("send_verification_code")}
              </StyledButton>
            </>
          )}

          {step === 2 && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Enter the verification code sent to {email}
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                label={t("verification_code")}
                variant="outlined"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label={t("new_password")}
                type="password"
                variant="outlined"
                value={newPassword}
                onChange={handlePasswordChange}
                sx={{ mb: 1 }}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      color: isPasswordValid ? "green" : "#2B7B8C",
                      lineHeight: 1.2,
                    }}
                  >
                    {t("password_requirement")}
                  </Typography>
                }
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label={t("confirm_password")}
                type="password"
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <StyledButton type="submit" fullWidth variant="contained">
                {t("reset_password")}
              </StyledButton>
            </>
          )}
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }}>
          <Link to="/login" style={{ color: "#2B7B8C" }}>
            {t("back_to_sign_in")}
          </Link>
        </Typography>
      </ForgotPasswordPaper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ borderRadius: "8px" }}
        >
          {t("password_reset_success")} Redirecting to login...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ForgotPassword;
