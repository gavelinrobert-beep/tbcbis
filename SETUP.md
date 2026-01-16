# TBC BiS Exporter - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the TBC BiS Exporter application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Google Sheets API Setup](#google-sheets-api-setup)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Google Cloud account** - [Sign up](https://cloud.google.com/)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gavelinrobert-beep/tbcbis.git
   cd tbcbis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   If you encounter issues with Puppeteer installation, you can skip the browser download:
   ```bash
   PUPPETEER_SKIP_DOWNLOAD=true npm install
   ```

3. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

## Google Sheets API Setup

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "TBC BiS Exporter")
5. Click "Create"

### Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and then click "Enable"

### Step 3: Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - **Service account name**: `tbc-bis-exporter`
   - **Service account ID**: (auto-filled)
   - **Description**: "Service account for TBC BiS Exporter"
4. Click "Create and Continue"
5. For the role, select "Editor" or "Owner" (optional)
6. Click "Continue" and then "Done"

### Step 4: Generate Service Account Key

1. In the "Credentials" page, find your newly created service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Select "JSON" as the key type
6. Click "Create"
7. The JSON key file will be downloaded automatically

### Step 5: Configure Service Account Key

1. Rename the downloaded JSON file to `service-account-key.json`
2. Move it to the root directory of your project:
   ```bash
   mv ~/Downloads/your-project-xxxx.json ./service-account-key.json
   ```

3. Verify the file is in the correct location:
   ```bash
   ls -la service-account-key.json
   ```

### Step 6: Share Google Sheet with Service Account

1. Open your Google Sheet (or create a new one)
2. Click the "Share" button in the top-right corner
3. Copy the service account email from your `service-account-key.json` file:
   - Look for the `client_email` field
   - It should look like: `tbc-bis-exporter@your-project-id.iam.gserviceaccount.com`
4. Paste this email in the "Add people and groups" field
5. Set permission to "Editor"
6. Uncheck "Notify people" (the service account won't receive emails)
7. Click "Share"

### Step 7: Get Spreadsheet ID

1. Open your Google Sheet in a browser
2. Look at the URL, it should look like:
   ```
   https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit#gid=0
   ```
3. Copy the part between `/d/` and `/edit`:
   ```
   1a2b3c4d5e6f7g8h9i0j
   ```
4. This is your **Spreadsheet ID** - you'll need it when exporting data

## Configuration

Edit the `.env` file to customize settings:

```env
# Server Configuration
PORT=3000

# Google Sheets API Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json

# Cache Configuration
CACHE_TTL_HOURS=24
CACHE_DIR=./cache

# Scraping Configuration
SCRAPE_TIMEOUT_MS=30000

# Optional: Enable real scraping (requires Chrome/Chromium)
# ENABLE_REAL_SCRAPING=true
```

### Configuration Options

- **PORT**: Port number for the web server (default: 3000)
- **GOOGLE_SERVICE_ACCOUNT_KEY_PATH**: Path to your service account JSON file
- **CACHE_TTL_HOURS**: How long cached data remains valid (default: 24 hours)
- **CACHE_DIR**: Directory for storing cached data
- **SCRAPE_TIMEOUT_MS**: Maximum time to wait for scraping (milliseconds)
- **ENABLE_REAL_SCRAPING**: Set to 'true' to enable real web scraping (requires Chrome)

## Running the Application

### Start the Server

```bash
npm start
```

You should see:
```
TBC BiS Exporter server running on port 3000
Open http://localhost:3000 in your browser
API available at http://localhost:3000/api
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Testing

### Test the Web Interface

1. Open http://localhost:3000
2. Select a class (e.g., Warrior)
3. Select a spec (e.g., Fury)
4. Select a phase (e.g., Phase 5)
5. Click "Preview Data" - you should see BiS items appear
6. Enter your Spreadsheet ID
7. Enter a worksheet name (e.g., "Fury Warrior P5")
8. Click "Export to Google Sheets"

### Test the API

#### Check Health
```bash
curl http://localhost:3000/api/health
```

#### Get Available Classes
```bash
curl http://localhost:3000/api/classes
```

#### Get BiS Data
```bash
curl http://localhost:3000/api/bis/warrior/fury/5
```

#### Export to Google Sheets
```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "className": "warrior",
    "specName": "fury",
    "phase": 5,
    "spreadsheetId": "YOUR_SPREADSHEET_ID",
    "worksheetName": "Fury Warrior P5"
  }'
```

## Troubleshooting

### "Google Sheets service not configured" Error

**Problem**: The application can't find the service account key file.

**Solutions**:
- Verify `service-account-key.json` exists in the project root
- Check that the file path in `.env` is correct
- Ensure the JSON file is valid (use a JSON validator)

### "Permission denied" Error

**Problem**: The service account doesn't have access to your Google Sheet.

**Solutions**:
- Make sure you shared the sheet with the service account email
- Verify the service account has "Editor" permissions
- Check that you're using the correct spreadsheet ID

### "Invalid spreadsheet ID" Error

**Problem**: The spreadsheet ID is incorrect.

**Solutions**:
- Copy the ID from the Google Sheets URL (between `/d/` and `/edit`)
- Make sure there are no extra spaces or characters
- Verify the sheet exists and is accessible

### Port Already in Use

**Problem**: Port 3000 is already being used by another application.

**Solutions**:
- Change the `PORT` in `.env` to another port (e.g., 3001)
- Or stop the other application using port 3000:
  ```bash
  # Find process using port 3000
  lsof -i :3000
  # Kill the process
  kill -9 <PID>
  ```

### Scraping Returns Empty Data

**Problem**: The scraper isn't returning real data from wowsims.github.io.

**Explanation**: By default, the application uses mock data for demonstration. To enable real scraping:

1. Install Chrome/Chromium:
   ```bash
   npx puppeteer browsers install chrome
   ```

2. Enable real scraping in `.env`:
   ```env
   ENABLE_REAL_SCRAPING=true
   ```

3. Restart the server

### Module Not Found Errors

**Problem**: npm dependencies are missing.

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Exposing with ngrok

To make your local server accessible from the internet:

1. **Install ngrok**
   - Download from [ngrok.com](https://ngrok.com/)
   - Or install via package manager:
     ```bash
     # macOS
     brew install ngrok
     
     # Windows (via Chocolatey)
     choco install ngrok
     ```

2. **Start your server**
   ```bash
   npm start
   ```

3. **In a new terminal, start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Access via ngrok URL**
   - ngrok will display a public URL like: `https://abc123.ngrok.io`
   - Share this URL to access your application remotely
   - The URL remains valid as long as ngrok is running

## Next Steps

- Customize the scraper for more accurate data extraction
- Add authentication for API endpoints
- Implement data validation and error handling
- Add more export formats (CSV, Excel)
- Deploy to a cloud platform (Heroku, AWS, Google Cloud)

## Support

For issues and questions:
- Check the [README.md](README.md) for basic information
- Review the API documentation in the README
- Check server logs for error messages
- Open an issue on GitHub

## Security Notes

⚠️ **Important Security Considerations**:

- **Never commit** `service-account-key.json` to version control
- **Never commit** `.env` with real credentials
- Keep your service account key secure
- Regularly rotate service account keys
- Use environment-specific service accounts
- Limit service account permissions to minimum required
