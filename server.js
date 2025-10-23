require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 9000;
const DATA_FILE = path.join(__dirname, 'investments_data.csv');

app.use(express.json());
app.use(express.static(__dirname));

// Initialize CSV file if it doesn't exist
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const header = 'investmentName,investmentType,amount,value,timestamp\n';
        fs.writeFileSync(DATA_FILE, header);
    }
}

// Read all data from CSV
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const lines = content.trim().split('\n').slice(1); // Skip header
    return lines.filter(line => line.trim()).map(line => {
        const [investmentName, investmentType, amount, value, timestamp] = line.split(',');
        return { investmentName, investmentType, amount: parseFloat(amount), value: parseFloat(value), timestamp };
    });
}

// Write data to CSV
function writeData(investmentName, investmentType, amount, value, timestamp) {
    const line = `${investmentName},${investmentType},${amount},${value},${timestamp}\n`;
    fs.appendFileSync(DATA_FILE, line);
}

// API endpoint to fetch gold/silver prices
app.get('/api/metals/:metal', async (req, res) => {
    try {
        const metal = req.params.metal.toUpperCase();

        // Option 1: Yahoo Finance (FREE, NO KEY REQUIRED, REAL-TIME)
        // Gold futures: GC=F, Silver futures: SI=F
        try {
            const yahooSymbol = metal === 'GOLD' ? 'GC=F' : 'SI=F';
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.chart && data.chart.result && data.chart.result[0]) {
                    const result = data.chart.result[0];
                    const price = result.meta.regularMarketPrice || result.meta.previousClose;

                    if (price) {
                        console.log(`${metal} price from Yahoo Finance: $${price.toFixed(2)}`);
                        res.json({ price: price });
                        return;
                    }
                }
            }
        } catch (apiError) {
            console.log('Yahoo Finance failed, trying alternative...', apiError.message);
        }

        // Option 2: Alpha Vantage (500 requests/day with free API key)
        const alphaVantageKey = process.env.ALPHA_VANTAGE_KEY;
        if (alphaVantageKey) {
            try {
                // XAU = Gold, XAG = Silver
                const avSymbol = metal === 'GOLD' ? 'XAU' : 'XAG';
                const response = await fetch(
                    `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${avSymbol}&to_currency=USD&apikey=${alphaVantageKey}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data && data['Realtime Currency Exchange Rate']) {
                        const price = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                        if (price) {
                            console.log(`${metal} price from Alpha Vantage: $${price.toFixed(2)}`);
                            // Alpha Vantage returns price per troy ounce
                            res.json({ price: price });
                            return;
                        }
                    }
                }
            } catch (apiError) {
                console.log('Alpha Vantage API failed, trying alternative...', apiError.message);
            }
        }

        // Option 3: Commodities-API.com (free tier available)
        const commoditiesApiKey = process.env.COMMODITIES_API_KEY;
        if (commoditiesApiKey) {
            try {
                const symbol = metal === 'GOLD' ? 'GOLD' : 'SILVER';
                const response = await fetch(
                    `https://commodities-api.com/api/latest?access_key=${commoditiesApiKey}&base=USD&symbols=${symbol}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.success && data.data && data.data.rates && data.data.rates[symbol]) {
                        // Commodities API returns rates, need to convert
                        const pricePerOunce = 1 / data.data.rates[symbol];
                        console.log(`${metal} price from Commodities-API: $${pricePerOunce.toFixed(2)}`);
                        res.json({ price: pricePerOunce });
                        return;
                    }
                }
            } catch (apiError) {
                console.log('Commodities-API failed...', apiError.message);
            }
        }

        // Fallback: Use realistic current prices (updated Jan 2025)
        console.warn(`Using fallback prices for ${metal}. Yahoo Finance may be temporarily unavailable.`);
        const fallbackPrices = {
            'GOLD': 2650,  // Approximate gold price per oz (Jan 2025)
            'SILVER': 30.5  // Approximate silver price per oz (Jan 2025)
        };
        res.json({ price: fallbackPrices[metal] || 0 });

    } catch (error) {
        console.error('Error fetching metal price:', error);
        // Fallback to realistic prices
        const fallbackPrices = {
            'GOLD': 2650,
            'SILVER': 30.5
        };
        res.json({ price: fallbackPrices[req.params.metal.toUpperCase()] || 0 });
    }
});

// API endpoint to fetch cryptocurrency prices
app.get('/api/crypto/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        // Using CoinGecko API (free, no API key required)
        const coinMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'LTC': 'litecoin',
            'SOL': 'solana',
            'XRP': 'ripple'
        };
        const coinId = coinMap[symbol];

        if (!coinId) {
            return res.status(400).json({ error: 'Unsupported cryptocurrency' });
        }

        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        const data = await response.json();

        if (data && data[coinId] && data[coinId].usd) {
            res.json({ price: data[coinId].usd });
        } else {
            res.status(500).json({ error: 'Failed to fetch price' });
        }
    } catch (error) {
        console.error('Error fetching crypto price:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to save investment data
app.post('/api/save', (req, res) => {
    try {
        const { investmentName, investmentType, amount, value } = req.body;
        const timestamp = new Date().toISOString();

        writeData(investmentName, investmentType, amount, value, timestamp);
        res.json({ success: true, timestamp });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get all data
app.get('/api/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get data for specific investment
app.get('/api/data/:investmentName', (req, res) => {
    try {
        const data = readData();
        const filtered = data.filter(item => item.investmentName === req.params.investmentName);
        res.json(filtered);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get list of unique investments
app.get('/api/investments', (req, res) => {
    try {
        const data = readData();
        const investments = [...new Set(data.map(item => item.investmentName))];
        res.json(investments);
    } catch (error) {
        console.error('Error reading investments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Initialize data file
initializeDataFile();

app.listen(PORT, () => {
    console.log(`Investment Price Tracker running on http://localhost:${PORT}`);
});
