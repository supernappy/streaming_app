import React, { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const mockThemes = [
	{ key: 'light', name: 'Light', description: 'Bright and clean', color: '#fff' },
	{ key: 'dark', name: 'Dark', description: 'Sleek and modern', color: '#222' },
	{ key: 'aqua', name: 'Aqua', description: 'Cool blue vibes', color: '#4ecdc4' },
	{ key: 'sunset', name: 'Sunset', description: 'Warm orange and pink', color: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)' },
	{ key: 'forest', name: 'Forest', description: 'Deep green and earthy', color: '#228B22' },
	{ key: 'midnight', name: 'Midnight', description: 'Dark blue and purple', color: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
	{ key: 'lavender', name: 'Lavender', description: 'Soft purple and calm', color: '#b57edc' },
	{ key: 'peach', name: 'Peach', description: 'Gentle peachy tones', color: '#ffdab9' },
	{ key: 'ocean', name: 'Ocean', description: 'Deep blue and teal', color: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
	{ key: 'rose', name: 'Rose', description: 'Romantic pinks', color: '#ffb6c1' },
	{ key: 'space', name: 'Space', description: 'Cosmic dark with stars', color: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)' },
];



const RoomThemes = ({ theme, onThemeChange, loading }) => {
	const [open, setOpen] = useState(false);

	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	return (
		<Box sx={{ p: 0 }}>
			<Button
				variant="outlined"
				color="primary"
				onClick={handleOpen}
				disabled={loading}
				sx={{ mb: 2 }}
			>
				Change Theme
			</Button>
			<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					Room Themes
					<IconButton aria-label="close" onClick={handleClose}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					{loading && (
						<Typography variant="body2" sx={{ color: 'primary.main', mb: 2, textAlign: 'center' }}>
							Updating theme...
						</Typography>
					)}
					<Grid container spacing={3}>
						{mockThemes.map((t) => (
							<Grid item xs={12} sm={6} md={4} key={t.key}>
								<Card
									sx={{
										background: t.color.includes('linear-gradient') ? undefined : t.color,
										backgroundImage: t.color.includes('linear-gradient') ? t.color : undefined,
										color: ['dark', 'midnight', 'space'].includes(t.key) ? '#fff' : '#222',
										border: theme === t.key ? '2px solid #4ecdc4' : '2px solid transparent',
										boxShadow: theme === t.key ? 6 : 1,
										cursor: loading ? 'not-allowed' : 'pointer',
										opacity: loading ? 0.7 : 1,
										transition: 'all 0.2s',
										minHeight: 140,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}
									onClick={() => !loading && onThemeChange && onThemeChange(t.key)}
								>
									<CardContent sx={{ width: '100%', textAlign: 'center' }}>
										<Typography variant="h6" sx={{ fontWeight: 600 }}>
											{t.name}
										</Typography>
										<Typography variant="body2" sx={{ mb: 2 }}>
											{t.description}
										</Typography>
										<Button
											variant={theme === t.key ? 'contained' : 'outlined'}
											color="primary"
											size="small"
											sx={{ mt: 1 }}
											disabled={loading}
											onClick={(e) => {
												e.stopPropagation();
												if (!loading && onThemeChange) onThemeChange(t.key);
											}}
										>
											{theme === t.key ? 'Selected' : 'Select'}
										</Button>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				</DialogContent>
			</Dialog>
		</Box>
	);
};

export default RoomThemes;
