import React from "react";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Typography,
} from "@mui/material"; 
import { styled } from "@mui/material/styles"; 
import CloseIcon from "@mui/icons-material/Close"; 
import { Link as RouterLink, useLocation } from "react-router-dom"; 
import HomeIcon from "@mui/icons-material/Home"; 
import InfoIcon from "@mui/icons-material/Info"; 
import ContactsIcon from "@mui/icons-material/Contacts"; 
import HomeWorkIcon from "@mui/icons-material/HomeWork"; 
import AddBusinessIcon from "@mui/icons-material/AddBusiness"; 
import SellIcon from "@mui/icons-material/Sell"; 
import StorefrontIcon from "@mui/icons-material/Storefront"; 
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; 
import ChatIcon from "@mui/icons-material/Chat";
import { useTranslation } from "react-i18next";

const DrawerItem = styled(ListItemButton)(({ theme, selected }) => ({
  paddingTop: theme.spacing(1.5), 
  paddingBottom: theme.spacing(1.5), 
  paddingLeft: theme.spacing(3), 
  paddingRight: theme.spacing(3), 
  marginBottom: theme.spacing(0.5), 
  borderRadius: "8px", 
  margin: theme.spacing(0, 1), 
  backgroundColor: selected ? theme.palette.action.selected : "transparent", 
  "&:hover": {
    backgroundColor: selected 
      ? theme.palette.action.selected 
      : theme.palette.action.hover,
  },
  "& .MuiListItemIcon-root": {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary, 
    minWidth: "40px", 
  },
  "& .MuiListItemText-primary": {
    fontWeight: selected ? 600 : 500, 
    color: selected ? theme.palette.primary.main : theme.palette.text.primary, 
  },
}));

const MobileDrawer = ({
  mobileOpen, 
  handleDrawerToggle, 
  navLinks, 
  activeLink, 
  handleNavigate, 
  onListPropertyClick, 
}) => {
  const drawerWidth = 260; 
  const location = useLocation(); 
  const { t } = useTranslation(); 

  const handleLinkClick = (path) => {
    handleNavigate(path); 
    handleDrawerToggle(); 
  };

  const handleListPropertyDrawerClick = () => {
    //
    onListPropertyClick(); 
    handleDrawerToggle(); 
  };

  return (
    <Drawer 
      variant="temporary" 
      open={mobileOpen} 
      onClose={handleDrawerToggle} 
      ModalProps={{ keepMounted: true }} 
      sx={{
        display: { xs: "block", md: "none" }, 
        "& .MuiDrawer-paper": {
          
          boxSizing: "border-box", 
          width: drawerWidth, 
          borderTopRightRadius: 16, 
          borderBottomRightRadius: 16, 
          boxShadow: 3, 
          border: "none", 
        },
      }}
    >
      <Box sx={{ textAlign: "center", p: 2 }}>
        {" "}
        <Box 
          sx={{
            
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
          }}
        >
          <Typography 
            variant="h5" 
            onClick={() => handleLinkClick("/")} 
            sx={{
              cursor: "pointer", 
              color: "primary.main", 
              fontWeight: "bold", 
            }}
          >
            BanglaGhor 
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            {" "}
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ my: 1 }} /> 
      </Box>
      <List sx={{ px: 1 }}>
        {" "}
        {navLinks.map(
          (
            link 
          ) =>
            link.id !== "properties" && ( 
              <ListItem key={link.id} disablePadding>
                {" "}
                <DrawerItem 
                  selected={activeLink === link.id} 
                  onClick={() => handleLinkClick(link.path)} 
                >
                  <ListItemIcon>{link.icon}</ListItemIcon>
                  <ListItemText primary={link.label} />
                </DrawerItem>
              </ListItem>
            )
        )}
        <Divider sx={{ my: 1 }} /> 
        <Typography //
          variant="caption" 
          sx={{ pl: 3, color: "text.secondary", textTransform: "uppercase" }} 
        >
          {t("nav_properties")} 
        </Typography>
        <ListItem disablePadding>
          {" "}
          <DrawerItem 
            selected={location.pathname.startsWith("/properties/buy")} 
            onClick={() => handleLinkClick("/properties/buy")} 
          >
            <ListItemIcon>
              {" "}
              <StorefrontIcon /> 
            </ListItemIcon>
            <ListItemText primary={t("nav_buy")} />
          </DrawerItem>
        </ListItem>
        <ListItem disablePadding>
          {" "}
          <DrawerItem 
            selected={location.pathname.startsWith("/properties/rent")} 
            onClick={() => handleLinkClick("/properties/rent")} 
          >
            <ListItemIcon>
              {" "}
              <SellIcon /> 
            </ListItemIcon>
            <ListItemText primary={t("nav_rent")} /> 
          </DrawerItem>
        </ListItem>
        <ListItem disablePadding>
          {" "}
          {/* */}
          <DrawerItem //
            selected={location.pathname.startsWith("/properties/sold")}
            onClick={() => handleLinkClick("/properties/sold")}
          >
            <ListItemIcon>
              {" "}
              <CheckCircleOutlineIcon />
            </ListItemIcon>
            <ListItemText primary={t("nav_sold")} /> 
          </DrawerItem>
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          {" "}
          <DrawerItem onClick={handleListPropertyDrawerClick}>
            {" "}
            <ListItemIcon>
              {" "}
              <AddBusinessIcon />
            </ListItemIcon>
            <ListItemText primary={t("list_property")} />
          </DrawerItem>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default MobileDrawer;
