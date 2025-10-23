# Investment Price Tracker

A lightweight web application for tracking investments including precious metals (gold, silver) and cryptocurrencies (BTC, ETH, LTC, SOL, XRP) with automatic price fetching, historical data tracking, and graphing capabilities.

## Features

- **Multi-Asset Support**: Track gold, silver, Bitcoin, Ethereum, Litecoin, Solana, Ripple, and custom investments
- **Automatic Price Fetching**: Real-time price lookup for supported assets via public APIs
- **Historical Data**: All entries are timestamped and stored in CSV format
- **Interactive Charts**: Visualize investment values over time with trend lines
- **Persistent Storage**: Data is retained across application restarts in a CSV file
- **Portfolio Overview**: View individual investments or overall portfolio value

## Prerequisites

- Node.js (version 14.0.0 or higher)
- npm (comes with Node.js)

## Installation

1. **Navigate to the project directory**:
   ```bash
   cd "Credit Threader"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Getting Real-Time Gold/Silver Prices

**Good news**: The app uses **Yahoo Finance by default** - it's FREE, requires NO API KEY, and provides real-time accurate prices!

### No Setup Required
Simply run the app and it will automatically fetch live gold/silver prices from Yahoo Finance. No registration, no API keys, unlimited requests.

### Optional Backup APIs (Only if Yahoo Finance fails)

If you want additional backup sources, you can optionally add these API keys:

**Alpha Vantage** (500 requests/day free):
1. Sign up at [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Add to `.env`:
   ```bash
   ALPHA_VANTAGE_KEY=your-key-here
   ```

**Commodities-API.com** (free tier available):
1. Sign up at [Commodities-API](https://commodities-api.com/)
2. Add to `.env`:
   ```bash
   COMMODITIES_API_KEY=your-key-here
   ```

These are **completely optional** - the app works great with just Yahoo Finance!

## Running Locally

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Access the application**:
   Open your browser and go to:
   ```
   http://localhost:9000
   ```

3. **Stop the server**:
   Press `Ctrl+C` in the terminal

## How to Use

### Adding an Investment Entry

1. **Enter Investment Name**: Give your investment a unique name (e.g., "My Bitcoin Holdings")
2. **Select Investment Type**: Choose from:
   - Gold (ounces)
   - Silver (ounces)
   - BTC, ETH, LTC, SOL, XRP (coins)
   - Custom/Other (for manual entries)
3. **Enter Amount**: Specify the quantity you own
4. **Fetch Price** (for auto-priced assets): Click "Fetch Current Price" to get the latest market value
5. **Save Entry**: Click "Save Entry" to record the data point

### Viewing Data

- **Select Investment**: Use the dropdown to view specific investments or "All Investments"
- **Charts**: Automatically updates to show value history with trend lines
- **Table**: Displays all historical entries with timestamps

### Data Storage

All data is stored in `investments_data.csv` in the project directory. This file persists across application restarts.

## Free Hosting Options

Here are the **easiest and most recommended** ways to host this application online for free:

### 1. **Render.com** (RECOMMENDED - Easiest)

**Why Render**: Simple deployment, free tier, automatic HTTPS, no credit card required.

**Steps**:
1. Create a free account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (or upload code)
4. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: The app will automatically use Render's PORT environment variable
5. Click "Create Web Service"
6. Your app will be live at: `https://your-app-name.onrender.com`

**Note**: Free tier sleeps after 15 minutes of inactivity but wakes up automatically when accessed.

### 2. **Railway.app** (Very Easy)

**Why Railway**: Simple, generous free tier, automatic deployments.

**Steps**:
1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Railway auto-detects Node.js and deploys
4. Your app will be live with a Railway-provided URL

### 3. **Cyclic.sh** (Simple for Node.js)

**Why Cyclic**: Designed specifically for Node.js apps, very simple deployment.

**Steps**:
1. Create account at [cyclic.sh](https://cyclic.sh)
2. Click "Deploy" and connect GitHub
3. Select your repository
4. Cyclic automatically deploys and provides a URL

### 4. **Glitch.com** (Easiest for Beginners)

**Why Glitch**: Instant deployment, edit code directly in browser, no Git required.

**Steps**:
1. Go to [glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub"
3. Or manually upload files
4. App is instantly live at: `https://your-project-name.glitch.me`

### Important Notes for Deployment

**Port Configuration**: When deploying, the application needs to use the hosting provider's assigned port. Add this to the top of `server.js`:

```javascript
const PORT = process.env.PORT || 9000;
```

This is already included in the provided `server.js` file.

**CSV File Persistence**:
- Some free hosts have ephemeral file systems (files reset on restart)
- For production use, consider upgrading to:
  - PostgreSQL/MySQL database
  - Cloud storage (AWS S3, Google Cloud Storage)
  - Render/Railway persistent disk (may require paid tier)

**API Rate Limits**:
- **Cryptocurrencies**: CoinGecko API (free, no key required, ~50 calls/min)
- **Precious Metals**: Yahoo Finance (free, no key required, unlimited requests)
- **Optional Backups**:
  - Alpha Vantage: 500 requests/day (free key)
  - Commodities-API: Free tier available
  - Fallback prices if all APIs unavailable

## Project Structure

```
Credit Threader/
├── server.js              # Express server and API endpoints
├── index.html             # Main HTML structure
├── style.css              # Styling
├── app.js                 # Client-side JavaScript
├── package.json           # Dependencies and scripts
├── investments_data.csv   # Data storage (created automatically)
└── README.md             # This file
```

## API Endpoints

- `GET /api/metals/:metal` - Fetch gold/silver prices
- `GET /api/crypto/:symbol` - Fetch cryptocurrency prices
- `POST /api/save` - Save investment entry
- `GET /api/data` - Get all investment data
- `GET /api/data/:investmentName` - Get data for specific investment
- `GET /api/investments` - Get list of unique investments

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Charting**: Chart.js
- **APIs**:
  - **Yahoo Finance API** (precious metals - free, no key required, unlimited)
  - **CoinGecko API** (cryptocurrency prices - free, no key required)
  - Alpha Vantage API (optional backup for metals - 500 requests/day with free key)
  - Commodities-API.com (optional backup for metals - free tier available)
- **Data Storage**: CSV file system
- **Environment Management**: dotenv

## Troubleshooting

**Issue**: Server won't start
- **Solution**: Make sure port 9000 is not in use by another application

**Issue**: Prices not fetching
- **Solution**: Check internet connection; APIs may have rate limits or temporary outages

**Issue**: Data not persisting
- **Solution**: Ensure write permissions in the project directory

**Issue**: Chart not displaying
- **Solution**: Check browser console for JavaScript errors; ensure Chart.js CDN is accessible

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication
- Multiple portfolios
- Price alerts
- Export to PDF/Excel
- Mobile app version
- Additional asset types (stocks, real estate, etc.)

## License

This project is open source and available for personal and educational use.

## Support

For issues or questions, please check the console logs in your browser (F12 → Console) or server terminal for error messages.
