// Global variables
let currentChart = null;
let currentPrice = null;
let currentUser = null;

// DOM Elements
const investmentForm = document.getElementById('investmentForm');
const investmentType = document.getElementById('investmentType');
const amountGroup = document.getElementById('amountGroup');
const customValueGroup = document.getElementById('customValueGroup');
const fetchPriceBtn = document.getElementById('fetchPriceBtn');
const priceDisplay = document.getElementById('priceDisplay');
const investmentSelector = document.getElementById('investmentSelector');
const refreshBtn = document.getElementById('refreshBtn');
const chartTitle = document.getElementById('chartTitle');
const dataTableBody = document.getElementById('dataTableBody');
const mainContent = document.getElementById('mainContent');
const loginMessage = document.getElementById('loginMessage');
const loginSection = document.getElementById('loginSection');
const userSection = document.getElementById('userSection');
const userName = document.getElementById('userName');
const userPhoto = document.getElementById('userPhoto');

// Event Listeners
investmentType.addEventListener('change', handleTypeChange);
fetchPriceBtn.addEventListener('click', fetchPrice);
investmentForm.addEventListener('submit', handleSubmit);
investmentSelector.addEventListener('change', handleInvestmentSelect);
refreshBtn.addEventListener('click', refreshData);

// Initialize app
init();

async function init() {
    await checkAuth();
}

async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();

        if (data.authenticated) {
            currentUser = data.user;
            showAuthenticatedUI();
            loadInvestments();
            loadData();
        } else {
            showUnauthenticatedUI();
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        showUnauthenticatedUI();
    }
}

function showAuthenticatedUI() {
    loginSection.style.display = 'none';
    userSection.style.display = 'flex';
    mainContent.style.display = 'block';
    loginMessage.style.display = 'none';

    userName.textContent = currentUser.displayName;
    if (currentUser.photo) {
        userPhoto.src = currentUser.photo;
        userPhoto.style.display = 'block';
    } else {
        userPhoto.style.display = 'none';
    }
}

function showUnauthenticatedUI() {
    loginSection.style.display = 'block';
    userSection.style.display = 'none';
    mainContent.style.display = 'none';
    loginMessage.style.display = 'flex';
}

function handleTypeChange() {
    const type = investmentType.value;

    if (type === 'CUSTOM') {
        customValueGroup.style.display = 'block';
        fetchPriceBtn.style.display = 'none';
        amountGroup.querySelector('label').textContent = 'Amount/Quantity:';
    } else {
        customValueGroup.style.display = 'none';
        fetchPriceBtn.style.display = 'inline-block';

        if (type === 'GOLD' || type === 'SILVER') {
            amountGroup.querySelector('label').textContent = 'Amount (ounces):';
        } else if (['BTC', 'ETH', 'LTC', 'SOL', 'XRP'].includes(type)) {
            amountGroup.querySelector('label').textContent = 'Amount (coins):';
        }
    }

    priceDisplay.textContent = '';
    priceDisplay.className = 'price-display';
    currentPrice = null;
}

async function fetchPrice() {
    const type = investmentType.value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!type || !amount) {
        showMessage('Please select investment type and enter amount', 'error');
        return;
    }

    if (type === 'CUSTOM') {
        return;
    }

    priceDisplay.textContent = 'Fetching price...';
    priceDisplay.className = 'price-display';

    try {
        let endpoint;
        if (type === 'GOLD' || type === 'SILVER') {
            endpoint = `/api/metals/${type}`;
        } else {
            endpoint = `/api/crypto/${type}`;
        }

        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.price) {
            const unitPrice = data.price;
            const totalValue = unitPrice * amount;
            currentPrice = totalValue;

            showMessage(
                `Current ${type} price: $${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |
                Total value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'success'
            );
        } else {
            showMessage('Failed to fetch price', 'error');
        }
    } catch (error) {
        console.error('Error fetching price:', error);
        showMessage('Error fetching price: ' + error.message, 'error');
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const investmentName = document.getElementById('investmentName').value;
    const type = investmentType.value;
    const amount = parseFloat(document.getElementById('amount').value);

    let value;
    if (type === 'CUSTOM') {
        value = parseFloat(document.getElementById('customValue').value);
        if (!value) {
            showMessage('Please enter a custom value', 'error');
            return;
        }
    } else {
        if (!currentPrice) {
            showMessage('Please fetch the current price first', 'error');
            return;
        }
        value = currentPrice;
    }

    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                investmentName,
                investmentType: type,
                amount,
                value
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage('Investment data saved successfully!', 'success');
            investmentForm.reset();
            currentPrice = null;
            loadInvestments();
            loadData();
        } else {
            showMessage('Failed to save data', 'error');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        showMessage('Error saving data: ' + error.message, 'error');
    }
}

async function loadInvestments() {
    try {
        const response = await fetch('/api/investments');
        const investments = await response.json();

        investmentSelector.innerHTML = '<option value="all">All Investments</option>';

        investments.forEach(inv => {
            const option = document.createElement('option');
            option.value = inv;
            option.textContent = inv;
            investmentSelector.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading investments:', error);
    }
}

async function loadData() {
    const selectedInvestment = investmentSelector.value;

    try {
        let response;
        if (selectedInvestment === 'all') {
            response = await fetch('/api/data');
        } else {
            response = await fetch(`/api/data/${selectedInvestment}`);
        }

        const data = await response.json();

        updateTable(data);
        updateChart(data, selectedInvestment);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function updateTable(data) {
    dataTableBody.innerHTML = '';

    if (data.length === 0) {
        const row = dataTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No data available';
        cell.style.textAlign = 'center';
        return;
    }

    // Sort by timestamp descending
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    data.forEach(item => {
        const row = dataTableBody.insertRow();
        row.insertCell().textContent = item.investmentName;
        row.insertCell().textContent = item.investmentType;
        row.insertCell().textContent = item.amount.toFixed(8);
        row.insertCell().textContent = '$' + item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        row.insertCell().textContent = new Date(item.timestamp).toLocaleString();
    });
}

function updateChart(data, selectedInvestment) {
    if (currentChart) {
        currentChart.destroy();
    }

    if (data.length === 0) {
        return;
    }

    // Update chart title
    if (selectedInvestment === 'all') {
        chartTitle.textContent = 'Overall Portfolio Value';
    } else {
        chartTitle.textContent = `${selectedInvestment} - Value History`;
    }

    // Prepare data for chart
    let chartData;

    if (selectedInvestment === 'all') {
        // Aggregate by timestamp
        const aggregated = {};

        data.forEach(item => {
            if (!aggregated[item.timestamp]) {
                aggregated[item.timestamp] = 0;
            }
            aggregated[item.timestamp] += item.value;
        });

        chartData = Object.entries(aggregated)
            .map(([timestamp, value]) => ({
                x: new Date(timestamp),
                y: value
            }))
            .sort((a, b) => a.x - b.x);
    } else {
        // Individual investment
        chartData = data
            .map(item => ({
                x: new Date(item.timestamp),
                y: item.value
            }))
            .sort((a, b) => a.x - b.x);
    }

    // Calculate linear regression for trend line
    const trendLine = calculateTrendLine(chartData);

    const ctx = document.getElementById('investmentChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Value (USD)',
                    data: chartData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    showLine: true
                },
                {
                    label: 'Trend Line',
                    data: trendLine,
                    borderColor: '#48bb78',
                    borderWidth: 2,
                    borderDash: [10, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '$' + context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM dd, yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Value (USD)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function calculateTrendLine(data) {
    if (data.length < 2) {
        return [];
    }

    // Convert dates to numeric values (timestamps)
    const points = data.map(point => ({
        x: point.x.getTime(),
        y: point.y
    }));

    // Calculate linear regression
    const n = points.length;
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = points.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate trend line points
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;

    return [
        { x: new Date(firstX), y: slope * firstX + intercept },
        { x: new Date(lastX), y: slope * lastX + intercept }
    ];
}

function handleInvestmentSelect() {
    loadData();
}

function refreshData() {
    loadInvestments();
    loadData();
    showMessage('Data refreshed', 'success');
}

function showMessage(message, type) {
    priceDisplay.textContent = message;
    priceDisplay.className = `price-display ${type}`;
}
