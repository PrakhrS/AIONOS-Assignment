require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Initialize the in-memory store
const store = require('./store'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Internal Service Agent backend is running.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
