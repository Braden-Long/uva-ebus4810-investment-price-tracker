require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 9000;
const USER_DATA_DIR = path.join(__dirname, 'user_data');

// Trust proxy - required for Render and other hosting platforms
app.set('trust proxy', 1);

// Create user_data directory if it doesn't exist
if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR);
}

app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:9000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Store user profile
    const user = {
        id: profile.id,
        email: profile.emails[0].value,
        displayName: profile.displayName,
        photo: profile.photos && profile.photos[0] ? profile.photos[0].value : null
    };
    return done(null, user);
}));

// Static files served after auth setup
app.use(express.static(__dirname));

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
}

// Get user data file path
function getUserDataFile(userId) {
    return path.join(USER_DATA_DIR, `${userId}.csv`);
}

// Initialize CSV file if it doesn't exist
function initializeDataFile(userId) {
    const dataFile = getUserDataFile(userId);
    if (!fs.existsSync(dataFile)) {
        const header = 'investmentName,investmentType,amount,value,timestamp\n';
        fs.writeFileSync(dataFile, header);
    }
}

// Read all data from CSV for specific user
function readData(userId) {
    const dataFile = getUserDataFile(userId);
    if (!fs.existsSync(dataFile)) {
        return [];
    }
    const content = fs.readFileSync(dataFile, 'utf-8');
    const lines = content.trim().split('\n').slice(1); // Skip header
    return lines.filter(line => line.trim()).map(line => {
        const [investmentName, investmentType, amount, value, timestamp] = line.split(',');
        return { investmentName, investmentType, amount: parseFloat(amount), value: parseFloat(value), timestamp };
    });
}

// Write data to CSV for specific user
function writeData(userId, investmentName, investmentType, amount, value, timestamp) {
    initializeDataFile(userId);
    const dataFile = getUserDataFile(userId);
    const line = `${investmentName},${investmentType},${amount},${value},${timestamp}\n`;
    fs.appendFileSync(dataFile, line);
}

// Rate limiting for updates - stores last update time per user per investment
// Format: Map<userId-investmentName, timestamp>
const updateRateLimits = new Map();
const RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

// Check if update is allowed (server-side rate limiting)
function canUpdate(userId, investmentName) {
    const key = `${userId}-${investmentName}`;
    const lastUpdate = updateRateLimits.get(key);

    if (!lastUpdate) {
        return { allowed: true };
    }

    const timeSinceUpdate = Date.now() - lastUpdate;
    if (timeSinceUpdate >= RATE_LIMIT_MS) {
        return { allowed: true };
    }

    const timeRemaining = RATE_LIMIT_MS - timeSinceUpdate;
    const minutesRemaining = Math.ceil(timeRemaining / 60000);
    return {
        allowed: false,
        minutesRemaining
    };
}

// Record update time (server-side tracking)
function recordUpdate(userId, investmentName) {
    const key = `${userId}-${investmentName}`;
    updateRateLimits.set(key, Date.now());
}

// Fetch current price for investment type
async function fetchInvestmentPrice(investmentType) {
    try {
        if (investmentType === 'GOLD' || investmentType === 'SILVER') {
            const metal = investmentType.toUpperCase();

            // Try Yahoo Finance first
            try {
                const yahooSymbol = metal === 'GOLD' ? 'GC=F' : 'SI=F';
                const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data?.chart?.result?.[0]) {
                        const price = data.chart.result[0].meta.regularMarketPrice ||
                                     data.chart.result[0].meta.previousClose;
                        if (price) return price;
                    }
                }
            } catch (err) {
                console.log('Yahoo Finance failed for price fetch');
            }

            // Fallback prices if APIs fail
            return metal === 'GOLD' ? 2650 : 30.5;

        } else if (['BTC', 'ETH', 'LTC', 'SOL', 'XRP'].includes(investmentType)) {
            const coinMap = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'LTC': 'litecoin',
                'SOL': 'solana',
                'XRP': 'ripple'
            };
            const coinId = coinMap[investmentType];

            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const data = await response.json();

            if (data?.[coinId]?.usd) {
                return data[coinId].usd;
            }

            throw new Error('Failed to fetch crypto price');
        } else {
            throw new Error('Cannot auto-update CUSTOM investment types');
        }
    } catch (error) {
        throw error;
    }
}

// Authentication routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.redirect('/');
    });
});

// Get current user
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                displayName: req.user.displayName,
                photo: req.user.photo
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// API endpoint to fetch gold/silver prices (no auth required)
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

// API endpoint to save investment data (requires authentication)
app.post('/api/save', isAuthenticated, (req, res) => {
    try {
        const { investmentName, investmentType, amount, value } = req.body;
        const timestamp = new Date().toISOString();
        const userId = req.user.id;

        writeData(userId, investmentName, investmentType, amount, value, timestamp);
        res.json({ success: true, timestamp });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to update investment price (requires authentication + rate limiting)
app.post('/api/update', isAuthenticated, async (req, res) => {
    try {
        const { investmentName } = req.body;
        const userId = req.user.id;

        if (!investmentName) {
            return res.status(400).json({ error: 'Investment name is required' });
        }

        // SERVER-SIDE RATE LIMITING - prevents code injection attacks
        const rateLimitCheck = canUpdate(userId, investmentName);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                error: `Please wait ${rateLimitCheck.minutesRemaining} minutes before updating again`,
                minutesRemaining: rateLimitCheck.minutesRemaining
            });
        }

        // Get the latest entry for this investment to find amount and type
        const data = readData(userId);
        const investmentEntries = data.filter(item => item.investmentName === investmentName);

        if (investmentEntries.length === 0) {
            return res.status(404).json({ error: 'Investment not found' });
        }

        // Get the most recent entry
        const latestEntry = investmentEntries.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        )[0];

        const { investmentType, amount } = latestEntry;

        // Cannot update CUSTOM investments (no API to fetch price)
        if (investmentType === 'CUSTOM') {
            return res.status(400).json({ error: 'Cannot auto-update custom investments' });
        }

        // Fetch current price
        const unitPrice = await fetchInvestmentPrice(investmentType);
        const totalValue = unitPrice * amount;

        // Save new entry with current timestamp
        const timestamp = new Date().toISOString();
        writeData(userId, investmentName, investmentType, amount, totalValue, timestamp);

        // Record update time (server-side tracking)
        recordUpdate(userId, investmentName);

        res.json({
            success: true,
            timestamp,
            unitPrice,
            totalValue,
            investmentType,
            amount
        });

    } catch (error) {
        console.error('Error updating investment:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get all data (requires authentication)
app.get('/api/data', isAuthenticated, (req, res) => {
    try {
        const userId = req.user.id;
        const data = readData(userId);
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get data for specific investment (requires authentication)
app.get('/api/data/:investmentName', isAuthenticated, (req, res) => {
    try {
        const userId = req.user.id;
        const data = readData(userId);
        const filtered = data.filter(item => item.investmentName === req.params.investmentName);
        res.json(filtered);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get list of unique investments (requires authentication)
app.get('/api/investments', isAuthenticated, (req, res) => {
    try {
        const userId = req.user.id;
        const data = readData(userId);
        const investments = [...new Set(data.map(item => item.investmentName))];
        res.json(investments);
    } catch (error) {
        console.error('Error reading investments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Investment Price Tracker running on http://localhost:${PORT}`);
    console.log(`Google OAuth configured: ${process.env.GOOGLE_CLIENT_ID ? 'Yes' : 'No'}`);
});
