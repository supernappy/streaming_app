const Minio = require('minio');
const fs = require('fs');
const path = require('path');

class StorageService {
  constructor() {
    this.minioClient = null;
    this.useLocalStorage = false;
    this.localStoragePath = path.join(__dirname, '../../uploads');
    
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      // Try to initialize MinIO
      this.minioClient = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT) || 9000,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
      });

      // Test connection by checking if bucket exists
      const bucketName = process.env.MINIO_BUCKET_NAME || 'openstream';
      const exists = await this.minioClient.bucketExists(bucketName);
      
      if (!exists) {
        await this.minioClient.makeBucket(bucketName);
        console.log(`✅ Created MinIO bucket: ${bucketName}`);
      } else {
        console.log(`🪣 MinIO bucket ready: ${bucketName}`);
      }

    } catch (error) {
      console.log('⚠️  MinIO not available, using local file storage');
      this.useLocalStorage = true;
      this.minioClient = null;
      
      // Ensure local uploads directory exists
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
        console.log(`📁 Created local storage directory: ${this.localStoragePath}`);
      }
    }
  }

  async uploadFile(fileName, filePath, contentType = 'application/octet-stream') {
    try {
      if (this.useLocalStorage) {
        return this.uploadToLocal(fileName, filePath);
      } else {
        return this.uploadToMinio(fileName, filePath, contentType);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadToMinio(fileName, filePath, contentType) {
    const bucketName = process.env.MINIO_BUCKET_NAME || 'openstream';
    
    await this.minioClient.fPutObject(bucketName, fileName, filePath, {
      'Content-Type': contentType
    });

    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || 9000;
    return `http://${endpoint}:${port}/${bucketName}/${fileName}`;
  }

  async uploadToLocal(fileName, filePath) {
    const destPath = path.join(this.localStoragePath, fileName);
    
    // Copy file to local storage
    fs.copyFileSync(filePath, destPath);
    
    // Return local URL (served by Express static middleware)
    return `/uploads/${fileName}`;
  }

  async deleteFile(fileName) {
    try {
      if (this.useLocalStorage) {
        return this.deleteFromLocal(fileName);
      } else {
        return this.deleteFromMinio(fileName);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  async deleteFromMinio(fileName) {
    const bucketName = process.env.MINIO_BUCKET_NAME || 'openstream';
    await this.minioClient.removeObject(bucketName, fileName);
  }

  async deleteFromLocal(fileName) {
    const filePath = path.join(this.localStoragePath, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getFileUrl(fileName) {
    if (this.useLocalStorage) {
      return `/uploads/${fileName}`;
    } else {
      const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const port = process.env.MINIO_PORT || 9000;
      const bucketName = process.env.MINIO_BUCKET_NAME || 'openstream';
      return `http://${endpoint}:${port}/${bucketName}/${fileName}`;
    }
  }
}

module.exports = new StorageService();
