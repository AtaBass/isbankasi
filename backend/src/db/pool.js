const { Pool } = require('pg');
require('dotenv').config();

function getPoolConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '5432', 10),
        database: (parsed.pathname || '/').slice(1) || 'isb_bank',
        user: decodeURIComponent(parsed.username || 'postgres'),
        password: parsed.password ? decodeURIComponent(parsed.password) : '', // pg requires string
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    } catch {
      return { connectionString: url, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 };
    }
  }
  return {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'isb_bank',
    user: process.env.PGUSER || process.env.USER || 'postgres',
    password: process.env.PGPASSWORD != null ? String(process.env.PGPASSWORD) : '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(getPoolConfig());

module.exports = { pool };
