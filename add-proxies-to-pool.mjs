#!/usr/bin/env node

/**
 * Script to add the best available free proxies to the pool
 * Run this script to manually promote high-quality proxies
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.join(
  process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming'),
  'omniroute',
  'storage.sqlite'
);

console.log('Database path:', DB_PATH);

try {
  const db = new Database(DB_PATH, { readonly: true });

  // Get statistics by source
  console.log('\n=== Proxy Statistics by Source ===');
  const stats = db.prepare(`
    SELECT
      source,
      COUNT(*) as count,
      ROUND(AVG(quality_score), 2) as avg_quality,
      MIN(quality_score) as min_quality,
      MAX(quality_score) as max_quality,
      SUM(CASE WHEN in_pool = 1 THEN 1 ELSE 0 END) as in_pool_count
    FROM free_proxies
    GROUP BY source
  `).all();

  console.table(stats);

  // Get best available proxies (not in pool, quality >= 50)
  console.log('\n=== Best Available Proxies (Quality >= 50, Not in Pool) ===');
  const bestProxies = db.prepare(`
    SELECT
      id,
      source,
      host,
      port,
      type,
      country_code,
      quality_score,
      latency_ms,
      anonymity,
      in_pool
    FROM free_proxies
    WHERE in_pool = 0
      AND quality_score >= 50
    ORDER BY quality_score DESC, latency_ms ASC
    LIMIT 20
  `).all();

  if (bestProxies.length === 0) {
    console.log('No proxies found with quality >= 50');

    // Show what's available
    console.log('\n=== Available Proxies (any quality) ===');
    const available = db.prepare(`
      SELECT
        id,
        source,
        host,
        port,
        type,
        country_code,
        quality_score,
        latency_ms,
        in_pool
      FROM free_proxies
      WHERE in_pool = 0
      ORDER BY quality_score DESC
      LIMIT 10
    `).all();

    console.table(available);
  } else {
    console.table(bestProxies);
  }

  db.close();

} catch (error) {
  console.error('Error:', error.message);
  console.error('\nMake sure OmniRoute is not running and the database is not locked.');
}
