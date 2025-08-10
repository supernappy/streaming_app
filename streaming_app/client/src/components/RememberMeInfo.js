import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Chip
} from '@mui/material';
import { Security, Save, Speed, Visibility } from '@mui/icons-material';

const RememberMeInfo = () => {
  return (
    <Card sx={{
      background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(68, 160, 141, 0.05) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(78, 205, 196, 0.2)',
      p: 3,
      color: 'white',
      mt: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Security sx={{ color: '#4ECDC4' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4ECDC4' }}>
          Remember Me Feature
        </Typography>
        <Chip 
          label="Secure" 
          size="small" 
          sx={{ 
            background: 'rgba(78, 205, 196, 0.2)', 
            color: '#4ECDC4',
            fontSize: '0.7rem'
          }} 
        />
      </Box>

      <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
        When enabled, OpenStream securely saves your login credentials for future sessions.
      </Typography>

      <List dense>
        <ListItem sx={{ px: 0 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Save sx={{ color: '#4ECDC4', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Auto-save credentials"
            secondary="Your username and password are stored locally"
            primaryTypographyProps={{ variant: 'body2', color: 'white' }}
            secondaryTypographyProps={{ variant: 'caption', color: 'rgba(255, 255, 255, 0.6)' }}
          />
        </ListItem>
        
        <ListItem sx={{ px: 0 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Speed sx={{ color: '#4ECDC4', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Quick login"
            secondary="Automatically fill in your credentials on return visits"
            primaryTypographyProps={{ variant: 'body2', color: 'white' }}
            secondaryTypographyProps={{ variant: 'caption', color: 'rgba(255, 255, 255, 0.6)' }}
          />
        </ListItem>
        
        <ListItem sx={{ px: 0 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Visibility sx={{ color: '#4ECDC4', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Local storage only"
            secondary="Data is stored on your device, not on our servers"
            primaryTypographyProps={{ variant: 'body2', color: 'white' }}
            secondaryTypographyProps={{ variant: 'caption', color: 'rgba(255, 255, 255, 0.6)' }}
          />
        </ListItem>
      </List>

      <Typography variant="caption" sx={{ 
        color: 'rgba(255, 255, 255, 0.5)',
        fontStyle: 'italic',
        display: 'block',
        mt: 1
      }}>
        💡 You can clear saved credentials anytime from the login page
      </Typography>
    </Card>
  );
};

export default RememberMeInfo;
