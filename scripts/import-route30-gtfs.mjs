import fs from "node:fs";
import path from "node:path";

const routeNumber = process.argv[2] || "30";
const feedDir = path.resolve("gtfs-official");
const output = path.resolve(`app/route${routeNumber}-official.ts`);
const directionNames = routeNumber === "11" || routeNumber === "4" ? ["WEST", "EAST"] : ["NORTH", "SOUTH"];

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift();
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

const read = name => parseCsv(fs.readFileSync(path.join(feedDir, name), "utf8"));
const routes = read("routes.txt");
const trips = read("trips.txt");
const shapes = read("shapes.txt");
const stopTimes = read("stop_times.txt");
const stops = read("stops.txt");
const calendars = read("calendar.txt");

const today = new Date();
const dateStamp = Number(today.toISOString().slice(0, 10).replaceAll("-", ""));
const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][today.getDay()];
const activeServices = new Set(calendars.filter(c => Number(c.start_date) <= dateStamp && Number(c.end_date) >= dateStamp && c[weekday] === "1").map(c => c.service_id));
const routeIds = new Set(routes.filter(r => r.route_short_name === routeNumber).map(r => r.route_id));
const activeTrips = trips.filter(t => routeIds.has(t.route_id) && activeServices.has(t.service_id));
const stopById = new Map(stops.map(s => [s.stop_id, s]));

function directionData(directionId) {
  const candidates = activeTrips.filter(t => t.direction_id === directionId);
  const shapeCounts = new Map();
  for (const trip of candidates) shapeCounts.set(trip.shape_id, (shapeCounts.get(trip.shape_id) || 0) + 1);
  const shapeId = [...shapeCounts].sort((a, b) => b[1] - a[1])[0][0];
  const trip = candidates.find(t => t.shape_id === shapeId);
  const coordinates = shapes.filter(s => s.shape_id === shapeId).sort((a, b) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence)).map(s => [Number(s.shape_pt_lon), Number(s.shape_pt_lat)]);
  const routeStops = stopTimes.filter(s => s.trip_id === trip.trip_id).sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence)).map(s => {
    const stop = stopById.get(s.stop_id);
    return { name: stop.stop_name, coordinates: [Number(stop.stop_lon), Number(stop.stop_lat)] };
  });
  return { coordinates, stops: routeStops, shapeId, tripId: trip.trip_id };
}

const first = directionData("0");
const second = directionData("1");
const source = `// Generated from Omaha Metro's official GTFS feed by scripts/import-route30-gtfs.mjs ${routeNumber}.\n` +
  `export type OfficialRoutePoint = { name: string; coordinates: [number, number] };\n\n` +
  `export const ROUTE${routeNumber}_${directionNames[0]}_SHAPE: [number, number][] = ${JSON.stringify(first.coordinates)};\n\n` +
  `export const ROUTE${routeNumber}_${directionNames[1]}_SHAPE: [number, number][] = ${JSON.stringify(second.coordinates)};\n\n` +
  `export const ROUTE${routeNumber}_${directionNames[0]}_STOPS: OfficialRoutePoint[] = ${JSON.stringify(first.stops)};\n\n` +
  `export const ROUTE${routeNumber}_${directionNames[1]}_STOPS: OfficialRoutePoint[] = ${JSON.stringify(second.stops)};\n`;
fs.writeFileSync(output, source);
console.log(JSON.stringify({ [directionNames[0].toLowerCase()]: { shapePoints: first.coordinates.length, stops: first.stops.length }, [directionNames[1].toLowerCase()]: { shapePoints: second.coordinates.length, stops: second.stops.length } }, null, 2));

