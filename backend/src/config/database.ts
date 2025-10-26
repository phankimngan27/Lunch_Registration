import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Railway provides DATABASE_URL, local dev uses individual env vars
const isProduction = process.env.NODE_ENV === 'production';

let poolConfig: any;

const databaseUrl = process.env.DATABASE_URL;

// Log để debug
if (isProduction && databaseUrl) {
  const urlToShow = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`🔗 Using database: ${urlToShow}`);
}

if (databaseUrl) {
  // Detect if using Neon.tech (contains neon.tech in URL)
  const isNeon = databaseUrl.includes('neon.tech');
  
  poolConfig = {
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: isNeon ? 20000 : 10000, // Neon needs more time for cold start
    // Neon requires SSL, Railway internal doesn't
    ssl: isNeon ? { rejectUnauthorized: false } : false
  };
  
  console.log(`🔗 Database pool configured${isNeon ? ' (Neon.tech)' : ''}`);
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'lunch_registration',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

// Test connection on startup (async, non-blocking)
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
  } catch (err: any) {
    if (!isProduction) {
      console.error('❌ Database connection failed:', err.message);
      console.error('⚠️  Server will continue, but database operations may fail');
      console.error('💡 Tip: Neon database may be sleeping. First request will wake it up.');
    }
  }
};

// Run test connection but don't block server startup
if (!isProduction) {
  testConnection();
} else {
  console.log('📦 Database pool initialized. Will connect on first request.');
}

// Handle unexpected errors
pool.on('error', (err: Error) => {
  console.error('❌ Lỗi database không mong đợi:', err);
});

export default pool;
