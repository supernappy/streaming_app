const { spawn } = require('child_process');
const fs = require('fs');

/**
 * Extract audio metadata using FFprobe
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<Object>} - Audio metadata including duration, bitrate, etc.
 */
function extractAudioMetadata(filePath) {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`Audio file not found: ${filePath}`));
    }

    console.log('🎵 METADATA: Extracting metadata from:', filePath);

    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);

    let output = '';
    let errorOutput = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        console.error('🔥 METADATA ERROR: FFprobe failed with code:', code);
        console.error('🔥 METADATA ERROR: Error output:', errorOutput);
        return reject(new Error(`FFprobe failed with code ${code}: ${errorOutput}`));
      }

      try {
        const metadata = JSON.parse(output);
        console.log('🎵 METADATA: Raw FFprobe output:', JSON.stringify(metadata, null, 2));

        // Extract audio stream information
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        const format = metadata.format;

        if (!audioStream) {
          return reject(new Error('No audio stream found in file'));
        }

        // Extract relevant metadata
        const result = {
          duration: parseFloat(format.duration) || null,
          bitrate: parseInt(format.bit_rate) || null,
          size: parseInt(format.size) || null,
          codec: audioStream.codec_name || null,
          sampleRate: parseInt(audioStream.sample_rate) || null,
          channels: audioStream.channels || null,
          channelLayout: audioStream.channel_layout || null,
          // Additional metadata from tags
          title: format.tags?.title || format.tags?.TITLE || null,
          artist: format.tags?.artist || format.tags?.ARTIST || null,
          album: format.tags?.album || format.tags?.ALBUM || null,
          genre: format.tags?.genre || format.tags?.GENRE || null,
          date: format.tags?.date || format.tags?.DATE || null,
          track: format.tags?.track || format.tags?.TRACK || null
        };

        console.log('🎵 METADATA: Extracted metadata:', result);
        resolve(result);
      } catch (parseError) {
        console.error('🔥 METADATA ERROR: Failed to parse FFprobe output:', parseError);
        console.error('🔥 METADATA ERROR: Raw output:', output);
        reject(new Error(`Failed to parse FFprobe output: ${parseError.message}`));
      }
    });

    ffprobe.on('error', (error) => {
      console.error('🔥 METADATA ERROR: FFprobe spawn error:', error);
      reject(new Error(`Failed to spawn FFprobe: ${error.message}`));
    });
  });
}

/**
 * Format duration from seconds to HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Validate audio file format
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<boolean>} - True if valid audio file
 */
async function validateAudioFile(filePath) {
  try {
    const metadata = await extractAudioMetadata(filePath);
    return metadata.duration > 0 && metadata.codec !== null;
  } catch (error) {
    console.error('🔥 VALIDATION ERROR:', error);
    return false;
  }
}

module.exports = {
  extractAudioMetadata,
  formatDuration,
  validateAudioFile
};
