/**
 * GTFS Static data fetcher – mirrors SofiaBusDock GTFSStaticService.
 * Base URL: https://gtfs.sofiatraffic.bg/api/v1/static?file=<filename>
 * Files: stops.txt, routes.txt, trips.txt. Response may be ZIP or raw CSV.
 */

import AdmZip from 'adm-zip';
import { parseCSV } from './csv.js';

const BASE_URL = 'https://gtfs.sofiatraffic.bg/api/v1/static';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const cache = new Map(); // file -> { data, expires }

function isZip(buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

/**
 * @param {string} filename - e.g. 'stops.txt'
 * @returns {Promise<Buffer>}
 */
async function fetchFile(filename) {
  const cached = cache.get(filename);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  const url = `${BASE_URL}?file=${encodeURIComponent(filename)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) {
    throw new Error(`GTFS static ${filename}: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  let payload = buffer;
  if (res.headers.get('content-type')?.includes('zip') || isZip(buffer)) {
    const zip = new AdmZip(buffer);
    const entry = zip.getEntry(filename);
    if (!entry) {
      throw new Error(`GTFS static: ${filename} not found in ZIP`);
    }
    payload = entry.getData();
  }

  cache.set(filename, { data: payload, expires: Date.now() + CACHE_TTL_MS });
  return payload;
}

/**
 * @returns {Promise<import('./types.js').BusStop[]>}
 */
export async function getStops() {
  const raw = await fetchFile('stops.txt');
  const { rows } = parseCSV(raw);
  const stops = rows
    .filter((row) => row.stop_id?.trim())
    .map((row) => ({
      id: row.stop_id,
      code: row.stop_code ?? '',
      name: row.stop_name ?? 'Unknown stop',
      latitude: parseFloat(row.stop_lat) || 0,
      longitude: parseFloat(row.stop_lon) || 0,
      description: row.stop_desc ?? '',
      title: (row.stop_code?.trim() ? `${row.stop_code} · ` : '') + (row.stop_name ?? ''),
    }));
  return stops.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
}

/**
 * Get all stop_id values that share the same stop_code (e.g. A1708, TB1708 for code "1708").
 * @param {string} code - GTFS stop_code
 * @returns {Promise<string[]>}
 */
export async function getStopIdsByCode(code) {
  const stops = await getStops();
  const normalized = String(code).trim();
  if (!normalized) return [];
  return stops.filter((s) => (s.code ?? '').trim() === normalized).map((s) => s.id);
}

/**
 * Get a single stop by stop_code. If multiple GTFS stops share the same code (e.g. bus + trolley),
 * merges into one response with same coordinates and stopIds list.
 * @param {string} code - GTFS stop_code
 * @returns {Promise<{ code: string, name: string, latitude: number, longitude: number, description: string, title: string, stopIds: string[] } | null>}
 */
export async function getStopByCode(code) {
  const stops = await getStops();
  const normalized = String(code).trim();
  if (!normalized) return null;
  const withCode = stops.filter((s) => (s.code ?? '').trim() === normalized);
  if (withCode.length === 0) return null;
  const first = withCode[0];
  const name = withCode.map((s) => s.name).find((n) => n && n.trim()) ?? first.name;
  const description = withCode.map((s) => s.description).find((d) => d && d.trim()) ?? first.description;
  const title = first.code?.trim() ? `${first.code} · ${name}` : name;
  return {
    code: normalized,
    name,
    latitude: first.latitude,
    longitude: first.longitude,
    description: description ?? '',
    title,
    stopIds: withCode.map((s) => s.id),
  };
}

/**
 * @returns {Promise<Record<string, import('./types.js').TripDisplayInfo>>}
 */
export async function getTripLookup() {
  const [routesRaw, tripsRaw] = await Promise.all([
    fetchFile('routes.txt'),
    fetchFile('trips.txt'),
  ]);
  const routesTable = parseCSV(routesRaw);
  const tripsTable = parseCSV(tripsRaw);

  const routesById = {};
  for (const row of routesTable.rows) {
    if (!row.route_id?.trim()) continue;
    const short = (row.route_short_name ?? '').trim();
    const long = (row.route_long_name ?? '').trim();
    routesById[row.route_id] = { short, long };
  }

  const lookup = {};
  for (const row of tripsTable.rows) {
    if (!row.trip_id?.trim() || !row.route_id?.trim()) continue;
    const route = routesById[row.route_id];
    const routeShortName =
      route?.short || route?.long || row.route_id;
    lookup[row.trip_id] = {
      tripId: row.trip_id,
      routeId: row.route_id,
      routeShortName,
      headsign: row.trip_headsign ?? '',
    };
  }
  return lookup;
}

/**
 * @returns {Promise<import('./types.js').RouteRow[]>}
 */
export async function getRoutes() {
  const raw = await fetchFile('routes.txt');
  const { rows } = parseCSV(raw);
  return rows.filter((r) => r.route_id?.trim()).map((r) => ({
    route_id: r.route_id,
    route_short_name: (r.route_short_name ?? '').trim(),
    route_long_name: (r.route_long_name ?? '').trim(),
  }));
}

/**
 * @returns {Promise<import('./types.js').TripRow[]>}
 */
export async function getTrips() {
  const raw = await fetchFile('trips.txt');
  const { rows } = parseCSV(raw);
  return rows.filter((r) => r.trip_id?.trim()).map((r) => ({
    trip_id: r.trip_id,
    route_id: r.route_id,
    trip_headsign: r.trip_headsign ?? '',
  }));
}
