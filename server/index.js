const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const { poolConnect } = require('./services/db');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await poolConnect;
    console.log(`✅ Connected to Azure SQL`);
  } catch (err) {
    console.error('❌ SQL Connection Failed:', err);
  }

  console.log(`Server listening on port ${PORT}`);
});