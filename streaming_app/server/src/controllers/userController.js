const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
    }
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT id, email, username, role, created_at, last_login, display_name, bio, 
             avatar_url, location, website, twitter, instagram, soundcloud, spotify,
             (SELECT COUNT(*) FROM tracks WHERE user_id = $1) as tracks_uploaded,
             (SELECT COUNT(*) FROM playlists WHERE user_id = $1) as playlists_created,
             (SELECT COALESCE(SUM(play_count), 0) FROM tracks WHERE user_id = $1) as total_plays
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      username, 
      email, 
      display_name, 
      bio, 
      avatar_url, 
      location, 
      website,
      twitter,
      instagram,
      soundcloud,
      spotify
    } = req.body;

    // Check if username/email already exists (excluding current user)
    if (username || email) {
      let checkQuery = 'SELECT id FROM users WHERE (';
      const checkParams = [];
      let paramIndex = 1;

      if (username) {
        checkQuery += `username = $${paramIndex}`;
        checkParams.push(username);
        paramIndex++;
      }

      if (email) {
        if (username) checkQuery += ' OR ';
        checkQuery += `email = $${paramIndex}`;
        checkParams.push(email);
        paramIndex++;
      }

      checkQuery += `) AND id != $${paramIndex}`;
      checkParams.push(userId);

      const existingUser = await pool.query(checkQuery, checkParams);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
    }

    // Update user with extended profile fields
    const result = await pool.query(`
      UPDATE users 
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          display_name = COALESCE($3, display_name),
          bio = COALESCE($4, bio),
          avatar_url = COALESCE($5, avatar_url),
          location = COALESCE($6, location),
          website = COALESCE($7, website),
          twitter = COALESCE($8, twitter),
          instagram = COALESCE($9, instagram),
          soundcloud = COALESCE($10, soundcloud),
          spotify = COALESCE($11, spotify),
          updated_at = NOW()
      WHERE id = $12
      RETURNING id, email, username, role, display_name, bio, avatar_url, 
                location, website, twitter, instagram, soundcloud, spotify
    `, [username, email, display_name, bio, avatar_url, location, website, 
        twitter, instagram, soundcloud, spotify, userId]);

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const userId = req.user.userId;

    // Update user's avatar URL in database
    const result = await pool.query(`
      UPDATE users 
      SET avatar_url = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING avatar_url
    `, [avatarUrl, userId]);

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: `${req.protocol}://${req.get('host')}${avatarUrl}`
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Get user's favorite tracks
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite tracks
 */
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT t.*, f.created_at as favorited_at
      FROM tracks t
      JOIN favorites f ON t.id = f.track_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({ favorites: result.rows });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/favorites/{trackId}:
 *   post:
 *     summary: Add track to favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Track added to favorites
 */
router.post('/favorites/:trackId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { trackId } = req.params;

    // Check if track exists
    const trackResult = await pool.query('SELECT id FROM tracks WHERE id = $1', [trackId]);
    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Check if already favorited
    const existingFavorite = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND track_id = $2',
      [userId, trackId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(400).json({ error: 'Track already in favorites' });
    }

    // Add to favorites
    await pool.query(
      'INSERT INTO favorites (user_id, track_id, created_at) VALUES ($1, $2, NOW())',
      [userId, trackId]
    );

    res.status(201).json({ message: 'Track added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/favorites/{trackId}:
 *   delete:
 *     summary: Remove track from favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Track removed from favorites
 */
router.delete('/favorites/:trackId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { trackId } = req.params;

    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND track_id = $2',
      [userId, trackId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Track removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Get user notification settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User notification settings retrieved successfully
 */
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM user_notification_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        emailNotifications: true,
        pushNotifications: false,
        trackLikes: true,
        newFollowers: true,
        roomInvites: true,
        trackComments: false
      };
      return res.json({ settings: defaultSettings });
    }

    const settings = result.rows[0];
    res.json({
      settings: {
        emailNotifications: settings.email_notifications,
        pushNotifications: settings.push_notifications,
        trackLikes: settings.track_likes,
        newFollowers: settings.new_followers,
        roomInvites: settings.room_invites,
        trackComments: settings.track_comments
      }
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/privacy:
 *   get:
 *     summary: Get user privacy settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User privacy settings retrieved successfully
 */
router.get('/privacy', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM user_privacy_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        profileVisibility: 'public',
        showEmail: false,
        showLocation: true,
        allowDirectMessages: true,
        showOnlineStatus: false,
        showListeningActivity: true
      };
      return res.json({ settings: defaultSettings });
    }

    const settings = result.rows[0];
    res.json({
      settings: {
        profileVisibility: settings.profile_visibility,
        showEmail: settings.show_email,
        showLocation: settings.show_location,
        allowDirectMessages: settings.allow_direct_messages,
        showOnlineStatus: settings.show_online_status,
        showListeningActivity: settings.show_listening_activity
      }
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Get user's current password hash
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bcrypt = require('bcrypt');
    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/notifications:
 *   put:
 *     summary: Update notification settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               trackLikes:
 *                 type: boolean
 *               newFollowers:
 *                 type: boolean
 *               roomInvites:
 *                 type: boolean
 *               trackComments:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 */
router.put('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationSettings = req.body;

    // Create or update notification settings
    await pool.query(`
      INSERT INTO user_notification_settings (
        user_id, email_notifications, push_notifications, 
        track_likes, new_followers, room_invites, track_comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        email_notifications = EXCLUDED.email_notifications,
        push_notifications = EXCLUDED.push_notifications,
        track_likes = EXCLUDED.track_likes,
        new_followers = EXCLUDED.new_followers,
        room_invites = EXCLUDED.room_invites,
        track_comments = EXCLUDED.track_comments,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      notificationSettings.emailNotifications,
      notificationSettings.pushNotifications,
      notificationSettings.trackLikes,
      notificationSettings.newFollowers,
      notificationSettings.roomInvites,
      notificationSettings.trackComments
    ]);

    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Notification settings update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/privacy:
 *   put:
 *     summary: Update privacy settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileVisibility:
 *                 type: string
 *                 enum: [public, followers, private]
 *               showEmail:
 *                 type: boolean
 *               showLocation:
 *                 type: boolean
 *               allowDirectMessages:
 *                 type: boolean
 *               showOnlineStatus:
 *                 type: boolean
 *               showListeningActivity:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 */
router.put('/privacy', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const privacySettings = req.body;

    // Create or update privacy settings
    await pool.query(`
      INSERT INTO user_privacy_settings (
        user_id, profile_visibility, show_email, show_location,
        allow_direct_messages, show_online_status, show_listening_activity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        profile_visibility = EXCLUDED.profile_visibility,
        show_email = EXCLUDED.show_email,
        show_location = EXCLUDED.show_location,
        allow_direct_messages = EXCLUDED.allow_direct_messages,
        show_online_status = EXCLUDED.show_online_status,
        show_listening_activity = EXCLUDED.show_listening_activity,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      privacySettings.profileVisibility,
      privacySettings.showEmail,
      privacySettings.showLocation,
      privacySettings.allowDirectMessages,
      privacySettings.showOnlineStatus,
      privacySettings.showListeningActivity
    ]);

    res.json({ message: 'Privacy settings updated successfully' });
  } catch (error) {
    console.error('Privacy settings update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
