import React, { useState, useCallback } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import { Fab, Box } from '@mui/material';
import UserPropertiesModal from './UserPropertiesModal';
import PropertyChat from './PropertyChat';

const ChatManager = () => {
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const handleOpenPropertiesModal = useCallback(() => {
    setPropertiesModalOpen(true);
  }, []);

  const handleClosePropertiesModal = useCallback(() => {
    setPropertiesModalOpen(false);
    setSelectedProperty(null);
  }, []);

  const handleSelectProperty = useCallback((property) => {
    setSelectedProperty(property);
    setPropertiesModalOpen(false); // Close the property modal when a property is selected
  }, []);

  return (
    <>
      {/* Chat Icon */}
      <Box sx={{ position: 'fixed', bottom: 16, left: 16 }}>
        <Fab color="primary" onClick={handleOpenPropertiesModal}>
          <ChatIcon />
        </Fab>
      </Box>
      {/* User Properties Modal */}
      <UserPropertiesModal
        open={propertiesModalOpen}
        onClose={handleClosePropertiesModal}
        onSelectProperty={handleSelectProperty}
      />
      {/* Property Chat */}
      {selectedProperty && (
        <PropertyChat
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </>
  );
};

export default ChatManager;