const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Enhanced CORS configuration
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://asusdibyajyoti:M4-QF-jANcwtzNP@cluster0.6isyaus.mongodb.net/environmental_monitoring?retryWrites=true&w=majority';

// Ensure the connection string starts with mongodb:// or mongodb+srv://
if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    console.error('Invalid MongoDB connection string. Must start with mongodb:// or mongodb+srv://');
    process.exit(1);
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        // Start the server only after MongoDB connection is established
        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n=== Server Started ===');
            console.log(`Server is running on port ${PORT}`);
            console.log('Access the web interface at:');
            console.log(`- Local: http://localhost:${PORT}`);
            console.log('========================\n');
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Sensor Data Schema
const sensorDataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    airQuality: Number,
    soilMoisture: Number,
    timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// API Routes
app.post('/api/sensor-data', async (req, res) => {
    try {
        console.log('\n=== New Sensor Data Received ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Client IP:', req.ip);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Data:', JSON.stringify(req.body, null, 2));
        console.log('Request Method:', req.method);
        console.log('Request URL:', req.originalUrl);

        const { temperature, humidity, airQuality, soilMoisture } = req.body;

        // Validate the received data
        if (typeof temperature !== 'number' || typeof humidity !== 'number' || typeof airQuality !== 'number') {
            throw new Error('Invalid sensor data format');
        }

        const newData = new SensorData({
            temperature,
            humidity,
            airQuality,
            soilMoisture
        });

        await newData.save();
        console.log('Data saved to MongoDB successfully');
        console.log('================================\n');

        res.status(201).json(newData);
    } catch (error) {
        console.error('Error saving sensor data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Single endpoint for sensor data that handles both real-time and historical data
app.get('/api/sensor-data', async (req, res) => {
    try {
        // Handle DataTables request
        if (req.query.draw) {
            const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

            const query = {
                timestamp: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            const totalRecords = await SensorData.countDocuments({});
            const filteredRecords = await SensorData.countDocuments(query);
            const data = await SensorData.find(query)
                .sort({ timestamp: -1 })
                .skip(parseInt(req.query.start) || 0)
                .limit(parseInt(req.query.length) || 25);

            res.json({
                draw: parseInt(req.query.draw),
                recordsTotal: totalRecords,
                recordsFiltered: filteredRecords,
                data: data
            });
        }
        // Handle real-time data request
        else {
            const limit = parseInt(req.query.limit) || 100;
            const data = await SensorData.find()
                .sort({ timestamp: -1 })
                .limit(limit);
            res.json(data);
        }
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
}); 