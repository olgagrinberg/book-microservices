const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

// Serve static files
app.use(express.static('.'));
app.use('/src', express.static('src'));

// API proxy for development (optional)
app.use('/api/*', (req, res) => {
  res.status(502).json({
    error: "API Proxy not configured",
    message: "Please start the book-service backend",
    suggestion: "Run BookService configuration in IntelliJ"
  });
});

// Serve frontend for all routes (SPA support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend development server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔧 Make sure book-service is running on http://localhost:8080`);
});