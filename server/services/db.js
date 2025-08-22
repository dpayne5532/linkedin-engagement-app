const sql = require('mssql');

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    enableArithAbort: true,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('SQL errors', err);
});

module.exports = {
  sql,
  poolConnect,
  pool,
};
