let sensorChart;
const maxDataPoints = 20; // Maximum number of data points to show

// Initialize the chart
function initChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                },
                {
                    label: 'Humidity (%)',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1
                },
                {
                    label: 'Air Quality (PPM)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Soil Moisture (%)',
                    data: [],
                    borderColor: 'rgb(153, 102, 255)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update the sensor values on the dashboard
function updateSensorValues(data) {
    if (!data) return;

    document.querySelector('.temperature').textContent = `${data.temperature.toFixed(1)}°C`;
    document.querySelector('.humidity').textContent = `${data.humidity.toFixed(1)}%`;
    document.querySelector('.air-quality').textContent = `${data.airQuality} PPM`;
    document.querySelector('.soil-moisture').textContent = `${data.soilMoisture}%`;
}

// Update the chart with new data
function updateChart(data) {
    if (!data || !Array.isArray(data)) return;

    const timestamps = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    const temperatures = data.map(d => d.temperature);
    const humidities = data.map(d => d.humidity);
    const airQualities = data.map(d => d.airQuality);
    const soilMoistures = data.map(d => d.soilMoisture);

    sensorChart.data.labels = timestamps;
    sensorChart.data.datasets[0].data = temperatures;
    sensorChart.data.datasets[1].data = humidities;
    sensorChart.data.datasets[2].data = airQualities;
    sensorChart.data.datasets[3].data = soilMoistures;

    // Keep only last maxDataPoints data points
    if (sensorChart.data.labels.length > maxDataPoints) {
        sensorChart.data.labels = sensorChart.data.labels.slice(-maxDataPoints);
        sensorChart.data.datasets.forEach(dataset => {
            dataset.data = dataset.data.slice(-maxDataPoints);
        });
    }

    sensorChart.update('none');
}

// Fetch data from server
async function fetchData() {
    try {
        const response = await fetch('/api/sensor-data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data && data.length > 0) {
            updateSensorValues(data[0]); // Update with latest reading
            updateChart(data); // Update chart with historical data
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    fetchData();
    setInterval(fetchData, 2000); // Update every 2 seconds
}); 