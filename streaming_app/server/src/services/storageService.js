const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = 'openstream';

const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' created successfully`);
    }
  } catch (error) {
    console.error('❌ Error initializing MinIO bucket:', error);
    console.log('⚠️ MinIO not available - using local file storage instead');
    // Don't throw error to prevent server crash
    return false;
  }
};

const uploadToMinio = async (objectName, buffer, contentType) => {
  try {
    await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });

    // Generate presigned URL for access
    const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, 24 * 60 * 60); // 24 hours
    return url;
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    throw error;
  }
};

const getFromMinio = async (objectName) => {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, 24 * 60 * 60); // 24 hours
    return url;
  } catch (error) {
    console.error('Error getting from MinIO:', error);
    throw error;
  }
};

const deleteFromMinio = async (objectName) => {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName);
    console.log(`Deleted ${objectName} from MinIO`);
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    throw error;
  }
};

// Initialize bucket on startup
initializeBucket();

module.exports = {
  minioClient,
  uploadToMinio,
  getFromMinio,
  deleteFromMinio,
  BUCKET_NAME
};
