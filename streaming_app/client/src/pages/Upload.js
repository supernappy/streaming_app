import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { tracksAPI } from '../services/api';

const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('=== FILE SELECTION DEBUG ===');
      console.log('Selected file:', selectedFile);
      console.log('File name:', selectedFile.name);
      console.log('File type:', selectedFile.type);
      console.log('File size:', selectedFile.size);
      
      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'application/octet-stream'];
      if (!allowedTypes.includes(selectedFile.type)) {
        console.log('File type validation failed. Allowed types:', allowedTypes);
        setError('Please select a valid audio file (MP3, WAV, FLAC, AAC, OGG)');
        return;
      }
      
      // Validate file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        console.log('File size validation failed. Size:', selectedFile.size);
        setError('File size must be less than 100MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    if (!formData.title || !formData.artist) {
      setError('Title and Artist are required');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');
    setProgress(0);

    console.log('=== UPLOAD DEBUG ===');
    console.log('File:', file);
    console.log('Form data:', formData);
    console.log('Token from localStorage:', localStorage.getItem('token'));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('audio', file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('artist', formData.artist);
      uploadFormData.append('album', formData.album);
      uploadFormData.append('genre', formData.genre);

      console.log('FormData contents:');
      for (let pair of uploadFormData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      console.log('Making API call...');
      const response = await tracksAPI.upload(uploadFormData);
      console.log('Upload response:', response.data);

      setMessage('Track uploaded successfully! Processing audio...');
      
      // Reset form
      setFormData({
        title: '',
        artist: '',
        album: '',
        genre: ''
      });
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('audio-file');
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, mb: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Upload Track
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Share your music with the OpenStream community
      </Typography>

      <Paper elevation={3} sx={{ p: 4, backgroundColor: '#1e1e1e' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {uploading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Uploading... {progress}%
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* File Upload */}
          <Card sx={{ mb: 3, backgroundColor: '#2a2a2a' }}>
            <CardContent>
              <Box
                sx={{
                  border: '2px dashed #1DB954',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(29, 185, 84, 0.1)'
                  }
                }}
                onClick={() => document.getElementById('audio-file').click()}
              >
                <CloudUpload sx={{ fontSize: 48, color: '#1DB954', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {file ? file.name : 'Click to select audio file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: MP3, WAV, FLAC, AAC, OGG (Max 100MB)
                </Typography>
                <input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Track Information */}
          <TextField
            fullWidth
            required
            label="Track Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={uploading}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            required
            label="Artist"
            name="artist"
            value={formData.artist}
            onChange={handleChange}
            disabled={uploading}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Album"
            name="album"
            value={formData.album}
            onChange={handleChange}
            disabled={uploading}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            disabled={uploading}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={uploading || !file}
            sx={{ mt: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload Track'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Upload;
