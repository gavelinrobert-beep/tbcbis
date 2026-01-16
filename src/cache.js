const fs = require('fs').promises;
const path = require('path');

/**
 * File-based cache with TTL support
 */
class Cache {
  constructor(cacheDir = './cache', ttlHours = 24) {
    this.cacheDir = cacheDir;
    this.ttlMs = ttlHours * 60 * 60 * 1000;
  }

  /**
   * Initialize cache directory
   */
  async init() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Generate cache key from parameters
   */
  getCacheKey(className, specName, phase) {
    return `${className}_${specName}_phase${phase}`;
  }

  /**
   * Get cache file path
   */
  getCacheFilePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * Get data from cache
   */
  async get(className, specName, phase) {
    const key = this.getCacheKey(className, specName, phase);
    const filePath = this.getCacheFilePath(key);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const cached = JSON.parse(data);

      // Check if cache is expired
      const now = Date.now();
      if (now - cached.timestamp > this.ttlMs) {
        console.log(`Cache expired for ${key}`);
        await this.delete(className, specName, phase);
        return null;
      }

      console.log(`Cache hit for ${key}`);
      return cached.data;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Cache read error for ${key}:`, error);
      }
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set(className, specName, phase, data) {
    const key = this.getCacheKey(className, specName, phase);
    const filePath = this.getCacheFilePath(key);

    const cached = {
      timestamp: Date.now(),
      data: data
    };

    try {
      await fs.writeFile(filePath, JSON.stringify(cached, null, 2), 'utf8');
      console.log(`Cached data for ${key}`);
    } catch (error) {
      console.error(`Cache write error for ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(className, specName, phase) {
    const key = this.getCacheKey(className, specName, phase);
    const filePath = this.getCacheFilePath(key);

    try {
      await fs.unlink(filePath);
      console.log(`Deleted cache for ${key}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Cache delete error for ${key}:`, error);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.cacheDir, file));
        }
      }
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get all cached keys
   */
  async getAllKeys() {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }
}

module.exports = Cache;
