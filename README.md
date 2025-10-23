# Investment Price Tracker

A lightweight web application for tracking investments including precious metals (gold, silver) and cryptocurrencies (BTC, ETH, LTC, SOL, XRP) with automatic price fetching, historical data tracking, and graphing capabilities.

## Features

- **Google Authentication**: Secure login with Google accounts - each user has their own private data
- **Multi-Asset Support**: Track gold, silver, Bitcoin, Ethereum, Litecoin, Solana, Ripple, and custom investments
- **Automatic Price Fetching**: Real-time price lookup for supported assets via public APIs
- **Historical Data**: All entries are timestamped and stored in CSV format per user
- **Interactive Charts**: Visualize investment values over time with trend lines
- **Persistent Storage**: Data is retained across application restarts with per-user CSV files
- **Portfolio Overview**: View individual investments or overall portfolio value
- **Privacy**: Your investment data is stored privately and only accessible when you're logged in

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

3. **Configure Google OAuth** (Required):

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)

   b. Create a new project (or select an existing one)

   c. Enable the Google+ API:
      - Go to "APIs & Services" → "Library"
      - Search for "Google+ API" and enable it

   d. Create OAuth 2.0 credentials:
      - Go to "APIs & Services" → "Credentials"
      - Click "Create Credentials" → "OAuth 2.0 Client ID"
      - Configure consent screen if prompted
      - Application type: Web application
      - Add authorized redirect URIs:
        - For local development: `http://localhost:9000/auth/google/callback`
        - For production: `https://your-domain.com/auth/google/callback`

   e. Copy your Client ID and Client Secret

4. **Create `.env` file**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:9000/auth/google/callback
   SESSION_SECRET=a-random-secret-key-for-sessions
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

### First Time Setup

1. **Sign in with Google**: Click "Sign in with Google" button
2. **Authorize the app**: Allow the app to access your Google profile information
3. **Start tracking**: Once logged in, you can start adding investments

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

Each user's data is stored separately in `user_data/{user_id}.csv` files. Your data is private and only accessible when you're logged in with your Google account. Data persists across application restarts.

## Free Hosting Options

Here are the **easiest and most recommended** ways to host this application online for free:

### 1. **Render.com** (RECOMMENDED - Easiest)

**Why Render**: Simple deployment, free tier, automatic HTTPS, persistent disk support, no credit card required.

**Steps**:
1. Create a free account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (https://github.com/Braden-Long/uva-ebus4810-investment-price-tracker)
4. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: The app will automatically use Render's PORT environment variable
5. **Add Environment Variables** (Important!):
   - Go to "Environment" tab
   - Add the following variables:
     - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
     - `GOOGLE_CALLBACK_URL`: `https://your-app-name.onrender.com/auth/google/callback`
     - `SESSION_SECRET`: A random secret string (generate one)
     - `NODE_ENV`: `production`
6. **Update Google OAuth Redirect URI**:
   - Go back to Google Cloud Console
   - Add your Render callback URL to authorized redirect URIs
7. Click "Create Web Service"
8. Your app will be live at: `https://your-app-name.onrender.com`

**Note**: Free tier sleeps after 15 minutes of inactivity but wakes up automatically when accessed. Consider enabling persistent disk for data storage.

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
investment-price-tracker/
├── server.js              # Express server, OAuth, and API endpoints
├── index.html             # Main HTML structure
├── style.css              # Styling and authentication UI
├── app.js                 # Client-side JavaScript
├── package.json           # Dependencies and scripts
├── user_data/             # Per-user CSV files (created automatically)
│   └── {user_id}.csv     # Individual user data files
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/logout` - Logout current user
- `GET /api/user` - Get current user info (public)

### Investment Data (requires authentication)
- `GET /api/metals/:metal` - Fetch gold/silver prices (public)
- `GET /api/crypto/:symbol` - Fetch cryptocurrency prices (public)
- `POST /api/save` - Save investment entry (authenticated)
- `GET /api/data` - Get all investment data (authenticated)
- `GET /api/data/:investmentName` - Get data for specific investment (authenticated)
- `GET /api/investments` - Get list of unique investments (authenticated)

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js with Google OAuth 2.0
- **Session Management**: express-session
- **Charting**: Chart.js
- **APIs**:
  - **Google OAuth API** (authentication)
  - **Yahoo Finance API** (precious metals - free, no key required, unlimited)
  - **CoinGecko API** (cryptocurrency prices - free, no key required)
  - Alpha Vantage API (optional backup for metals - 500 requests/day with free key)
  - Commodities-API.com (optional backup for metals - free tier available)
- **Data Storage**: Per-user CSV file system
- **Environment Management**: dotenv

## Troubleshooting

**Issue**: Server won't start
- **Solution**: Make sure port 9000 is not in use by another application
- **Solution**: Verify all required environment variables are set in `.env`

**Issue**: "Google OAuth configured: No" in console
- **Solution**: Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- **Solution**: Verify the values are correct (no extra spaces)

**Issue**: OAuth login fails or redirects incorrectly
- **Solution**: Check that the callback URL in `.env` matches the one in Google Cloud Console
- **Solution**: Ensure the redirect URI is added to authorized URIs in Google Console

**Issue**: "Not authenticated" error when trying to save data
- **Solution**: Make sure you're logged in with Google
- **Solution**: Check browser console for session errors
- **Solution**: Clear browser cookies and try logging in again

**Issue**: Prices not fetching
- **Solution**: Check internet connection; APIs may have rate limits or temporary outages

**Issue**: Data not persisting
- **Solution**: Ensure write permissions in the project directory
- **Solution**: Check that `user_data/` directory exists and is writable

**Issue**: Chart not displaying
- **Solution**: Check browser console for JavaScript errors; ensure Chart.js CDN is accessible

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Multiple portfolios per user
- Price alerts and notifications
- Export to PDF/Excel
- Mobile app version
- Additional asset types (stocks, real estate, etc.)
- Investment performance analytics
- Portfolio diversification recommendations

## License

This project is open source and available for personal and educational use.

## Support

For issues or questions, please check the console logs in your browser (F12 → Console) or server terminal for error messages.
