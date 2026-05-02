require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initDatabase } = require('./server/config/database');
const setupWebSocket = require('./server/services/websocket');

// Import routes
const userRoutes = require('./server/routes/users');
const communityRoutes = require('./server/routes/community');
const routeRoutes = require('./server/routes/routes');
const newsRoutes = require('./server/routes/news');
const syncRoutes = require('./server/routes/sync');
const betaRoutes = require('./server/routes/betas');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
    origin: '*'
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/betas', betaRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        connectedUsers: io.engine.clientsCount
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3001;

initDatabase().then(() => {
    console.log('Database initialized');

    // Setup WebSocket
    setupWebSocket(io);

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT} (accessible from LAN)`);
        console.log(`WebSocket server ready`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});