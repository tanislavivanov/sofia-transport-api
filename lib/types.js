/**
 * @typedef {Object} BusStop
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} description
 * @property {string} [title]
 */

/**
 * @typedef {Object} TripDisplayInfo
 * @property {string} tripId
 * @property {string} routeId
 * @property {string} routeShortName
 * @property {string} headsign
 */

/**
 * @typedef {Object} RouteRow
 * @property {string} route_id
 * @property {string} route_short_name
 * @property {string} route_long_name
 */

/**
 * @typedef {Object} TripRow
 * @property {string} trip_id
 * @property {string} route_id
 * @property {string} trip_headsign
 */

/**
 * @typedef {Object} ArrivalPrediction
 * @property {string} id
 * @property {string} routeShortName
 * @property {string} headsign
 * @property {string} arrivalDate - ISO 8601
 * @property {number|null} delaySeconds
 */

export const _ = null;
