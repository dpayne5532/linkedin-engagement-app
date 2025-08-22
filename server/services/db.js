const sql = require('mssql');
require('dotenv').config();

const {
  AZURE_SQL_SERVER,
  AZURE_SQL_DATABASE,
  AZURE_SQL_USER,
  AZURE_SQL_PASSWORD
} = process.env;

if (!AZURE_SQL_SERVER || typeof AZURE_SQL_SERVER !== 'string') {
  console.error('❌ Missing or invalid AZURE_SQL_SERVER in .env');
  process.exit(1);
}

const dbConfig = {
  user: AZURE_SQL_USER,
  password: AZURE_SQL_PASSWORD,
  server: AZURE_SQL_SERVER,
  database: AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Test connection immediately
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect().catch((err) => {
  console.error('❌ SQL Connection Failed:', err);
});

module.exports = {
  sql,
  pool,
  poolConnect
};
