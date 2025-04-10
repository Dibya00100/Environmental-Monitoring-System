let dataTable;

// Initialize DataTable
function initializeDataTable() {
    dataTable = $('#sensorDataTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/api/sensor-data',
            type: 'GET',
            data: function (d) {
                // Add date range filters to the request
                d.startDate = $('#startDate').val();
                d.endDate = $('#endDate').val();
            }
        },
        columns: [
            {
                data: 'timestamp',
                render: function (data) {
                    return new Date(data).toLocaleString();
                }
            },
            { data: 'temperature' },
            { data: 'humidity' },
            { data: 'airQuality' },
            { data: 'soilMoisture' }
        ],
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        pageLength: 25,
        order: [[0, 'desc']],
        language: {
            processing: "Loading data...",
            emptyTable: "No data available in table",
            zeroRecords: "No matching records found"
        }
    });
}

// Set default date range to last 24 hours
function setDefaultDateRange() {
    const end = new Date();
    const start = new Date();
    start.setHours(start.getHours() - 24);

    $('#startDate').val(start.toISOString().slice(0, 16));
    $('#endDate').val(end.toISOString().slice(0, 16));
}

// Handle filter button click
$('#filterBtn').on('click', function () {
    dataTable.ajax.reload();
});

// Initialize when document is ready
$(document).ready(function () {
    setDefaultDateRange();
    initializeDataTable();
}); 