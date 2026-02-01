/**
 * Sofia Public Transport JSON API
 * Serves GTFS static + realtime data as JSON. Data source: gtfs.sofiatraffic.bg
 */

import express from 'express';
import { getStops, getStopByCode, getTripLookup, getRoutes, getTrips } from './lib/gtfs-static.js';
import { fetchTripUpdates } from './lib/gtfs-realtime.js';
import { getArrivalsByStopCode } from './lib/arrivals.js';
import { apiDocs } from './lib/api-docs.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS for public API
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cache-Control', 'public, max-age=60');
  next();
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- API ---

/** GET /api/stops – all stops */
app.get('/api/stops', async (req, res) => {
  try {
    const stops = await getStops();
    res.json({ stops, count: stops.length });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/stops/:code – single stop by stop_code (merged if multiple IDs share same code, e.g. bus + trolley) */
app.get('/api/stops/:code', async (req, res) => {
  try {
    const stop = await getStopByCode(req.params.code);
    if (!stop) return res.status(404).json({ error: 'Stop not found' });
    res.json(stop);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/stops/:code/arrivals – predicted arrivals at stop (by stop_code; merges arrivals for all stop_ids with that code) */
app.get('/api/stops/:code/arrivals', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const { arrivals, count } = await getArrivalsByStopCode(req.params.code, { limit });
    res.json({ stopCode: req.params.code, arrivals, count });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/routes – all routes (from routes.txt) */
app.get('/api/routes', async (req, res) => {
  try {
    const routes = await getRoutes();
    res.json({ routes, count: routes.length });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/trips – trip list (from trips.txt) */
app.get('/api/trips', async (req, res) => {
  try {
    const trips = await getTrips();
    res.json({ trips, count: trips.length });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/trip-lookup – trip_id → route display info (for realtime) */
app.get('/api/trip-lookup', async (req, res) => {
  try {
    const lookup = await getTripLookup();
    res.json({ tripLookup: lookup });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/trip-updates – raw realtime trip updates (parsed protobuf) */
app.get('/api/trip-updates', async (req, res) => {
  try {
    const updates = await fetchTripUpdates();
    res.json({ tripUpdates: updates, count: updates.length });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api – API documentation (JSON) */
app.get('/api', (req, res) => {
  res.json(apiDocs);
});

/** GET /api/docs – alias for /api */
app.get('/api/docs', (req, res) => {
  res.json(apiDocs);
});

// Docs UI (must be after API routes so /api is not treated as static)
app.use(express.static('public'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`Sofia Transport API: http://localhost:${PORT}`);
});
