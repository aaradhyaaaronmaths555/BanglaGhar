import React, { useEffect, useState, useRef } from 'react';
import { Modal, Box, List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import axios from 'axios';

const UserPropertiesModal = ({ open, onClose, onSelectProperty }) => {
  const [properties, setProperties] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus(); // Set focus to the modal
    }

    return () => {
      // Ensure no lingering effects when the modal closes
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const fetchProperties = async () => {
        try {
          const token = localStorage.getItem('idToken');
          const response = await axios.get('http://localhost:5001/api/user-profiles/me/listings', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProperties(response.data);
        } catch (error) {
          console.error('Error fetching properties:', error);
        }
      };

      fetchProperties();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="user-properties-modal"
      aria-describedby="user-properties-list"
    >
      <Box
        ref={modalRef}
        tabIndex={-1}
        sx={{
          width: 600,
          maxHeight: '80%',
          bgcolor: 'background.paper',
          p: 2,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          overflowY: 'auto',
          borderRadius: 2,
        }}
      >
        <Typography id="user-properties-modal" variant="h6" gutterBottom>
          My Properties
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List id="user-properties-list">
          {properties.map((property) => (
            <ListItem button key={property._id} onClick={() => onSelectProperty(property)}>
              <ListItemText primary={property.title} secondary={property.cityTown} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Modal>
  );
};

export default UserPropertiesModal;