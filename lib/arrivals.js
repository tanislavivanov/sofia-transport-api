/**
 * Combines static trip lookup + realtime trip updates to produce arrival predictions per stop.
 * Mirrors SofiaBusDock StopArrivalsModel logic.
 */

import { getTripLookup, getStopIdsByCode } from './gtfs-static.js';
import { fetchTripUpdates } from './gtfs-realtime.js';

/**
 * @param {string} stopId - GTFS stop_id
 * @param {{ limit?: number }} [opts] - optional limit (default 20)
 * @returns {Promise<import('./types.js').ArrivalPrediction[]>}
 */
export async function getArrivalsAtStop(stopId, opts = {}) {
  const limit = opts.limit ?? 20;
  const [lookup, updates] = await Promise.all([getTripLookup(), fetchTripUpdates()]);

  const now = Date.now();
  const predictions = [];

  for (const entity of updates) {
    const tripInfo = lookup[entity.tripId] ?? {
      tripId: entity.tripId,
      routeId: entity.routeId ?? entity.tripId,
      routeShortName: (entity.routeId ?? entity.tripId).toString(),
      headsign: (entity.routeId ?? entity.tripId).toString(),
    };

    for (const stu of entity.stopTimeUpdates) {
      if (stu.stopId !== stopId) continue;
      const event = stu.arrival ?? stu.departure;
      if (!event?.time) continue;

      const arrivalDate = new Date(event.time);
      if (arrivalDate.getTime() < now - 60 * 1000) continue; // skip past (>1 min ago)

      const delay =
        event.delay ?? stu.departure?.delay ?? stu.arrival?.delay ?? null;

      predictions.push({
        id: `${entity.tripId}-${stu.stopId}-${arrivalDate.getTime() / 1000}`,
        routeShortName: tripInfo.routeShortName,
        headsign: tripInfo.headsign || `Towards ${tripInfo.routeShortName}`,
        arrivalDate: event.time,
        delaySeconds: delay != null ? Number(delay) : null,
      });
    }
  }

  predictions.sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());
  return predictions.slice(0, limit);
}

/**
 * Arrivals for all stop_ids that share the same stop_code (e.g. bus + trolley same stop).
 * Merges and sorts by arrival time.
 * @param {string} code - GTFS stop_code
 * @param {{ limit?: number }} [opts] - optional limit (default 20)
 * @returns {Promise<{ arrivals: import('./types.js').ArrivalPrediction[], count: number }>}
 */
export async function getArrivalsByStopCode(code, opts = {}) {
  const limit = opts.limit ?? 20;
  const stopIds = await getStopIdsByCode(code);
  if (stopIds.length === 0) return { arrivals: [], count: 0 };
  const perStop = await Promise.all(stopIds.map((id) => getArrivalsAtStop(id, { limit: limit * 2 })));
  const byId = new Map();
  for (const list of perStop) {
    for (const p of list) {
      byId.set(p.id, p);
    }
  }
  const merged = [...byId.values()].sort(
    (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
  );
  return { arrivals: merged.slice(0, limit), count: merged.slice(0, limit).length };
}
