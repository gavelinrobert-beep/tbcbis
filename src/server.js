require('dotenv').config();
const express = require('express');
const path = require('path');
const BiSScraper = require('./scraper');
const Cache = require('./cache');
const SheetsService = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Initialize services
const cache = new Cache(
  process.env.CACHE_DIR || './cache',
  parseInt(process.env.CACHE_TTL_HOURS || '24')
);

let sheetsService = null;
try {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json';
  sheetsService = new SheetsService(keyPath);
} catch (error) {
  console.warn('Google Sheets service not configured:', error.message);
}

const scraper = new BiSScraper(
  parseInt(process.env.SCRAPE_TIMEOUT_MS || '30000')
);

// Initialize cache directory
cache.init().catch(console.error);

/**
 * GET /api/classes
 * Get list of available classes and specs
 */
app.get('/api/classes', (req, res) => {
  const classes = BiSScraper.getClassesSpecs();
  const phases = BiSScraper.getPhases();
  
  res.json({
    success: true,
    data: {
      classes: classes,
      phases: phases
    }
  });
});

/**
 * GET /api/bis/:class/:spec/:phase
 * Get BiS data for specific class/spec/phase
 */
app.get('/api/bis/:class/:spec/:phase', async (req, res) => {
  const { class: className, spec: specName, phase } = req.params;
  const phaseNum = parseInt(phase);

  // Validate input
  const classes = BiSScraper.getClassesSpecs();
  if (!classes[className] || !classes[className].includes(specName)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid class or spec'
    });
  }

  if (phaseNum < 1 || phaseNum > 6) {
    return res.status(400).json({
      success: false,
      error: 'Phase must be between 1 and 6'
    });
  }

  try {
    // Check cache first
    let data = await cache.get(className, specName, phaseNum);

    if (!data) {
      // Cache miss - scrape data
      console.log(`Cache miss for ${className}/${specName}/phase${phaseNum}, scraping...`);
      data = await scraper.scrapeBiS(className, specName, phaseNum);
      
      // Store in cache
      await cache.set(className, specName, phaseNum, data);
    }

    res.json({
      success: true,
      data: data,
      cached: !!data
    });
  } catch (error) {
    console.error('Error fetching BiS data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bis/:class/:spec
 * Get BiS data for all phases of a class/spec
 */
app.get('/api/bis/:class/:spec', async (req, res) => {
  const { class: className, spec: specName } = req.params;

  // Validate input
  const classes = BiSScraper.getClassesSpecs();
  if (!classes[className] || !classes[className].includes(specName)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid class or spec'
    });
  }

  try {
    const allData = [];
    
    for (const phase of BiSScraper.getPhases()) {
      // Check cache first
      let data = await cache.get(className, specName, phase);

      if (!data) {
        // Cache miss - scrape data
        console.log(`Cache miss for ${className}/${specName}/phase${phase}, scraping...`);
        data = await scraper.scrapeBiS(className, specName, phase);
        
        // Store in cache
        await cache.set(className, specName, phase, data);
      }

      allData.push(...data);
    }

    res.json({
      success: true,
      data: allData
    });
  } catch (error) {
    console.error('Error fetching BiS data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/export
 * Export BiS data to Google Sheets
 */
app.post('/api/export', async (req, res) => {
  const { 
    spreadsheetId, 
    worksheetName = 'BiS Data',
    className,
    specName,
    phase 
  } = req.body;

  // Validate required fields
  if (!spreadsheetId) {
    return res.status(400).json({
      success: false,
      error: 'spreadsheetId is required'
    });
  }

  if (!className || !specName) {
    return res.status(400).json({
      success: false,
      error: 'className and specName are required'
    });
  }

  // Check if Sheets service is configured
  if (!sheetsService) {
    return res.status(503).json({
      success: false,
      error: 'Google Sheets service not configured. Please set up service account credentials.'
    });
  }

  try {
    let bisData = [];

    if (phase) {
      // Export specific phase
      const phaseNum = parseInt(phase);
      let data = await cache.get(className, specName, phaseNum);
      
      if (!data) {
        data = await scraper.scrapeBiS(className, specName, phaseNum);
        await cache.set(className, specName, phaseNum, data);
      }
      
      bisData = data;
    } else {
      // Export all phases
      for (const p of BiSScraper.getPhases()) {
        let data = await cache.get(className, specName, p);
        
        if (!data) {
          data = await scraper.scrapeBiS(className, specName, p);
          await cache.set(className, specName, p, data);
        }
        
        bisData.push(...data);
      }
    }

    // Export to Google Sheets
    const result = await sheetsService.exportToSheet(
      spreadsheetId,
      worksheetName,
      bisData
    );

    res.json({
      success: true,
      message: `Exported ${bisData.length} items to Google Sheets`,
      result: result
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/cache
 * Clear cache
 */
app.delete('/api/cache', async (req, res) => {
  try {
    await cache.clearAll();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    services: {
      cache: true,
      scraper: true,
      sheets: !!sheetsService
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TBC BiS Exporter server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await scraper.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await scraper.close();
  process.exit(0);
});
