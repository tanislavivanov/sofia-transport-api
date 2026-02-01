# Sofia Public Transport API

<p align="center">
  <img src="https://i.imgur.com/prR7I5K.png" alt="Sofia Public Transport API" width="200">
</p>

Public JSON API for Sofia public transport (buses, trams, trolleys). Fetches and caches GTFS static and realtime data from [gtfs.sofiatraffic.bg](https://gtfs.sofiatraffic.bg) and exposes it as REST endpoints. No API key required; CORS enabled.

## Quick start

```bash
npm install
npm start
```

Server runs at **http://localhost:3000**. Set `PORT` to change the port (e.g. `PORT=8080 npm start`).

- **Docs UI:** Open **http://localhost:3000/** in a browser for the interactive documentation (sidebar, endpoint list, examples, light/dark mode, “View on GitHub” link).
- **API docs (JSON):** **GET /api** returns the full API spec as JSON, including endpoint paths and example response shapes.

<p align="center">
  <img src="https://i.imgur.com/Jnu0hki.png" alt="API documentation UI" width="800">
</p>

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api` | API documentation (JSON) |
| GET | `/api/stops` | All stops |
| GET | `/api/stops/:code` | Single stop by **stop code** (merged if bus + trolley share same code) |
| GET | `/api/stops/:code/arrivals` | Predicted arrivals at stop by **stop code** (`?limit=20`, max 100) |
| GET | `/api/routes` | All routes (GTFS routes.txt) |
| GET | `/api/trips` | All trips (GTFS trips.txt) |
| GET | `/api/trip-lookup` | Trip ID → route display info |
| GET | `/api/trip-updates` | Raw realtime trip updates (parsed GTFS-RT protobuf) |

Stop lookups use the **public stop code** (e.g. `1708`), not the internal GTFS `stop_id`. When several GTFS stop IDs share the same code (e.g. bus `A1708` and trolley `TB1708` at the same stop), **GET /api/stops/:code** returns one merged stop (same coordinates, `stopIds` array) and **GET /api/stops/:code/arrivals** merges arrivals from all those IDs into one sorted list.

All responses are JSON. Static data cached ~30 days; realtime (trip-updates, arrivals) ~1 minute.

## Health check

**GET /health** — Returns `{ "status": "ok", "timestamp": "..." }`. Use for load balancers or monitoring.

## Deploy

- **Node:** 18+
- **Env:** `PORT` (default 3000)
- No database; in-memory cache only. Restart clears cache; the next request repopulates it.

Example:

```bash
PORT=8080 npm start
```

Use a process manager (e.g. PM2) and a reverse proxy (e.g. nginx) in front for production.

## Project structure

```
sofia-transport-api/
├── server.js           # Express app, routes, static docs
├── public/
│   └── index.html      # Docs UI (sidebar, theme toggle, examples)
├── lib/
│   ├── gtfs-static.js  # Stops, routes, trips, stop-by-code (ZIP/CSV)
│   ├── gtfs-realtime.js# Trip updates (protobuf)
│   ├── arrivals.js     # Arrivals by stop code (merged)
│   ├── csv.js          # CSV parsing
│   ├── api-docs.js     # JSON API spec
│   └── types.js        # JSDoc types
├── package.json
└── README.md
```

## Data source

GTFS static and realtime data from **https://gtfs.sofiatraffic.bg** (Sofia Urban Mobility Centre). The logic mirrors the [SofiaBusDock](https://github.com/tanislavivanov/SofiaBusDock) macOS menu bar app.

## License & repo

- **Repository:** [github.com/tanislavivanov/sofia-transport-api](https://github.com/tanislavivanov/sofia-transport-api)
