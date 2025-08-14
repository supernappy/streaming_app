const { Pool } = require('pg');
const Redis = require('redis');

// Database connection with connection pooling
const createDatabasePool = () => {
  const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  };

  return new Pool(config);
};

// Redis connection with retry logic
const createRedisClient = () => {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️ Redis URL not provided, using memory cache');
    return null;
  }

  const client = Redis.createClient({
    url: process.env.REDIS_URL,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        return new Error('Redis server connection refused');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Redis retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  return client;
};

// Initialize connections
const db = createDatabasePool();
const redis = createRedisClient();

// Test database connection
const testDatabaseConnection = async () => {
  try {
    const client = await db.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  db,
  redis,
  testDatabaseConnection
};