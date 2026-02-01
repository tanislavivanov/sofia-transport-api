/**
 * GTFS Realtime trip-updates fetcher – mirrors SofiaBusDock GTFSRealtimeService.
 * URL: https://gtfs.sofiatraffic.bg/api/v1/trip-updates (protobuf).
 */

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const TRIP_UPDATES_URL = 'https://gtfs.sofiatraffic.bg/api/v1/trip-updates';
const CACHE_TTL_MS = 60 * 1000; // 1 minute

let cached = null;
let cachedAt = 0;

/**
 * @returns {Promise<import('./types.js').TripUpdateEntity[]>}
 */
export async function fetchTripUpdates() {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const res = await fetch(TRIP_UPDATES_URL, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`GTFS realtime: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

  const updates = [];
  const entities = feed.entity || feed.entities || [];
  for (const entity of entities) {
    const tu = entity.trip_update || entity.tripUpdate;
    if (!tu) continue;
    const descriptor = tu.trip;
    if (!descriptor) continue;
    const tripId = descriptor.trip_id ?? descriptor.tripId;
    if (!tripId) continue;

    const stopTimeUpdateList = tu.stop_time_update || tu.stopTimeUpdate || [];
    const stopTimeUpdates = stopTimeUpdateList
      .map((stu) => {
        const stopId = (stu.stop_id ?? stu.stopId ?? '').toString();
        if (!stopId) return null;
        const arr = stu.arrival;
        const dep = stu.departure;
        const arrival = arr
          ? {
              delay: arr.delay != null ? Number(arr.delay) : null,
              time: arr.time != null ? new Date(Number(arr.time) * 1000).toISOString() : null,
            }
          : null;
        const departure = dep
          ? {
              delay: dep.delay != null ? Number(dep.delay) : null,
              time: dep.time != null ? new Date(Number(dep.time) * 1000).toISOString() : null,
            }
          : null;
        return {
          stopId,
          arrival,
          departure,
          scheduleRelationship: stu.schedule_relationship ?? stu.scheduleRelationship ?? null,
        };
      })
      .filter(Boolean);

    updates.push({
      entityId: (entity.id ?? '').toString(),
      tripId,
      routeId: descriptor.route_id ?? descriptor.routeId ?? null,
      timestamp: tu.timestamp != null ? new Date(Number(tu.timestamp) * 1000).toISOString() : null,
      stopTimeUpdates,
    });
  }

  cached = updates;
  cachedAt = Date.now();
  return updates;
}
