# TBC Classic BiS Tracker & Exporter 🔥

## Description
MVP Node.js web application for tracking and exporting Best-in-Slot gear data for WoW TBC Classic. Features automated scraping from [WoWSims TBC](https://wowsims.github.io/tbc/), intelligent caching, and Google Sheets integration.

## Features
- 🔍 **Automated Scraping**: Fetch BiS data from wowsims.github.io/tbc for all classes, specs, and phases 1-6
- ⚡ **Smart Caching**: File-based JSON cache with configurable TTL to minimize scraping
- 📊 **Google Sheets Export**: Direct export to Google Sheets via service account
- 🎨 **Minimal Web UI**: Clean interface for selecting class/spec/phase and triggering exports
- 🔌 **REST API**: Full API for programmatic access
- 🌐 **ngrok Ready**: Easily expose locally for testing/demos

## Quick Start

### Prerequisites
- Node.js v16+ and npm
- Google Cloud account (for Sheets export)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gavelinrobert-beep/tbcbis.git
   cd tbcbis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to customize settings (optional).

4. **Set up Google Sheets API** (required for export feature)

   a. Create a Google Cloud project:
      - Go to [Google Cloud Console](https://console.cloud.google.com/)
      - Create a new project or select existing one

   b. Enable Google Sheets API:
      - Navigate to "APIs & Services" > "Library"
      - Search for "Google Sheets API"
      - Click "Enable"

   c. Create service account:
      - Go to "APIs & Services" > "Credentials"
      - Click "Create Credentials" > "Service Account"
      - Fill in service account details
      - Click "Create and Continue"
      - Skip optional steps and click "Done"

   d. Generate service account key:
      - Click on the created service account
      - Go to "Keys" tab
      - Click "Add Key" > "Create new key"
      - Choose "JSON" format
      - Save the downloaded file as `service-account-key.json` in project root

   e. Share your Google Sheet:
      - Open your Google Sheet
      - Click "Share"
      - Add the service account email (found in the JSON key file)
      - Give it "Editor" permissions

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open http://localhost:3000 in your browser
   - API available at http://localhost:3000/api

## Usage

### Web Interface

1. Open http://localhost:3000 in your browser
2. Select a class from the dropdown (e.g., Warrior, Mage, Priest)
3. Select a specialization (e.g., Arms, Fire, Shadow)
4. Choose a phase (1-6) or "All Phases"
5. Click "Preview Data" to fetch and view BiS items
6. Enter your Google Sheets ID and worksheet name
7. Click "Export to Google Sheets" to send data

### API Endpoints

#### Get available classes and specs
```bash
GET /api/classes
```

#### Get BiS data for specific class/spec/phase
```bash
GET /api/bis/:class/:spec/:phase

# Example
curl http://localhost:3000/api/bis/warrior/fury/5
```

#### Get BiS data for all phases
```bash
GET /api/bis/:class/:spec

# Example
curl http://localhost:3000/api/bis/mage/fire
```

#### Export to Google Sheets
```bash
POST /api/export
Content-Type: application/json

{
  "className": "warrior",
  "specName": "fury",
  "phase": 5,
  "spreadsheetId": "YOUR_SPREADSHEET_ID",
  "worksheetName": "BiS Data"
}

# Example
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "className": "warrior",
    "specName": "fury",
    "phase": 5,
    "spreadsheetId": "1a2b3c4d5e6f7g8h9i0j",
    "worksheetName": "Fury Warrior P5"
  }'
```

#### Clear cache
```bash
DELETE /api/cache

# Example
curl -X DELETE http://localhost:3000/api/cache
```

#### Health check
```bash
GET /api/health
```

## Exposing with ngrok

To expose your local server for external access:

1. **Install ngrok**
   ```bash
   # Visit https://ngrok.com/ to download and install
   ```

2. **Start ngrok tunnel**
   ```bash
   ngrok http 3000
   ```

3. **Access via ngrok URL**
   - ngrok will display a public URL (e.g., https://abc123.ngrok.io)
   - Share this URL to access your application remotely

## Configuration

All configuration is done via environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Path to Google service account JSON | `./service-account-key.json` |
| `CACHE_TTL_HOURS` | Cache time-to-live in hours | `24` |
| `CACHE_DIR` | Cache directory path | `./cache` |
| `SCRAPE_TIMEOUT_MS` | Scraping timeout in milliseconds | `30000` |

## Project Structure

```
tbcbis/
├── src/
│   ├── server.js       # Express server and API routes
│   ├── scraper.js      # Puppeteer-based scraper
│   ├── cache.js        # File-based caching layer
│   └── sheets.js       # Google Sheets API integration
├── public/
│   └── index.html      # Frontend web interface
├── cache/              # Cached data (gitignored)
├── data/               # Original Python parser
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Data Format

BiS data is normalized with the following fields:

- `class`: Character class (e.g., "warrior")
- `spec`: Specialization (e.g., "fury")
- `phase`: TBC phase number (1-6)
- `slot`: Equipment slot (e.g., "head", "chest")
- `itemName`: Item name
- `itemId`: WoW item ID
- `source`: Source URL (Wowhead link)
- `scrapedAt`: ISO timestamp of data collection

## Caching

- Cache is stored as JSON files in the `cache/` directory
- Each class/spec/phase combination is cached separately
- Default TTL is 24 hours (configurable via `CACHE_TTL_HOURS`)
- Cache can be cleared via API or by deleting files in `cache/`

## Troubleshooting

### "Google Sheets service not configured" error
- Ensure `service-account-key.json` exists in project root
- Verify the service account has access to your Google Sheet
- Check that Google Sheets API is enabled in your GCP project

### Scraping returns empty data
- The scraper includes mock data for testing purposes
- Real scraping depends on the structure of wowsims.github.io/tbc
- Check console logs for scraping errors

### Port already in use
- Change the `PORT` in `.env` to an available port
- Or stop the process using port 3000

## Development

### Running in development mode
```bash
npm run dev
```

### Updating dependencies
```bash
npm update
```

## Credits
- Thanks to [WoWSims](https://github.com/wowsims/tbc) for TBC simulation data
- Thanks to [Wowhead](https://tbc.wowhead.com/) for item database

## License
This project is licensed under the MIT License.