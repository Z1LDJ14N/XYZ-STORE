const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// Import routes
const apiRoutes = require('./api');
app.use('/api', apiRoutes);

// Serve static files
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'XYZ AI Server Running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 XYZ AI Server running on port ${PORT}`);
});
