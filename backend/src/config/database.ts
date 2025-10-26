import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Railway provides DATABASE_URL, local dev uses individual env vars
const isProduction = process.env.NODE_ENV === 'production';

let poolConfig: any;

// Always prefer DATABASE_PUBLIC_URL for Railway
const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

// Log để debug
if (isProduction) {
  const urlToShow = databaseUrl?.replace(/:[^:@]+@/, ':****@') || 'none';
  console.log(`🔗 Using database: ${urlToShow}`);
}

if (databaseUrl) {
  // Force use internal URL only
  const useInternalUrl = process.env.DATABASE_URL;
  const finalUrl = useInternalUrl || databaseUrl;
  
  poolConfig = {
    connectionString: finalUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Railway internal network không cần SSL
    ssl: false
  };
  
  console.log(`🔗 Using ${finalUrl.includes('railway.internal') ? 'internal' : 'public'} database connection`);
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

// Test connection on startup (non-blocking for production)
if (!isProduction) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('❌ Không thể kết nối database:', err.message);
      console.error('Kiểm tra lại thông tin trong file .env');
      process.exit(1);
    }
    if (client) {
      console.log('✅ Kết nối database thành công');
      release();
    }
  });
} else {
  // Production: skip initial connection test, connect on first request
  console.log('📦 Database pool initialized. Will connect on first request.');
}

// Handle unexpected errors
pool.on('error', (err: Error) => {
  console.error('❌ Lỗi database không mong đợi:', err);
});

export default pool;
