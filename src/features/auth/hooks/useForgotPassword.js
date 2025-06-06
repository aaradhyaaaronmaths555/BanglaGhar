import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "../../../aws/CognitoConfig"; // Adjust path as needed
import axios from "axios"; // Keep axios for the validation API call

/**
 * @hook useForgotPassword
 * Handles the state and logic for the multi-step password reset process.
 * @returns {object} - Forgot password state, handlers, form data, validation status, and current step.
 */
const useForgotPassword = () => {
  const navigate = useNavigate();

  // Step management
  const [step, setStep] = useState(1); // 1: Email input, 2: OTP + New Password input

  // Form fields state
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback and loading state
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Combined loading state for simplicity
  const [openSnackbar, setOpenSnackbar] = useState(false); // For success message

  // Store CognitoUser object between steps
  const [cognitoUser, setCognitoUser] = useState(null);

  // Password validation state (for Step 2)
  const [passwordValidation, setPasswordValidation] = useState({
    hasNumber: false,
    hasSpecial: false,
    hasUppercase: false,
    hasLowercase: false,
    hasMinLength: false,
  });

  /**
   * Validates the password based on Cognito requirements.
   * @param {string} pwd - The password string to validate.
   */
  const validatePassword = useCallback((pwd) => {
    setPasswordValidation({
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasMinLength: pwd.length >= 8,
    });
  }, []);

  /**
   * Checks if all password requirements are met.
   * @returns {boolean} - True if the password is valid, false otherwise.
   */
  const isPasswordValid = useCallback(() => {
    return Object.values(passwordValidation).every(Boolean);
  }, [passwordValidation]);

  const handleEmailChange = useCallback(
    (event) => {
      setEmail(event.target.value);
      if (error) setError("");
    },
    [error]
  );

  const handleOtpChange = useCallback(
    (event) => {
      // Allow only digits and limit length if desired (e.g., 6 digits)
      const value = event.target.value.replace(/\D/g, ""); // Remove non-digits
      if (value.length <= 6) {
        setOtp(value);
      }
      if (error) setError("");
    },
    [error]
  );

  const handleNewPasswordChange = useCallback(
    (event) => {
      const newPasswordValue = event.target.value;
      setNewPassword(newPasswordValue);
      validatePassword(newPasswordValue);
      if (error) setError("");
    },
    [error, validatePassword]
  );

  const handleConfirmPasswordChange = useCallback(
    (event) => {
      setConfirmPassword(event.target.value);
      if (error) setError("");
    },
    [error]
  );

  /**
   * Validates user existence and verification via Lambda API.
   * @param {string} userEmail - The email to validate.
   * @returns {Promise<object>} - Resolves with { exists: boolean, verified: boolean } or rejects on error.
   */
  const validateUser = useCallback(async (userEmail) => {
    const apiUrl = process.env.REACT_APP_APIGATEWAY_URL;
    if (!apiUrl) {
      console.error(
        "API Gateway URL (REACT_APP_APIGATEWAY_URL) is not defined in environment variables."
      );
      throw new Error("Configuration error: Cannot validate user.");
    }

    try {
      console.log(`Validating user via API: ${apiUrl} for email: ${userEmail}`); 
      const response = await axios.post(
        apiUrl,
        { email: userEmail },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Validation API response:", response.data);
      if (
        typeof response.data?.exists !== "boolean" ||
        typeof response.data?.verified !== "boolean"
      ) {
        console.error("Unexpected API response structure:", response.data);
        throw new Error("Invalid response from validation service.");
      }
      return response.data; 
    } catch (err) {
      console.error(
        "Validation API error:",
        err.response?.data || err.message || err
      );
      throw new Error("Failed to validate user information. Please try again.");
    }
  }, []);

  /**
   * Handles Step 1: Sending the password reset code.
   * Validates email, calls the validation API, then calls Cognito forgotPassword.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSendCodeSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setIsSubmitting(true);

      if (!email) {
        setError("Please enter your email address.");
        setIsSubmitting(false);
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email address.");
        setIsSubmitting(false);
        return;
      }

      try {
        const { exists, verified } = await validateUser(email);

        if (!exists) {
          setError("No account found with this email address.");
          setIsSubmitting(false);
          return;
        }
        if (!verified) {
          setError(
            "Your account email is not verified. Cannot reset password."
          );
          setIsSubmitting(false);
          return;
        }

        const user = new CognitoUser({ Username: email, Pool: userPool });
        setCognitoUser(user);
        user.forgotPassword({
          onSuccess: () => {
            console.log("Forgot password OTP sent successfully for:", email);
            setStep(2); 
            setError(""); 
          },
          onFailure: (err) => {
            console.error("Cognito forgotPassword error:", err);
            setError(
              err.message ||
                "Failed to send verification code. Please try again."
            );
          },
        });
      } catch (err) {
        setError(err.message || "An error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, validateUser]
  );

  /**
   * Handles Step 2: Confirming the new password with the OTP.
   * Validates inputs and calls Cognito confirmPassword.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleResetPasswordSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError("");

      if (!otp || otp.length < 6) {
        setError("Please enter the 6-digit verification code.");
        return;
      }
      if (!isPasswordValid()) {
        setError("New password does not meet all requirements.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
      if (!cognitoUser) {
        setError(
          "User session lost. Please start the password reset process again."
        );
        setStep(1); 
        return;
      }

      setIsSubmitting(true);
      console.log(`Attempting password reset for: ${email} with OTP: ${otp}`);

      cognitoUser.confirmPassword(otp, newPassword, {
        onSuccess: () => {
          console.log("Password reset successful for:", email);
          setOpenSnackbar(true); // Show success message
          // Navigate to login after delay
          setTimeout(() => {
            navigate("/login");
          }, 1500);
        },
        onFailure: (err) => {
          console.error("Cognito confirmPassword error:", err);
          if (err.code === "CodeMismatchException") {
            setError(
              "Invalid verification code. Please check the code and try again."
            );
          } else if (err.code === "ExpiredCodeException") {
            setError(
              "Verification code has expired. Please request a new one by starting over."
            );
          } else if (err.code === "InvalidPasswordException") {
            setError(
              "Password does not meet requirements. Check criteria below."
            );
            validatePassword(newPassword); 
          } else if (err.code === "LimitExceededException") {
            setError("Attempt limit exceeded. Please try again later.");
          } else {
            setError(
              err.message || "Failed to reset password. Please try again."
            );
          }
        },
      });
      setIsSubmitting(false);
    },
    [
      otp,
      newPassword,
      confirmPassword,
      isPasswordValid,
      cognitoUser,
      email,
      navigate,
      validatePassword,
    ]
  ); 

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  }, []);

  return {
    step,
    email,
    otp,
    newPassword,
    confirmPassword,
    error,
    isSubmitting,
    openSnackbar,
    passwordValidation,
    isPasswordValid: isPasswordValid(),
    handleEmailChange,
    handleOtpChange,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    handleSendCodeSubmit,
    handleResetPasswordSubmit,
    handleCloseSnackbar,
  };
};

export default useForgotPassword;
