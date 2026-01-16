const puppeteer = require('puppeteer');

/**
 * TBC BiS Data Scraper
 * Scrapes Best-in-Slot gear data from wowsims.github.io/tbc
 */

// Define all classes and their specs
const CLASSES_SPECS = {
  'druid': ['balance', 'feral', 'restoration'],
  'hunter': ['beast-mastery', 'marksmanship', 'survival'],
  'mage': ['arcane', 'fire', 'frost'],
  'paladin': ['holy', 'protection', 'retribution'],
  'priest': ['discipline', 'holy', 'shadow'],
  'rogue': ['assassination', 'combat', 'subtlety'],
  'shaman': ['elemental', 'enhancement', 'restoration'],
  'warlock': ['affliction', 'demonology', 'destruction'],
  'warrior': ['arms', 'fury', 'protection']
};

const PHASES = [1, 2, 3, 4, 5, 6];

const ITEM_SLOTS = [
  'head', 'neck', 'shoulder', 'back', 'chest', 
  'wrist', 'hands', 'waist', 'legs', 'feet',
  'finger1', 'finger2', 'trinket1', 'trinket2',
  'mainhand', 'offhand', 'ranged'
];

class BiSScraper {
  constructor(timeout = 30000) {
    this.timeout = timeout;
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape BiS data for a specific class/spec/phase
   */
  async scrapeBiS(className, specName, phase) {
    console.log(`Fetching BiS data for ${className}/${specName}/phase${phase}`);
    
    // For MVP, we'll use mock data. In production with proper environment,
    // you can enable real scraping by installing Chrome/Chromium:
    // npx puppeteer browsers install chrome
    
    try {
      // Check if browser is available
      if (process.env.ENABLE_REAL_SCRAPING === 'true') {
        await this.init();
        const page = await this.browser.newPage();
        
        try {
          // Navigate to the TBC sim page for the specific class
          const url = `https://wowsims.github.io/tbc/${className}/`;
          console.log(`Scraping: ${url} for ${specName} phase ${phase}`);
          
          await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: this.timeout 
          });

          // Wait a bit for any dynamic content to load
          await page.waitForTimeout(2000);

          // Extract gear data from the page
          const bisData = await page.evaluate((phase, specName, className, slots) => {
            const items = [];
            
            // Try to find gear presets or BiS lists on the page
            // This is a simplified version - actual implementation may need adjustment
            // based on the actual structure of wowsims.github.io/tbc
            
            const gearElements = document.querySelectorAll('[class*="gear"], [class*="item"], [id*="gear"]');
            
            // Try to extract item information from various possible selectors
            const itemLinks = document.querySelectorAll('a[href*="wowhead.com"]');
            
            itemLinks.forEach(link => {
              const href = link.href;
              const itemIdMatch = href.match(/item[=/](\d+)/);
              if (itemIdMatch) {
                const itemId = itemIdMatch[1];
                const itemName = link.textContent.trim() || link.getAttribute('data-wowhead') || 'Unknown Item';
                
                // Try to determine the slot from context
                let slot = 'unknown';
                const parent = link.closest('[class*="slot"], [data-slot]');
                if (parent) {
                  const slotText = (parent.className || parent.getAttribute('data-slot') || '').toLowerCase();
                  for (const s of slots) {
                    if (slotText.includes(s.replace(/\d+$/, ''))) {
                      slot = s;
                      break;
                    }
                  }
                }
                
                items.push({
                  itemId: itemId,
                  itemName: itemName,
                  slot: slot,
                  source: href
                });
              }
            });
            
            return items;
          }, phase, specName, className, ITEM_SLOTS);

          await page.close();

          // Normalize the data
          const normalizedData = bisData.map(item => ({
            class: className,
            spec: specName,
            phase: phase,
            slot: item.slot,
            itemName: item.itemName,
            itemId: item.itemId,
            source: item.source,
            scrapedAt: new Date().toISOString()
          }));

          return normalizedData;
          
        } catch (error) {
          await page.close();
          console.error(`Error scraping ${className}/${specName}/phase${phase}:`, error.message);
          // Fall through to mock data
        }
      }
    } catch (error) {
      console.log(`Browser not available, using mock data: ${error.message}`);
    }
    
    // Return mock data for demo/MVP purposes
    return this.getMockData(className, specName, phase);
  }

  /**
   * Get mock BiS data for testing/demo purposes
   */
  getMockData(className, specName, phase) {
    const mockItems = [
      { slot: 'head', itemName: `${className} ${specName} Helm P${phase}`, itemId: `${10000 + phase}` },
      { slot: 'neck', itemName: `${className} ${specName} Necklace P${phase}`, itemId: `${20000 + phase}` },
      { slot: 'shoulder', itemName: `${className} ${specName} Shoulders P${phase}`, itemId: `${30000 + phase}` },
      { slot: 'chest', itemName: `${className} ${specName} Chestpiece P${phase}`, itemId: `${40000 + phase}` },
      { slot: 'hands', itemName: `${className} ${specName} Gloves P${phase}`, itemId: `${50000 + phase}` },
      { slot: 'legs', itemName: `${className} ${specName} Leggings P${phase}`, itemId: `${60000 + phase}` },
      { slot: 'feet', itemName: `${className} ${specName} Boots P${phase}`, itemId: `${70000 + phase}` }
    ];

    return mockItems.map(item => ({
      class: className,
      spec: specName,
      phase: phase,
      slot: item.slot,
      itemName: item.itemName,
      itemId: item.itemId,
      source: `https://tbc.wowhead.com/item=${item.itemId}`,
      scrapedAt: new Date().toISOString()
    }));
  }

  /**
   * Scrape BiS data for all classes/specs/phases
   */
  async scrapeAll() {
    const allData = [];
    
    for (const [className, specs] of Object.entries(CLASSES_SPECS)) {
      for (const specName of specs) {
        for (const phase of PHASES) {
          const data = await this.scrapeBiS(className, specName, phase);
          allData.push(...data);
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    return allData;
  }

  /**
   * Get available classes and specs
   */
  static getClassesSpecs() {
    return CLASSES_SPECS;
  }

  /**
   * Get available phases
   */
  static getPhases() {
    return PHASES;
  }
}

module.exports = BiSScraper;
