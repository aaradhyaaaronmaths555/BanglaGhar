// src/admin/hooks/useManageUsers.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { debounce } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useSnackbar } from "../../context/SnackbarContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export const useManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const { idToken, user: loggedInUser } = useAuth();
  const { showSnackbar } = useSnackbar();

  // State for Pagination, Sorting, Filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [actionLoading, setActionLoading] = useState({}); // State for specific user action loading

  // Debounced search/filter reset page logic
  const debouncedResetPage = useCallback(
    debounce(() => setPage(0), 500),
    [setPage]
  );

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    debouncedResetPage();
  };

  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
    debouncedResetPage();
  };

  // Fetch Users Effect
  useEffect(() => {
    const fetchUsers = async () => {
      if (!idToken) return;
      setLoading(true);
      setFetchError(null);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        sort: orderBy,
        order,
        search: searchTerm,
      });
      if (filterStatus) params.append("status", filterStatus);

      try {
        const response = await axios.get(
          `${API_BASE_URL}/admin/users?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        setUsers(response.data.users || []);
        setTotalUsers(response.data.totalUsers || 0);
      } catch (err) {
        console.error("Error fetching users:", err);
        setFetchError(err.response?.data?.message || "Failed to fetch users.");
        setUsers([]);
        setTotalUsers(0);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [idToken, page, rowsPerPage, orderBy, order, searchTerm, filterStatus]);

  // Handlers for Sorting, Pagination
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handler for User Status Updates (Block/Unblock, Admin, Approval)
  const handleUserUpdate = useCallback(
    async (userId, field, value) => {
      // Basic checks (token, self-update prevention)
      if (!idToken) {
        showSnackbar("Authentication token missing.", "error");
        return;
      }
      const targetUser = users.find((u) => u._id === userId);
      const isSelf = loggedInUser?.email === targetUser?.email;
      if (
        isSelf &&
        (field === "isAdmin" ||
          (field === "accountStatus" && value === "blocked"))
      ) {
        showSnackbar(
          `Cannot ${
            field === "isAdmin"
              ? "change own admin status"
              : "block own account"
          }.`,
          "warning"
        );
        return;
      }

      setActionLoading((prev) => ({ ...prev, [userId]: true }));
      try {
        const response = await axios.put(
          `${API_BASE_URL}/admin/users/${userId}/status`,
          { [field]: value },
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        // Update local state optimistically or based on response
        setUsers((currentUsers) =>
          currentUsers.map(
            (user) =>
              user._id === userId ? { ...user, ...response.data.user } : user // Use response data
          )
        );
        // Show success feedback
        let successMessage = `User ${field} updated successfully.`;
        // ... (generate specific success messages as before) ...
        showSnackbar(successMessage, "success");
      } catch (err) {
        console.error(`Error updating user ${userId} field ${field}:`, err);
        showSnackbar(
          err.response?.data?.message || `Failed to update user ${field}.`,
          "error"
        );
        // Optionally revert optimistic update here if needed
      } finally {
        setActionLoading((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [
      idToken,
      users,
      loggedInUser?.email,
      showSnackbar,
      setUsers,
      setActionLoading,
    ]
  ); // Add dependencies

  // Return state and handlers needed by the UI
  return {
    users,
    loading,
    fetchError,
    page,
    rowsPerPage,
    totalUsers,
    order,
    orderBy,
    searchTerm,
    filterStatus,
    actionLoading,
    loggedInUser,
    handleSearchChange,
    handleFilterStatusChange,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
    handleUserUpdate,
  };
};
