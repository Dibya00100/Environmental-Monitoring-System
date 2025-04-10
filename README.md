# Environmental Monitoring System

A web interface for displaying and storing environmental sensor data from an ESP32-based monitoring system.

## Features

- Real-time display of sensor data (Temperature, Humidity, Air Quality, Soil Moisture)
- Historical data visualization using charts
- RESTful API for sensor data storage
- Responsive web interface

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ems
```

3. Start MongoDB service

4. Run the application:

```bash
npm start
```

5. Access the web interface at `http://localhost:3000`

## ESP32 Integration

To send data from your ESP32 to this web interface, use the following endpoint:

```
POST http://your-server-address:3000/api/sensor-data
```

Request body format:

```json
{
  "temperature": 25.5,
  "humidity": 60,
  "airQuality": 500,
  "soilMoisture": 45
}
```

## License

MIT
