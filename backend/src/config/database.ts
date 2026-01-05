import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let poolConfig: any;

if (databaseUrl) {
  // Detect if using Neon.tech
  const isNeon = databaseUrl.includes('neon.tech');

  poolConfig = {
    connectionString: databaseUrl,
    max: 30, // Increased from 20 for better concurrency
    min: 5, // Keep minimum connections alive
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: isNeon ? 30000 : 10000, // Neon needs more time for cold start
    // Neon requires SSL, Railway internal doesn't
    ssl: isNeon ? { rejectUnauthorized: false } : false,
    // Keep connections alive to prevent cold starts
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Performance tuning
    statement_timeout: 10000, // 10 second query timeout
    query_timeout: 10000
  };

  logger.info('Database pool configured', {
    provider: isNeon ? 'Neon.tech' : 'Railway',
    ssl: isNeon
  });
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'lunch_registration',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 30, // Increased from 20 for better concurrency
    min: 5, // Keep minimum connections alive
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Performance tuning
    statement_timeout: 10000, // 10 second query timeout
    query_timeout: 10000
  };
}

const pool = new Pool(poolConfig);

// Test connection on startup (async, non-blocking)
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('Database connection successful');
    client.release();
  } catch (err: any) {
    if (!isProduction) {
      logger.error('Database connection failed', err, {
        tip: 'Neon database may be sleeping. First request will wake it up.'
      });
    }
  }
};

// Run test connection but don't block server startup
if (!isProduction) {
  testConnection();
} else {
  logger.info('Database pool initialized. Will connect on first request.');
}

// Handle unexpected errors
pool.on('error', (err: Error) => {
  logger.error('Unexpected database error', err);
});

export default pool;
