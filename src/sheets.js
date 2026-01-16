const { google } = require('googleapis');
const fs = require('fs').promises;

/**
 * Google Sheets Export Service
 */
class SheetsService {
  constructor(serviceAccountKeyPath) {
    this.serviceAccountKeyPath = serviceAccountKeyPath;
    this.sheets = null;
    this.auth = null;
  }

  /**
   * Initialize Google Sheets API client
   */
  async init() {
    try {
      // Read service account credentials
      const keyFileContent = await fs.readFile(this.serviceAccountKeyPath, 'utf8');
      const credentials = JSON.parse(keyFileContent);

      // Create JWT auth client
      this.auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      // Initialize sheets API
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('Google Sheets API initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets API:', error.message);
      throw new Error(`Google Sheets initialization failed: ${error.message}`);
    }
  }

  /**
   * Export BiS data to Google Sheets
   */
  async exportToSheet(spreadsheetId, worksheetName, bisData) {
    if (!this.sheets) {
      await this.init();
    }

    try {
      // Prepare header row
      const headers = [
        'Class',
        'Spec',
        'Phase',
        'Slot',
        'Item Name',
        'Item ID',
        'Source URL',
        'Scraped At'
      ];

      // Prepare data rows
      const rows = bisData.map(item => [
        item.class || '',
        item.spec || '',
        item.phase || '',
        item.slot || '',
        item.itemName || '',
        item.itemId || '',
        item.source || '',
        item.scrapedAt || new Date().toISOString()
      ]);

      // Combine headers and data
      const values = [headers, ...rows];

      // Check if worksheet exists, create if not
      await this.ensureWorksheet(spreadsheetId, worksheetName);

      // Clear existing data in the worksheet
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetId,
        range: `${worksheetName}!A:Z`,
      });

      // Write data to sheet
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${worksheetName}!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      console.log(`Exported ${rows.length} rows to ${worksheetName}`);
      return {
        success: true,
        rowsUpdated: response.data.updatedRows,
        range: response.data.updatedRange
      };
      
    } catch (error) {
      console.error('Export error:', error.message);
      throw new Error(`Failed to export to Google Sheets: ${error.message}`);
    }
  }

  /**
   * Ensure worksheet exists in spreadsheet
   */
  async ensureWorksheet(spreadsheetId, worksheetName) {
    try {
      // Get spreadsheet metadata
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });

      // Check if worksheet exists
      const sheetExists = spreadsheet.data.sheets.some(
        sheet => sheet.properties.title === worksheetName
      );

      if (!sheetExists) {
        // Create new worksheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: worksheetName
                }
              }
            }]
          }
        });
        console.log(`Created worksheet: ${worksheetName}`);
      }
    } catch (error) {
      console.error('Error ensuring worksheet:', error.message);
      throw error;
    }
  }

  /**
   * Append data to existing worksheet
   */
  async appendToSheet(spreadsheetId, worksheetName, bisData) {
    if (!this.sheets) {
      await this.init();
    }

    try {
      // Prepare data rows
      const rows = bisData.map(item => [
        item.class || '',
        item.spec || '',
        item.phase || '',
        item.slot || '',
        item.itemName || '',
        item.itemId || '',
        item.source || '',
        item.scrapedAt || new Date().toISOString()
      ]);

      // Append data to sheet
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `${worksheetName}!A:Z`,
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });

      console.log(`Appended ${rows.length} rows to ${worksheetName}`);
      return {
        success: true,
        rowsUpdated: response.data?.updates?.updatedRows || 0,
        range: response.data?.updates?.updatedRange || ''
      };
      
    } catch (error) {
      console.error('Append error:', error.message);
      throw new Error(`Failed to append to Google Sheets: ${error.message}`);
    }
  }
}

module.exports = SheetsService;
