const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { uploadToMinio } = require('./storageService');

const MEDIA_DIR = process.env.MEDIA_DIR || '/tmp/media';

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

const transcodeAudio = async (audioBuffer, trackId) => {
  return new Promise((resolve, reject) => {
    try {
      const inputPath = path.join(MEDIA_DIR, `${trackId}_input.tmp`);
      const outputDir = path.join(MEDIA_DIR, trackId);
      
      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write input buffer to temporary file
      fs.writeFileSync(inputPath, audioBuffer);

      // Generate HLS playlist and segments
      ffmpeg(inputPath)
        .audioCodec('aac')
        .audioBitrate('128k')
        .format('hls')
        .outputOptions([
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts')
        ])
        .output(path.join(outputDir, 'playlist.m3u8'))
        .on('end', async () => {
          try {
            // Upload HLS files to MinIO
            const playlistPath = path.join(outputDir, 'playlist.m3u8');
            const playlistBuffer = fs.readFileSync(playlistPath);
            
            await uploadToMinio(
              `hls/${trackId}/playlist.m3u8`,
              playlistBuffer,
              'application/vnd.apple.mpegurl'
            );

            // Upload segments
            const segmentFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.ts'));
            
            for (const segmentFile of segmentFiles) {
              const segmentPath = path.join(outputDir, segmentFile);
              const segmentBuffer = fs.readFileSync(segmentPath);
              
              await uploadToMinio(
                `hls/${trackId}/${segmentFile}`,
                segmentBuffer,
                'video/mp2t'
              );
            }

            // Clean up temporary files
            fs.unlinkSync(inputPath);
            fs.rmSync(outputDir, { recursive: true });

            const hlsUrl = `${process.env.MEDIA_BASE_URL || 'http://localhost:8081'}/hls/${trackId}/playlist.m3u8`;
            resolve(hlsUrl);
          } catch (uploadError) {
            reject(uploadError);
          }
        })
        .on('error', (err) => {
          // Clean up on error
          if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }
          if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true });
          }
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
};

const getAudioMetadata = (audioBuffer) => {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(MEDIA_DIR, `temp_${Date.now()}.tmp`);
    
    try {
      fs.writeFileSync(tempPath, audioBuffer);
      
      ffmpeg.ffprobe(tempPath, (err, metadata) => {
        // Clean up temp file
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        
        if (err) {
          reject(err);
        } else {
          resolve({
            duration: metadata.format.duration,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            codec: metadata.streams[0]?.codec_name
          });
        }
      });
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      reject(error);
    }
  });
};

module.exports = {
  transcodeAudio,
  getAudioMetadata
};
