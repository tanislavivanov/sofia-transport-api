/**
 * API documentation as JSON for machine- and human-readable docs.
 */

export const apiDocs = {
  name: 'Sofia Public Transport API',
  description: 'Public JSON API for Sofia public transport (buses, trams, trolleys). Data from gtfs.sofiatraffic.bg (GTFS static + realtime).',
  version: '1.0.0',
  baseUrl: '/api',
  endpoints: [
    {
      method: 'GET',
      path: '/api',
      summary: 'API documentation (this document)',
      response: {
        description: 'JSON object describing all endpoints and example responses',
      },
    },
    {
      method: 'GET',
      path: '/api/stops',
      summary: 'List all stops',
      response: {
        stops: [
          {
            id: 'string (GTFS stop_id)',
            code: 'string',
            name: 'string',
            latitude: 'number',
            longitude: 'number',
            description: 'string',
            title: 'string (code · name or name)',
          },
        ],
        count: 'number',
      },
    },
    {
      method: 'GET',
      path: '/api/stops/:code',
      summary: 'Get a single stop by stop_code (merged if multiple GTFS stop_ids share same code, e.g. bus + trolley)',
      params: { code: 'GTFS stop_code' },
      response: {
        code: 'string',
        name: 'string',
        latitude: 'number',
        longitude: 'number',
        description: 'string',
        title: 'string',
        stopIds: 'string[] (GTFS stop_id list for this code)',
      },
    },
    {
      method: 'GET',
      path: '/api/stops/:code/arrivals',
      summary: 'Predicted arrivals at a stop by stop_code (merges arrivals for all stop_ids with that code)',
      params: { code: 'GTFS stop_code' },
      query: { limit: 'optional, 1–100, default 20' },
      response: {
        stopCode: 'string',
        arrivals: [
          {
            id: 'string',
            routeShortName: 'string',
            headsign: 'string',
            arrivalDate: 'string (ISO 8601)',
            delaySeconds: 'number | null',
          },
        ],
        count: 'number',
      },
    },
    {
      method: 'GET',
      path: '/api/routes',
      summary: 'List all routes (from GTFS routes.txt)',
      response: {
        routes: [
          {
            route_id: 'string',
            route_short_name: 'string',
            route_long_name: 'string',
          },
        ],
        count: 'number',
      },
    },
    {
      method: 'GET',
      path: '/api/trips',
      summary: 'List trips (from GTFS trips.txt)',
      response: {
        trips: [
          {
            trip_id: 'string',
            route_id: 'string',
            trip_headsign: 'string',
          },
        ],
        count: 'number',
      },
    },
    {
      method: 'GET',
      path: '/api/trip-lookup',
      summary: 'Trip ID → route display info (for joining with realtime)',
      response: {
        tripLookup: {
          '<trip_id>': {
            tripId: 'string',
            routeId: 'string',
            routeShortName: 'string',
            headsign: 'string',
          },
        },
      },
    },
    {
      method: 'GET',
      path: '/api/trip-updates',
      summary: 'Raw realtime trip updates (parsed GTFS-RT protobuf)',
      response: {
        tripUpdates: [
          {
            entityId: 'string',
            tripId: 'string',
            routeId: 'string | null',
            timestamp: 'string (ISO 8601) | null',
            stopTimeUpdates: [
              {
                stopId: 'string',
                arrival: { delay: 'number | null', time: 'string (ISO 8601) | null' },
                departure: { delay: 'number | null', time: 'string (ISO 8601) | null' },
                scheduleRelationship: 'number | null',
              },
            ],
          },
        ],
        count: 'number',
      },
    },
  ],
  dataSource: 'https://gtfs.sofiatraffic.bg',
  cacheNote: 'Static data cached ~30 days; trip-updates/arrivals cached ~1 min.',
  examples: {
    'GET /api/stops': {
      stops: [
        { id: '1234', code: '1234', name: 'Example Stop', latitude: 42.6977, longitude: 23.3219, description: '', title: '1234 · Example Stop' },
      ],
      count: 1,
    },
    'GET /api/stops/:code': {
      code: '1708',
      name: 'Example Stop',
      latitude: 42.6977,
      longitude: 23.3219,
      description: '',
      title: '1708 · Example Stop',
      stopIds: ['A1708', 'TB1708'],
    },
    'GET /api/stops/:code/arrivals': {
      stopCode: '1708',
      arrivals: [
        { id: 'trip-1234-1700000000', routeShortName: '94', headsign: 'Lozenets', arrivalDate: '2025-02-02T14:05:00.000Z', delaySeconds: 120 },
      ],
      count: 1,
    },
    'GET /api/routes': {
      routes: [{ route_id: 'route_1', route_short_name: '94', route_long_name: 'Lozenets - Center' }],
      count: 1,
    },
    'GET /api/trips': {
      trips: [{ trip_id: 'trip_1', route_id: 'route_1', trip_headsign: 'Lozenets' }],
      count: 1,
    },
    'GET /api/trip-lookup': {
      tripLookup: {
        trip_1: { tripId: 'trip_1', routeId: 'route_1', routeShortName: '94', headsign: 'Lozenets' },
      },
    },
    'GET /api/trip-updates': {
      tripUpdates: [
        {
          entityId: 'entity_1',
          tripId: 'trip_1',
          routeId: 'route_1',
          timestamp: '2025-02-02T13:00:00.000Z',
          stopTimeUpdates: [
            { stopId: '1234', arrival: { delay: 60, time: '2025-02-02T14:05:00.000Z' }, departure: { delay: 60, time: '2025-02-02T14:06:00.000Z' }, scheduleRelationship: 0 },
          ],
        },
      ],
      count: 1,
    },
  },
};
