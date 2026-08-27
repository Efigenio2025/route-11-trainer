// Mapbox public browser tokens are safe to ship to clients. The split fallback
// keeps hosted builds working when an environment variable is not injected.
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiZWZpZ2VuaW8xMDEiLCJhIjoiY210MXpja20z" + "MDcxMjJ5cHMwZHliaTlkbCJ9.SwA6A5jU9i1zuVjGLP5cvg";

const WESTBOUND: [number, number][] = [
  [-95.93054, 41.25968],
  [-95.937177, 41.259712],
  [-95.937202, 41.255501],
  [-95.938488, 41.255404],
  [-95.958803, 41.252415],
  [-96.004785, 41.252365],
  [-96.004764, 41.24874],
  [-96.015588, 41.248679],
  [-96.014636, 41.243756],
  [-96.018842, 41.243764],
  [-96.017657, 41.240322],
  [-96.0146, 41.238827],
];

type MapPoint = { name: string; coordinates: [number, number] };

// Route 30 maneuver points come from the turn-direction sheet. These shape
// the route and drive guidance; they are deliberately not labeled as stops.
const ROUTE30_NORTH_TURNS: MapPoint[] = [
  {name:"Continue east on Mercy Road",coordinates:[-96.0146,41.23883]},
  {name:"Right on 67th Street",coordinates:[-96.0155,41.2395]},
  {name:"Right on 67th to Center",coordinates:[-96.0155,41.2329]},
  {name:"Left on Center to Saddle Creek",coordinates:[-95.9967,41.2330]},
  {name:"Left on Saddle Creek to Farnam",coordinates:[-95.9961,41.2572]},
  {name:"Right on Farnam to 42nd",coordinates:[-95.9772,41.2572]},
  {name:"Left on 42nd to Dodge",coordinates:[-95.9772,41.2597]},
  {name:"Right on Dodge / Douglas",coordinates:[-95.9680,41.2597]},
  {name:"Left on Park Avenue",coordinates:[-95.9567,41.2552]},
  {name:"Left on Dodge to 30th",coordinates:[-95.9567,41.2597]},
  {name:"Right on 30th to North Omaha T.C.",coordinates:[-95.9562,41.2962]},
  {name:"North Omaha T.C. layover",coordinates:[-95.9562,41.2972]},
  {name:"Exit to 31st Avenue",coordinates:[-95.9580,41.2992]},
  {name:"Right on 31st Avenue to Ames",coordinates:[-95.9580,41.3000]},
  {name:"Right on Ames to 30th",coordinates:[-95.9562,41.3000]},
  {name:"Left on 30th, right on Ferry",coordinates:[-95.9580,41.3040]},
];
const ROUTE30_SOUTH_TURNS: MapPoint[] = [
  {name:"Exit turn-around to Ferry",coordinates:[-95.9580,41.3040]},
  {name:"Left on Ferry to 31st",coordinates:[-95.9580,41.3035]},
  {name:"Left on 31st / 30th to Ames",coordinates:[-95.9562,41.3000]},
  {name:"Right on Ames to 31st Avenue",coordinates:[-95.9580,41.3000]},
  {name:"Left on 31st Avenue to North Omaha T.C.",coordinates:[-95.9580,41.2972]},
  {name:"North Omaha T.C. layover",coordinates:[-95.9562,41.2972]},
  {name:"Exit North Omaha T.C. to 30th",coordinates:[-95.9562,41.2962]},
  {name:"Right on 30th / Turner to Dodge",coordinates:[-95.9562,41.2597]},
  {name:"Right on Dodge to 42nd access road",coordinates:[-95.9772,41.2597]},
  {name:"42nd Street jug-handle",coordinates:[-95.9772,41.2587]},
  {name:"Left on 42nd to Farnam",coordinates:[-95.9772,41.2572]},
  {name:"Right on Farnam to Saddle Creek",coordinates:[-95.9961,41.2572]},
  {name:"Left on Saddle Creek to Center",coordinates:[-95.9967,41.2330]},
  {name:"Right on Center to 72nd access",coordinates:[-96.0237,41.2330]},
  {name:"Left on access road to Mercy",coordinates:[-96.0237,41.2395]},
  {name:"Right on Mercy to Aksarben T.C.",coordinates:[-96.0146,41.23883]},
];

// Route 95 checkpoints follow the operator turn sheet, in maneuver order.
// They are distinct from the passenger-stop coordinates shown on the map.
const ROUTE95_AM_TURNS: [number, number][] = [
  [-95.9539,41.2610], [-95.9555,41.2294], [-95.94995,41.20574],
  [-95.95275,41.20641], [-95.95316,41.20608], [-95.95663,41.20641],
  [-95.95316,41.20608], [-95.94991,41.20560], [-95.94940,41.20832],
  [-95.94019,41.15889], [-95.92610,41.15656], [-95.91746,41.15087],
  [-95.91075,41.14311], [-95.91237,41.14055], [-95.92876,41.14201],
  [-95.93323,41.25966], [-95.93843,41.25967], [-95.93846,41.26144],
];
const ROUTE95_PM_TURNS: [number, number][] = [
  [-95.93712,41.26796], [-95.93713,41.26177], [-95.93843,41.26068],
  [-95.93843,41.25865], [-95.93455,41.25865], [-95.93456,41.25233],
  [-95.93332,41.25233], [-95.93332,41.21496], [-95.92638,41.17646],
  [-95.92537,41.17624], [-95.92638,41.17646], [-95.92638,41.17646],
  [-95.91746,41.15087], [-95.91075,41.14311], [-95.91237,41.14055],
  [-95.92883,41.14178], [-95.93421,41.14061], [-95.93859,41.15879],
  [-95.94995,41.20574], [-95.95275,41.20641], [-95.95663,41.20641],
  [-95.95316,41.20608], [-95.95275,41.20641], [-95.95350,41.20810],
  [-95.94915,41.20831],
];

declare global {
  interface Window { mapboxgl?: any; __routeTrainerWatch?: number; __startRouteGPS?: () => void; }
}

async function loadMapbox(): Promise<any> {
  // Bundle Mapbox with the app instead of downloading its runtime from a CDN.
  // This is substantially more reliable for installed iPhone PWAs.
  const module = await import("mapbox-gl");
  return module.default;
}

function miles(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180, dLat = (b[1] - a[1]) * rad, dLng = (b[0] - a[0]) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function distanceToRoute(point: [number, number], route: [number, number][]) {
  const latitudeScale = 69, longitudeScale = 69 * Math.cos(point[1] * Math.PI / 180);
  let nearest = Infinity;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i];
    const ax = (a[0] - point[0]) * longitudeScale, ay = (a[1] - point[1]) * latitudeScale;
    const bx = (b[0] - point[0]) * longitudeScale, by = (b[1] - point[1]) * latitudeScale;
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length)) : 0;
    nearest = Math.min(nearest, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return nearest;
}

function bearing(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180, lat1 = a[1] * rad, lat2 = b[1] * rad, dLng = (b[0] - a[0]) * rad;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

function headingDifference(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

function routeLengths(route: [number, number][]) {
  const values = [0];
  for (let i = 1; i < route.length; i++) values.push(values[i - 1] + miles(route[i - 1], route[i]));
  return values;
}

function projectOnRoute(
  point: [number, number], route: [number, number][], lengths: number[],
  options: {startSegment?:number; endSegment?:number; heading?:number|null; referenceAlong?:number|null} = {},
) {
  const latitudeScale = 69, longitudeScale = 69 * Math.cos(point[1] * Math.PI / 180);
  let best = {distance: Infinity, along: 0, segment: 1, routeBearing: 0, score:Infinity};
  const start = Math.max(1, options.startSegment ?? 1), end = Math.min(route.length - 1, options.endSegment ?? route.length - 1);
  for (let i = start; i <= end; i++) {
    const a = route[i - 1], b = route[i];
    const ax = (a[0] - point[0]) * longitudeScale, ay = (a[1] - point[1]) * latitudeScale;
    const bx = (b[0] - point[0]) * longitudeScale, by = (b[1] - point[1]) * latitudeScale;
    const dx = bx - ax, dy = by - ay, square = dx * dx + dy * dy;
    const t = square ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / square)) : 0;
    const distance = Math.hypot(ax + t * dx, ay + t * dy);
    const along = lengths[i - 1] + miles(a, b) * t, routeBearing = bearing(a, b);
    const headingPenalty = options.heading == null ? 0 : headingDifference(options.heading, routeBearing) / 180 * .10;
    const continuityPenalty = options.referenceAlong == null ? 0 : Math.max(0, Math.abs(along - options.referenceAlong) - .35) * .08;
    const score = distance + headingPenalty + continuityPenalty;
    if (score < best.score) best = {distance, along, segment:i, routeBearing, score};
  }
  return best;
}

function orderedCheckpointProgress(checkpoints: [number, number][], route: [number, number][], lengths: number[]) {
  let segment = 1;
  return checkpoints.map(point => {
    const match = projectOnRoute(point, route, lengths, {startSegment:segment});
    segment = match.segment;
    return match.along;
  });
}

function spacedCheckpoints(route: [number, number][], count: number) {
  if (count <= 1) return [route[route.length - 1]];
  const lengths = [0];
  for (let i = 1; i < route.length; i++) lengths.push(lengths[i - 1] + miles(route[i - 1], route[i]));
  const total = lengths[lengths.length - 1];
  return Array.from({length: count}, (_, n) => {
    const target = total * ((n + 1) / count);
    let i = 1; while (i < lengths.length - 1 && lengths[i] < target) i++;
    return route[i];
  });
}

// Build maneuver checkpoints from the actual bends in the official GTFS
// geometry. This keeps announcements at intersections instead of distributing
// them evenly over the trip, which could put a prompt in the middle of a block.
function calibratedCheckpoints(route: [number, number][], count: number) {
  if (count <= 1) return [route[route.length - 1]];
  const lengths = routeLengths(route), total = lengths[lengths.length - 1];
  const candidates: {coordinates:[number,number]; progress:number; angle:number}[] = [];
  let lastProgress = -.1;
  for (let i = 2; i < route.length - 2; i++) {
    const angle = headingDifference(bearing(route[i - 2], route[i]), bearing(route[i], route[i + 2]));
    const progress = lengths[i];
    if (angle >= 32 && progress - lastProgress >= .018) {
      candidates.push({coordinates:route[i], progress, angle});
      lastProgress = progress;
    }
  }
  let previous = -.01;
  return Array.from({length:count}, (_, index) => {
    if (index === count - 1) return route[route.length - 1];
    const remaining = count - index, expected = previous + (total - previous) / remaining;
    const available = candidates.filter(item => item.progress > previous + .006);
    const selected = available.sort((a,b) => Math.abs(a.progress - expected) - Math.abs(b.progress - expected) || b.angle - a.angle)[0];
    if (selected) { previous = selected.progress; return selected.coordinates; }
    const fallback = spacedCheckpoints(route, count)[index];
    previous = projectOnRoute(fallback, route, lengths).along;
    return fallback;
  });
}

function gpsEvent(detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("route-trainer-gps", {detail}));
}

type MapboxVoiceInstruction = {
  distanceAlongGeometry: number;
  announcement: string;
  ssmlAnnouncement?: string;
};

type MapboxGuidanceStep = {
  coordinates: [number, number];
  instruction: string;
  modifier: string;
  type: string;
  progress: number;
  voiceInstructions: MapboxVoiceInstruction[];
};

type MapboxGuidancePlan = {
  steps: MapboxGuidanceStep[];
  geometry: [number, number][];
};

// Keep the route constrained to the official transit shape while staying
// within the Directions API's 25-coordinate limit. Sharp bends are retained;
// long straight sections need no extra shaping points.
function routeShapingPoints(route: [number, number][], stopAnchors: [number, number][] = []) {
  const lengths = routeLengths(route);
  const points: [number, number][] = [route[0]];
  let lastProgress = 0;
  for (let i = 2; i < route.length - 2; i++) {
    const angle = headingDifference(bearing(route[i - 2], route[i]), bearing(route[i], route[i + 2]));
    const progress = lengths[i];
    if (angle >= 24 && progress - lastProgress >= .012) {
      points.push(route[i]);
      lastProgress = progress;
    } else if (progress - lastProgress >= .75) {
      points.push(route[i]);
      lastProgress = progress;
    }
  }
  points.push(route[route.length - 1]);
  // Route 3 has a dense, official stop pattern. Keep those stop locations as
  // shaping anchors so Mapbox cannot shortcut between long straight segments
  // and the generated maneuvers stay tied to the actual bus alignment.
  const anchors = stopAnchors
    .map(coordinates => ({coordinates, progress:projectOnRoute(coordinates, route, lengths).along}))
    .sort((a, b) => a.progress - b.progress)
    .map(item => item.coordinates);
  return [...points, ...anchors]
    .sort((a, b) => projectOnRoute(a, route, lengths).along - projectOnRoute(b, route, lengths).along)
    .filter((point, index, all) => index === 0 || miles(point, all[index - 1]) > .002);
}

function chunkShapingPoints(points: [number, number][]) {
  if (points.length <= 25) return [points];
  const chunks: [number, number][][] = [];
  for (let start = 0; start < points.length - 1; start += 24) {
    chunks.push(points.slice(start, Math.min(start + 25, points.length)));
  }
  return chunks;
}

function directionsCacheKey(routeNumber: string, direction: string) {
  return `rt-mapbox-directions-v2:${routeNumber}:${direction}`;
}

async function fetchMapboxGuidance(
  routeNumber: string,
  direction: string,
  officialRoute: [number, number][],
  officialLengths: number[],
  stopAnchors: [number, number][] = [],
): Promise<MapboxGuidancePlan> {
  const cacheKey = directionsCacheKey(routeNumber, direction);
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached?.savedAt > Date.now() - 7 * 86400000 && Array.isArray(cached?.plan?.steps)) return cached.plan;
  } catch { /* Ignore an unavailable or invalid browser cache. */ }

  const chunks = chunkShapingPoints(routeShapingPoints(officialRoute, routeNumber === "3" ? stopAnchors : []));
  const allSteps: MapboxGuidanceStep[] = [];
  const geometry: [number, number][] = [];
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    const coordinates = chunk.map(point => point.join(",")).join(";");
    const parameters = new URLSearchParams({
      access_token:TOKEN,
      alternatives:"false",
      steps:"true",
      voice_instructions:"true",
      banner_instructions:"true",
      voice_units:"imperial",
      geometries:"geojson",
      overview:"full",
      continue_straight:"true",
      waypoints:`0;${chunk.length - 1}`,
    });
    const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?${parameters}`);
    if (!response.ok) throw new Error(`Mapbox directions failed (${response.status})`);
    const data = await response.json();
    const route = data?.routes?.[0];
    const rawGeometry = route?.geometry?.coordinates as [number, number][] | undefined;
    const rawSteps = route?.legs?.[0]?.steps as any[] | undefined;
    if (!Array.isArray(rawGeometry) || rawGeometry.length < 2 || !Array.isArray(rawSteps)) throw new Error("Mapbox returned no guidance");

    // Reject a route if Mapbox left the official bus alignment. The tolerance
    // allows divided roads and terminal driveways without permitting shortcuts.
    const generatedLengths = routeLengths(rawGeometry);
    const generatedSamples = rawGeometry.filter((_, index) => index % 8 === 0 || index === rawGeometry.length - 1);
    const maximumDeviation = Math.max(...generatedSamples.map(point => projectOnRoute(point, officialRoute, officialLengths).distance));
    const chunkStart = projectOnRoute(chunk[0], officialRoute, officialLengths).along;
    const chunkEnd = projectOnRoute(chunk[chunk.length - 1], officialRoute, officialLengths, {referenceAlong:chunkStart}).along;
    const officialSamples = officialRoute.filter((point, index) => {
      if (index % 10 !== 0 && index !== officialRoute.length - 1) return false;
      const progress = officialLengths[index];
      return progress >= chunkStart - .02 && progress <= chunkEnd + .02;
    });
    const reverseDeviation = Math.max(...officialSamples.map(point => projectOnRoute(point, rawGeometry, generatedLengths).distance));
    if (maximumDeviation > .20 || reverseDeviation > .24) throw new Error("Mapbox route did not match the official bus alignment");

    geometry.push(...rawGeometry.slice(chunkIndex ? 1 : 0));
    for (let stepIndex = 1; stepIndex < rawSteps.length; stepIndex++) {
      const step = rawSteps[stepIndex];
      const isIntermediateArrival = chunkIndex < chunks.length - 1 && step?.maneuver?.type === "arrive";
      if (isIntermediateArrival) continue;
      const location = step?.maneuver?.location;
      if (!Array.isArray(location)) continue;
      const coordinates: [number, number] = [Number(location[0]), Number(location[1])];
      const progress = projectOnRoute(coordinates, officialRoute, officialLengths).along;
      const previous = rawSteps[stepIndex - 1];
      allSteps.push({
        coordinates,
        instruction:String(step?.maneuver?.instruction || "Continue on the route"),
        modifier:String(step?.maneuver?.modifier || "straight"),
        type:String(step?.maneuver?.type || "continue"),
        progress,
        voiceInstructions:Array.isArray(previous?.voiceInstructions) ? previous.voiceInstructions : [],
      });
    }
  }
  const steps = allSteps
    .filter((step, index, all) => index === 0 || step.progress > all[index - 1].progress + .002)
    .sort((a, b) => a.progress - b.progress);
  if (!steps.length) throw new Error("Mapbox returned no usable maneuvers");
  const plan = {steps, geometry};
  try { localStorage.setItem(cacheKey, JSON.stringify({savedAt:Date.now(), plan})); } catch { /* Cache is optional. */ }
  return plan;
}

const liveMapCleanups = new Map<HTMLElement, () => void>();

async function mountLiveMap(host: HTMLElement) {
  if (host.dataset.enhanced) return;
  const runtime = host.querySelector<HTMLElement>(".map-runtime");
  if (!runtime) return;
  host.dataset.enhanced = "true";
  const routeNumber = host.dataset.route || "11";
  const route30South = routeNumber === "30" && host.dataset.direction === "southbound";
  const route3South = routeNumber === "3" && host.dataset.direction === "southbound";
  const route5South = routeNumber === "5" && host.dataset.direction === "southbound";
  const route8South = routeNumber === "8" && host.dataset.direction === "southbound";
  const route24South = routeNumber === "24" && host.dataset.direction === "southbound";
  const route11East = routeNumber === "11" && host.dataset.direction === "eastbound";
  const route4East = routeNumber === "4" && host.dataset.direction === "eastbound";
  const route30Turns = route30South ? ROUTE30_SOUTH_TURNS : ROUTE30_NORTH_TURNS;
  const route3Stops = route3South ? ROUTE3_SOUTH_STOPS : ROUTE3_NORTH_STOPS;
  const route3Shape = route3South ? ROUTE3_SOUTH_SHAPE : ROUTE3_NORTH_SHAPE;
  const route5Stops = route5South ? ROUTE5_SOUTH_STOPS : ROUTE5_NORTH_STOPS;
  const route5Shape = route5South ? ROUTE5_SOUTH_SHAPE : ROUTE5_NORTH_SHAPE;
  const route8Stops = route8South ? ROUTE8_SOUTH_STOPS : ROUTE8_NORTH_STOPS;
  const route8Shape = route8South ? ROUTE8_SOUTH_SHAPE : ROUTE8_NORTH_SHAPE;
  const route24Stops = route24South ? ROUTE24_SOUTH_STOPS : ROUTE24_NORTH_STOPS;
  const route24Shape = route24South ? ROUTE24_SOUTH_SHAPE : ROUTE24_NORTH_SHAPE;
  const route30Stops = route30South ? OFFICIAL_ROUTE30_SOUTH_STOPS : OFFICIAL_ROUTE30_NORTH_STOPS;
  const route30Shape = route30South ? ROUTE30_SOUTH_SHAPE : ROUTE30_NORTH_SHAPE;
  const route11Stops = route11East ? ROUTE11_EAST_STOPS : ROUTE11_WEST_STOPS;
  const route11Shape = route11East ? ROUTE11_EAST_SHAPE : ROUTE11_WEST_SHAPE;
  const route4Stops = route4East ? ROUTE4_EAST_STOPS : ROUTE4_WEST_STOPS;
  const route4Shape = route4East ? ROUTE4_EAST_SHAPE : ROUTE4_WEST_SHAPE;
  const route14East = routeNumber === "14" && host.dataset.direction === "eastbound";
  const route14Stops = route14East ? ROUTE14_EAST_STOPS : ROUTE14_WEST_STOPS;
  const route14Shape = route14East ? ROUTE14_EAST_SHAPE : ROUTE14_WEST_SHAPE;
  const route35South = routeNumber === "35" && host.dataset.direction === "southbound";
  const route35Stops = route35South ? ROUTE35_SOUTH_STOPS : ROUTE35_NORTH_STOPS;
  const route35Shape = route35South ? ROUTE35_SOUTH_SHAPE : ROUTE35_NORTH_SHAPE;
  const route36South = routeNumber === "36" && host.dataset.direction === "southbound";
  const route36Stops = route36South ? ROUTE36_SOUTH_STOPS : ROUTE36_NORTH_STOPS;
  const route36Shape = route36South ? ROUTE36_SOUTH_SHAPE : ROUTE36_NORTH_SHAPE;
  const route15East = routeNumber === "15" && host.dataset.direction === "eastbound";
  const route15Stops = route15East ? ROUTE15_EAST_STOPS : ROUTE15_WEST_STOPS;
  const route15Shape = route15East ? ROUTE15_EAST_SHAPE : ROUTE15_WEST_SHAPE;
  const route55East = routeNumber === "55" && host.dataset.direction === "eastbound";
  const route55Stops = route55East ? ROUTE55_EAST_STOPS : ROUTE55_WEST_STOPS;
  const route55Shape = route55East ? ROUTE55_EAST_SHAPE : ROUTE55_WEST_SHAPE;
  const route95Am = routeNumber === "95" && host.dataset.direction === "am-express";
  const route95Stops = route95Am ? ROUTE95_SOUTH_STOPS : ROUTE95_NORTH_STOPS;
  const route95Shape = route95Am ? ROUTE95_SOUTH_SHAPE : ROUTE95_NORTH_SHAPE;
  const maneuverCount = Number(host.dataset.maneuvers || 1);
  const route26Clockwise = routeNumber === "26" && host.dataset.direction === "clockwise";
  const route26Shape = route26Clockwise ? [...ROUTE26_LOOP_SHAPE].reverse() : ROUTE26_LOOP_SHAPE;
  const route26Stops = route26Clockwise ? [...ROUTE26_LOOP_STOPS].reverse() : ROUTE26_LOOP_STOPS;
  const mapCoordinates = routeNumber === "3" ? route3Shape : routeNumber === "5" ? route5Shape : routeNumber === "8" ? route8Shape : routeNumber === "24" ? route24Shape : routeNumber === "30" ? route30Shape : routeNumber === "4" ? route4Shape : routeNumber === "14" ? route14Shape : routeNumber === "35" ? route35Shape : routeNumber === "36" ? route36Shape : routeNumber === "26" ? route26Shape : routeNumber === "15" ? route15Shape : routeNumber === "55" ? route55Shape : routeNumber === "95" ? route95Shape : route11Shape;
  let checkpoints = routeNumber === "30"
    ? route30Turns.map(point => point.coordinates)
    : routeNumber === "95" ? (route95Am ? ROUTE95_AM_TURNS : ROUTE95_PM_TURNS)
    : calibratedCheckpoints(mapCoordinates, maneuverCount);
  const cumulativeRouteLengths = routeLengths(mapCoordinates);
  let checkpointProgress = orderedCheckpointProgress(checkpoints, mapCoordinates, cumulativeRouteLengths);
  let navigationPlan: MapboxGuidancePlan | null = null;
  const stops: MapPoint[] = routeNumber === "3"
    ? route3Stops
    : routeNumber === "5"
    ? route5Stops
    : routeNumber === "8"
    ? route8Stops
    : routeNumber === "24"
    ? route24Stops
    : routeNumber === "30"
    ? route30Stops
    : routeNumber === "4" ? route4Stops : routeNumber === "14" ? route14Stops : routeNumber === "35" ? route35Stops : routeNumber === "36" ? route36Stops : routeNumber === "26" ? route26Stops : routeNumber === "15" ? route15Stops : routeNumber === "55" ? route55Stops : routeNumber === "95" ? route95Stops : route11Stops;
  const fallbackMap = document.createElement("img");
  fallbackMap.className = "map-fallback-basemap";
  fallbackMap.alt = `Street map for Route ${routeNumber}`;
  fallbackMap.decoding = "async";
  const sampleEvery = Math.max(1, Math.ceil(mapCoordinates.length / 70));
  const sampledRoute = mapCoordinates.filter((_, index) => index % sampleEvery === 0);
  if (sampledRoute.at(-1) !== mapCoordinates.at(-1)) sampledRoute.push(mapCoordinates.at(-1)!);
  const fallbackOverlay = {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { stroke: "#17263a", "stroke-width": 9, "stroke-opacity": 1 }, geometry: { type: "LineString", coordinates: sampledRoute } },
      { type: "Feature", properties: { stroke: "#efb81d", "stroke-width": 5, "stroke-opacity": 1 }, geometry: { type: "LineString", coordinates: sampledRoute } },
      { type: "Feature", properties: { "marker-color": "#ffffff", "marker-size": "small", "marker-symbol": "bus" }, geometry: { type: "MultiPoint", coordinates: stops.map(stop => stop.coordinates) } },
    ],
  };
  fallbackMap.src = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/geojson(${encodeURIComponent(JSON.stringify(fallbackOverlay))})/auto/1280x640@2x?padding=45&access_token=${TOKEN}`;
  runtime.appendChild(fallbackMap);
  const fallback = document.createElement("canvas");
  fallback.className = "route-canvas";
  fallback.setAttribute("aria-label", `Route ${routeNumber} path`);
  runtime.appendChild(fallback);
  const drawFallback = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2), rect = host.getBoundingClientRect();
    fallback.width = Math.max(1, Math.round(rect.width * ratio)); fallback.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = fallback.getContext("2d"); if (!ctx) return; ctx.scale(ratio, ratio);
    const pad = 34, minX = Math.min(...mapCoordinates.map(p => p[0])), maxX = Math.max(...mapCoordinates.map(p => p[0])), minY = Math.min(...mapCoordinates.map(p => p[1])), maxY = Math.max(...mapCoordinates.map(p => p[1]));
    const point = (p: [number, number]) => [pad + (p[0]-minX)/(maxX-minX)*(rect.width-pad*2), pad + (maxY-p[1])/(maxY-minY)*(rect.height-pad*2)] as const;
    const paint = (color:string,width:number) => {ctx.beginPath();mapCoordinates.forEach((p,i)=>{const [x,y]=point(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke()};
    paint("#17263a",7); paint("#efb81d",4);
    stops.forEach((stop,i)=>{const[x,y]=point(stop.coordinates);ctx.beginPath();ctx.arc(x,y,i===0||i===stops.length-1?7:3,0,Math.PI*2);ctx.fillStyle=i===0?"#148b63":i===stops.length-1?"#d65572":"#fff";ctx.fill();ctx.strokeStyle="#17263a";ctx.lineWidth=i===0||i===stops.length-1?2:1.5;ctx.stroke()});
  };
  drawFallback();
  const fallbackResizeObserver = new ResizeObserver(drawFallback);
  fallbackResizeObserver.observe(host);
  const mapNode = document.createElement("div");
  mapNode.className = "mapbox-canvas";
  runtime.appendChild(mapNode);
  const gpsButton = document.createElement("button");
  gpsButton.className = "gps-button";
  gpsButton.textContent = "⌖ Use phone GPS";
  runtime.appendChild(gpsButton);
  const details = document.createElement("div");
  details.className = "avl-details";
  details.innerHTML = `<span>GPS <b class="avl-accuracy">—</b></span><span>HEADING / FACING <b class="avl-heading">—</b></span><span>UPDATED <b class="avl-updated">—</b></span>`;
  const centerButton = document.createElement("button");
  centerButton.type = "button";
  centerButton.className = "center-bus";
  centerButton.textContent = "Center on bus";
  details.appendChild(centerButton);
  host.parentElement?.querySelector(".avl-runtime")?.appendChild(details);
  const navBanner = document.createElement("div");
  navBanner.className = "map-nav-banner";
  navBanner.hidden = true;
  navBanner.setAttribute("aria-live", "polite");
  navBanner.innerHTML = `<div class="map-nav-current"><span class="map-nav-icon" data-role="current-icon">↑</span><div><small>CURRENT TURN</small><strong data-role="current-text">Continue on route</strong></div></div><div class="map-nav-next"><span class="map-nav-next-icon" data-role="next-icon">↱</span><strong data-role="next-text">Next maneuver</strong></div>`;
  runtime.appendChild(navBanner);
  const navCurrentIcon = navBanner.querySelector<HTMLElement>("[data-role=current-icon]");
  const navCurrentText = navBanner.querySelector<HTMLElement>("[data-role=current-text]");
  const navNextIcon = navBanner.querySelector<HTMLElement>("[data-role=next-icon]");
  const navNextText = navBanner.querySelector<HTMLElement>("[data-role=next-text]");
  const maneuverIcon = (step: MapboxGuidanceStep | undefined) => {
    const modifier = String(step?.modifier || "straight").toLowerCase();
    if (modifier.includes("left")) return "↰";
    if (modifier.includes("right")) return "↱";
    if (modifier.includes("uturn")) return "↶";
    if (modifier.includes("merge")) return "⇢";
    return "↑";
  };
  const updateNavBanner = (activeIndex: number, plan: MapboxGuidancePlan | null) => {
    const current = plan?.steps[activeIndex];
    if (!current) { navBanner.hidden = true; return; }
    navBanner.hidden = false;
    if (navCurrentIcon) navCurrentIcon.textContent = maneuverIcon(current);
    if (navCurrentText) navCurrentText.textContent = current.instruction || "Continue on route";
    const next = plan?.steps[activeIndex + 1];
    if (navNextIcon) navNextIcon.textContent = maneuverIcon(next);
    if (navNextText) navNextText.textContent = next?.instruction || "End of route";
  };
  let busPosition: [number, number] = mapCoordinates[0];
  try {
    const mapboxgl = await loadMapbox();
    if (!host.isConnected) { fallbackResizeObserver.disconnect(); return; }
    if (typeof mapboxgl.supported === "function" && !mapboxgl.supported()) throw new Error("WebGL map unavailable");
    mapboxgl.accessToken = TOKEN;
    // Mapbox Standard keeps all route, stop, GPS, and touch behavior intact while
    // presenting the same map in its native 3D building style.
    const map = new mapboxgl.Map({
      container: mapNode,
      style: "mapbox://styles/mapbox/standard",
      config: { basemap: { lightPreset: "day", show3dObjects: true } },
      center: [-95.974, 41.251],
      zoom: 11.7,
      pitch: 52,
      bearing: 0,
      attributionControl: true,
      interactive: true,
      dragPan: true,
      scrollZoom: true,
      touchZoomRotate: true,
      doubleClickZoom: true,
      antialias: true,
    });
    let mapLoaded = false;
    const showFallback = () => {
      if (mapLoaded) return;
      host.dataset.mapReady = "false";
      host.dataset.mapFallback = "true";
      mapNode.style.display = "none";
      gpsButton.textContent = "Map fallback · GPS ready";
    };
    const loadTimeout = window.setTimeout(showFallback, 10000);
    map.getCanvas().addEventListener("webglcontextlost", event => { event.preventDefault(); mapLoaded = false; showFallback(); });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }), "bottom-right");
    map.dragPan.enable(); map.scrollZoom.enable(); map.touchZoomRotate.enable(); map.doubleClickZoom.enable();
    const guidancePromise = fetchMapboxGuidance(routeNumber, host.dataset.direction || "", mapCoordinates, cumulativeRouteLengths, routeNumber === "3" ? route3Stops.map(stop => stop.coordinates) : [])
      .then(plan => {
        navigationPlan = plan;
        checkpoints = plan.steps.map(step => step.coordinates);
        checkpointProgress = plan.steps.map(step => step.progress);
        updateNavBanner(0, plan);
        gpsEvent({type:"navigation-ready", total:plan.steps.length, provider:"Mapbox"});
        return plan;
      })
      .catch(() => {
        gpsEvent({type:"navigation-fallback", total:checkpoints.length});
        return null;
      });
    const busMarkerElement = document.createElement("div");
    busMarkerElement.className = "live-bus-marker";
    busMarkerElement.setAttribute("role", "img");
    busMarkerElement.setAttribute("aria-label", `Route ${routeNumber} bus location`);
    const busMarkerImage = document.createElement("img");
    busMarkerImage.src = "/metro-bus-marker-rear.png";
    busMarkerImage.alt = "";
    busMarkerImage.draggable = false;
    busMarkerElement.appendChild(busMarkerImage);
    const busMarker = new mapboxgl.Marker({ element: busMarkerElement, anchor: "center" })
      .setLngLat(busPosition)
      .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(`Route ${routeNumber} bus location`))
      .addTo(map);
    let followBus = true;
    let trackUp = false;
    let perspective3d = true;
    let latestTravelHeading: number | null = null;
    let compassHeading: number | null = null;
    // Phone magnetometers are noisy (especially when the handset is being
    // held in a moving vehicle). Keep a circular low-pass value so a few
    // degrees of hand movement do not make Track Up visibly twitch.
    let smoothedCompassHeading: number | null = null;
    let lastCompassMapUpdate = 0;
    let lastGpsCourseAt = 0;
    let compassListening = false;
    let compassHandler: (event: Event) => void = () => {};
    let trackUpButton: HTMLButtonElement | null = null;
    let perspectiveButton: HTMLButtonElement | null = null;
    let fullscreenButton: HTMLButtonElement | null = null;
    let centerMapButton: HTMLButtonElement | null = null;
    let appFullscreen = false;
    let renderedBusPosition: [number, number] = [...busPosition];
    let markerAnimationFrame: number | null = null;
    const normalizeHeading = (value: number) => (value % 360 + 360) % 360;
    const smoothHeading = (previous: number | null, next: number, alpha = .14) => {
      if (previous == null) return normalizeHeading(next);
      const delta = ((next - previous + 540) % 360) - 180;
      if (Math.abs(delta) < 2.5) return previous;
      return normalizeHeading(previous + Math.max(-10, Math.min(10, delta * alpha)));
    };
    const headingLabel = (value: number) => {
      const directions = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"];
      return directions[Math.round(normalizeHeading(value) / 45) % directions.length];
    };
    const updateHeadingReadout = (value: number) => {
      const heading = document.querySelector<HTMLElement>(".avl-heading");
      if (heading) heading.textContent = `${headingLabel(value)} · ${Math.round(value)}°`;
      if (trackUp && followBus && mapLoaded) {
        const now = performance.now();
        if (now - lastCompassMapUpdate >= 180) {
          lastCompassMapUpdate = now;
          map.easeTo({ bearing: value, duration: 180, essential: true });
        }
      }
    };
    const focusBusOnMap = (target: [number, number], zoom: number, duration: number) => {
      if (!followBus || !mapLoaded) return;
      const options: { center: [number, number]; zoom: number; duration: number; easing?: (value: number) => number; bearing?: number } = {
        center: target, zoom, duration,
      };
      if (trackUp && latestTravelHeading != null) options.bearing = latestTravelHeading;
      map.easeTo(options);
    };
    const refreshTrackUpButton = () => {
      if (!trackUpButton) return;
      trackUpButton.classList.toggle("is-active", trackUp);
      trackUpButton.setAttribute("aria-pressed", String(trackUp));
      trackUpButton.setAttribute("aria-label", trackUp ? "Turn Track Up off" : "Turn Track Up on");
      trackUpButton.title = trackUp ? "Track Up is on" : "Turn Track Up on";
      trackUpButton.textContent = trackUp ? "↑ Track" : "N ↑";
    };
    const trackUpControl = {
      onAdd() {
        const container = document.createElement("div");
        container.className = "mapboxgl-ctrl mapboxgl-ctrl-group track-up-group";
        trackUpButton = document.createElement("button");
        trackUpButton.type = "button";
        trackUpButton.className = "track-up-control";
        trackUpButton.addEventListener("click", () => {
          trackUp = !trackUp;
          followBus = true;
          refreshTrackUpButton();
          const bearing = trackUp && latestTravelHeading != null ? latestTravelHeading : 0;
          map.easeTo({ center: renderedBusPosition, zoom: Math.max(map.getZoom(), 14.5), bearing, duration: 450 });
        });
        refreshTrackUpButton();
        container.appendChild(trackUpButton);
        return container;
      },
      onRemove() {
        trackUpButton = null;
      },
    };
    map.addControl(trackUpControl, "bottom-right");
    const centerMapControl = {
      onAdd() {
        const container = document.createElement("div");
        container.className = "mapboxgl-ctrl mapboxgl-ctrl-group center-map-group";
        centerMapButton = document.createElement("button");
        centerMapButton.type = "button";
        centerMapButton.className = "center-map-control";
        centerMapButton.textContent = "⌾";
        centerMapButton.title = "Center on bus";
        centerMapButton.setAttribute("aria-label", "Center on bus");
        centerMapButton.addEventListener("click", () => {
          followBus = true;
          focusBusOnMap(renderedBusPosition, Math.max(map.getZoom(), 14.5), 650);
        });
        container.appendChild(centerMapButton);
        return container;
      },
      onRemove() {
        centerMapButton = null;
      },
    };
    map.addControl(centerMapControl, "bottom-right");
    const refreshPerspectiveButton = () => {
      if (!perspectiveButton) return;
      perspectiveButton.classList.toggle("is-active", perspective3d);
      perspectiveButton.setAttribute("aria-pressed", String(perspective3d));
      perspectiveButton.setAttribute("aria-label", perspective3d ? "Switch to 2D map" : "Switch to 3D map");
      perspectiveButton.title = perspective3d ? "3D perspective on — switch to 2D" : "2D perspective on — switch to 3D";
      perspectiveButton.textContent = perspective3d ? "3D" : "2D";
    };
    const refreshFullscreenButton = () => {
      if (!fullscreenButton) return;
      const active = Boolean(document.fullscreenElement) || appFullscreen;
      fullscreenButton.classList.toggle("is-active", active);
      fullscreenButton.setAttribute("aria-pressed", String(active));
      fullscreenButton.setAttribute("aria-label", active ? "Exit full-screen map" : "Open full-screen map");
      fullscreenButton.title = active ? "Exit full-screen map" : "Open full-screen map";
      fullscreenButton.textContent = active ? "×" : "⛶";
    };
    const syncFullscreen = () => {
      if (document.fullscreenElement) appFullscreen = false;
      host.classList.toggle("map-fullscreen", appFullscreen);
      refreshFullscreenButton();
      window.setTimeout(() => map.resize(), 80);
    };
    const fullscreenControl = {
      onAdd() {
        const container = document.createElement("div");
        container.className = "mapboxgl-ctrl mapboxgl-ctrl-group fullscreen-group";
        fullscreenButton = document.createElement("button");
        fullscreenButton.type = "button";
        fullscreenButton.className = "fullscreen-control";
        fullscreenButton.addEventListener("click", async () => {
          if (document.fullscreenElement === host) {
            await document.exitFullscreen?.();
            return;
          }
          if (appFullscreen) {
            appFullscreen = false;
            syncFullscreen();
            return;
          }
          if (host.requestFullscreen) {
            try {
              await host.requestFullscreen();
              return;
            } catch { /* Use the iPhone-friendly fixed-position fallback below. */ }
          }
          appFullscreen = true;
          syncFullscreen();
        });
        refreshFullscreenButton();
        container.appendChild(fullscreenButton);
        return container;
      },
      onRemove() {
        fullscreenButton = null;
      },
    };
    map.addControl(fullscreenControl, "bottom-right");
    document.addEventListener("fullscreenchange", syncFullscreen);
    const onFullscreenKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && appFullscreen) { appFullscreen = false; syncFullscreen(); }
    };
    document.addEventListener("keydown", onFullscreenKey);
    const perspectiveControl = {
      onAdd() {
        const container = document.createElement("div");
        container.className = "mapboxgl-ctrl mapboxgl-ctrl-group perspective-group";
        perspectiveButton = document.createElement("button");
        perspectiveButton.type = "button";
        perspectiveButton.className = "perspective-control";
        perspectiveButton.addEventListener("click", () => {
          perspective3d = !perspective3d;
          refreshPerspectiveButton();
          // Use a direct camera update so the selected view snaps into place.
          map.jumpTo({ pitch: perspective3d ? 52 : 0 });
        });
        refreshPerspectiveButton();
        container.appendChild(perspectiveButton);
        return container;
      },
      onRemove() {
        perspectiveButton = null;
      },
    };
    map.addControl(perspectiveControl, "bottom-right");
    liveMapCleanups.set(host, () => {
      window.clearTimeout(loadTimeout);
      fallbackResizeObserver.disconnect();
      if (markerAnimationFrame != null) cancelAnimationFrame(markerAnimationFrame);
      if (window.__routeTrainerWatch != null) {
        navigator.geolocation?.clearWatch(window.__routeTrainerWatch);
        window.__routeTrainerWatch = undefined;
      }
      if (compassListening) {
        window.removeEventListener("deviceorientationabsolute", compassHandler as EventListener);
        window.removeEventListener("deviceorientation", compassHandler as EventListener);
        compassListening = false;
      }
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("keydown", onFullscreenKey);
      window.__startRouteGPS = undefined;
      try { map.remove(); } catch { /* Map may already be unavailable. */ }
    });
    let markerHasLiveFix = false;
    const moveBusMarkerSmoothly = (
      target: [number, number],
      options: { accuracyMeters?: number; moving?: boolean; duration?: number } = {},
    ) => {
      if (!Number.isFinite(target[0]) || !Number.isFinite(target[1])) return;
      busPosition = [...target];
      const distanceToTarget = miles(renderedBusPosition, target);
      const jitterThreshold = Math.min(.012, Math.max(.0025, (options.accuracyMeters ?? 10) * .000621371 * .18));
      if (markerHasLiveFix && !options.moving && distanceToTarget < jitterThreshold) return;
      if (markerAnimationFrame != null) cancelAnimationFrame(markerAnimationFrame);
      const source: [number, number] = [...renderedBusPosition];
      const duration = distanceToTarget > .5 || !markerHasLiveFix ? 0 : Math.max(650, Math.min(1500, options.duration ?? 1050));
      markerHasLiveFix = true;
      if (duration === 0) {
        renderedBusPosition = [...target];
        busMarker.setLngLat(renderedBusPosition);
        focusBusOnMap(target, 15.5, 650);
        return;
      }
      const startedAt = performance.now();
      const animate = (timestamp: number) => {
        if (!host.isConnected) { markerAnimationFrame = null; return; }
        const progress = Math.min(1, (timestamp - startedAt) / duration);
        renderedBusPosition = [
          source[0] + (target[0] - source[0]) * progress,
          source[1] + (target[1] - source[1]) * progress,
        ];
        busMarker.setLngLat(renderedBusPosition);
        if (progress < 1) markerAnimationFrame = requestAnimationFrame(animate);
        else markerAnimationFrame = null;
      };
      markerAnimationFrame = requestAnimationFrame(animate);
      focusBusOnMap(target, 15.5, duration);
    };
    centerButton.onclick = () => {
      followBus = true;
      focusBusOnMap(renderedBusPosition, Math.max(map.getZoom(), 14.5), 650);
    };
    map.on("dragstart", () => { followBus = false; });
    map.on("zoomstart", (event: any) => { if (event.originalEvent) followBus = false; });
    map.on("load", async () => {
      map.resize();
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      map.resize();
      const mapRect = mapNode.getBoundingClientRect();
      if (mapRect.width < 100 || mapRect.height < 100 || map.getCanvas().width < 100 || map.getCanvas().height < 100) {
        showFallback();
        return;
      }
      const routeData = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: mapCoordinates } };
      const stopData = { type: "FeatureCollection", features: stops.map((stop, i) => ({ type: "Feature", properties: { name: stop.name, number: i + 1 }, geometry: { type: "Point", coordinates: stop.coordinates } })) };
      const turnData = { type: "FeatureCollection", features: routeNumber === "30" ? route30Turns.map((turn, i) => ({ type: "Feature", properties: { name: turn.name, number: i + 1 }, geometry: { type: "Point", coordinates: turn.coordinates } })) : [] };
      map.addSource("route-11", { type: "geojson", data: routeData });
      map.addLayer({ id: "route-11-outline", type: "line", source: "route-11", paint: { "line-color": "#17263a", "line-width": 7, "line-opacity": .8 } });
      map.addLayer({ id: "route-11-line", type: "line", source: "route-11", paint: { "line-color": "#efb81d", "line-width": 4 } });
      map.addSource("route-11-stops", { type: "geojson", data: stopData });
      map.addLayer({ id: "route-11-stop-dots", type: "circle", source: "route-11-stops", paint: { "circle-radius": 7, "circle-color": "#ffffff", "circle-stroke-color": "#17263a", "circle-stroke-width": 3 } });
      map.addLayer({ id: "route-11-stop-labels", type: "symbol", source: "route-11-stops", minzoom: 13, layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.25], "text-anchor": "top", "text-allow-overlap": false, "text-ignore-placement": false }, paint: { "text-color": "#17263a", "text-halo-color": "#ffffff", "text-halo-width": 2 } });
      map.on("click", "route-11-stop-dots", (event: any) => {
        const feature = event.features?.[0];
        if (!feature) return;
        new mapboxgl.Popup({ offset: 12 }).setLngLat(feature.geometry.coordinates).setText(`Stop ${feature.properties.number}: ${feature.properties.name}`).addTo(map);
      });
      map.on("mouseenter", "route-11-stop-dots", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "route-11-stop-dots", () => { map.getCanvas().style.cursor = ""; });
      if (routeNumber === "30") {
        map.addSource("route-30-turns", { type: "geojson", data: turnData });
        map.addLayer({ id: "route-30-turn-dots", type: "circle", source: "route-30-turns", paint: { "circle-radius": 4, "circle-color": "#efb81d", "circle-stroke-color": "#17263a", "circle-stroke-width": 2 } });
      }
      stops.forEach((stop, i) => {
        if (i !== 0 && i !== stops.length - 1) return;
        const stopEl = document.createElement("button");
        stopEl.className = `route-stop-marker ${i === 0 ? "start" : i === stops.length - 1 ? "finish" : ""}`;
        stopEl.type = "button"; stopEl.title = stop.name; stopEl.setAttribute("aria-label", `Stop ${i + 1}: ${stop.name}`); stopEl.innerHTML = `<span>${i + 1}</span><small>${stop.name}</small>`;
        new mapboxgl.Marker({ element: stopEl, anchor: "center" }).setLngLat(stop.coordinates).addTo(map);
      });
      mapLoaded = true;
      window.clearTimeout(loadTimeout);
      host.dataset.mapReady = "true";
      host.dataset.mapFallback = "false";
      const bounds = mapCoordinates.reduce((b: any, p) => b.extend(p), new mapboxgl.LngLatBounds(mapCoordinates[0], mapCoordinates[0]));
      map.fitBounds(bounds, { padding: 45, duration: 0 });
      requestAnimationFrame(() => map.resize());
    });
    const startGps = async () => {
      if (!navigator.geolocation) { gpsButton.textContent = "GPS unavailable"; return; }
      gpsButton.textContent = "Locating…";
      // iOS Safari requires this permission request to happen directly from
      // the user's Live GPS tap before compass readings are delivered.
      const orientationApi = (window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> } | undefined);
      if (orientationApi && typeof orientationApi.requestPermission === "function") {
        try { await orientationApi.requestPermission(); } catch { /* GPS still works if compass permission is declined. */ }
      }
      if (!compassListening) {
        compassHandler = (event: Event) => {
          const orientation = event as DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
          let heading: number | null = null;
          if (Number.isFinite(orientation.webkitCompassHeading)) heading = Number(orientation.webkitCompassHeading);
          else if (orientation.absolute && Number.isFinite(orientation.alpha)) heading = 360 - Number(orientation.alpha);
          if (heading == null || !Number.isFinite(heading)) return;
          compassHeading = smoothHeading(smoothedCompassHeading, heading);
          smoothedCompassHeading = compassHeading;
          // Compass is a fallback for facing direction. GPS course, when
          // available, takes precedence below because it is steadier while
          // the bus is moving.
          if (performance.now() - lastGpsCourseAt > 1400) {
            latestTravelHeading = compassHeading;
            updateHeadingReadout(compassHeading);
          }
        };
        window.addEventListener("deviceorientationabsolute", compassHandler as EventListener, { passive: true });
        window.addEventListener("deviceorientation", compassHandler as EventListener, { passive: true });
        compassListening = true;
      }
      let targetIndex = 0, promptStage = 0, completionFixes = 0, offRouteFixes = 0, onRouteFixes = 0, offRouteAnnounced = false;
      let initialized = false, headingLocked = false, lastPosition: [number, number] | null = null, lastRouteSegment = 1, lastAlong: number | null = null;
      let fixCount = 0, wrongWayFixes = 0, wrongWayAnnounced = false, weakGpsAnnounced = false;
      let mapMatchedPosition: [number, number] | null = null, mapMatchedAt = 0, mapMatchInFlight = false, lastMapMatchRequest = 0;
      let lastMarkerFixAt = 0;
      const gpsTrace: {coordinates:[number,number]; accuracy:number; timestamp:number}[] = [];
      const announcedStops = new Set<number>();
      const spokenMapboxVoices = new Set<string>();
      followBus = true;
      // Fired synchronously from the Start live GPS tap. This unlocks spoken
      // guidance on iPhone Safari before asynchronous location fixes arrive.
      gpsEvent({type:"start"});
      await guidancePromise;
      if (window.__routeTrainerWatch != null) navigator.geolocation.clearWatch(window.__routeTrainerWatch);
      window.__routeTrainerWatch = navigator.geolocation.watchPosition(position => {
        const rawCurrent: [number, number] = [position.coords.longitude, position.coords.latitude];
        const moved = lastPosition ? miles(lastPosition, rawCurrent) : 0;
        const moving = (position.coords.speed ?? 0) > 1.5 || moved > .004;
        const movementHeading = Number.isFinite(position.coords.heading) && position.coords.heading != null
          ? normalizeHeading(position.coords.heading)
          : lastPosition && moved > .004 ? bearing(lastPosition, rawCurrent) : compassHeading;
        if (movementHeading != null && (position.coords.heading != null || lastPosition && moved > .004)) {
          if (position.coords.heading != null) lastGpsCourseAt = performance.now();
          latestTravelHeading = movementHeading;
          updateHeadingReadout(movementHeading);
        }
        const markerDuration = lastMarkerFixAt ? Math.max(700, Math.min(1400, position.timestamp - lastMarkerFixAt + 200)) : 0;
        lastMarkerFixAt = position.timestamp;
        gpsTrace.push({coordinates:rawCurrent, accuracy:Math.min(50, Math.max(5, position.coords.accuracy)), timestamp:Math.floor(position.timestamp / 1000)});
        if (gpsTrace.length > 8) gpsTrace.shift();
        const now = Date.now();
        if (gpsTrace.length >= 2 && !mapMatchInFlight && now - lastMapMatchRequest >= 4000) {
          mapMatchInFlight = true; lastMapMatchRequest = now;
          const trace = [...gpsTrace], coordinates = trace.map(item => item.coordinates.join(",")).join(";");
          const radiuses = trace.map(item => Math.round(item.accuracy)).join(";");
          const timestamps = trace.map(item => item.timestamp).join(";");
          fetch(`https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}?access_token=${TOKEN}&geometries=geojson&tidy=true&radiuses=${radiuses}&timestamps=${timestamps}`)
            .then(response => response.ok ? response.json() : Promise.reject(new Error("Map matching unavailable")))
            .then(data => {
              const tracepoints = data?.tracepoints, candidate = tracepoints?.[tracepoints.length - 1]?.location;
              const confidence = Number(data?.matchings?.[0]?.confidence ?? 0);
              if (!Array.isArray(candidate) || confidence < .2) return;
              const snapped: [number,number] = [Number(candidate[0]), Number(candidate[1])];
              if (!Number.isFinite(snapped[0]) || !Number.isFinite(snapped[1]) || miles(rawCurrent, snapped) > .18) return;
              mapMatchedPosition = snapped; mapMatchedAt = Date.now();
              moveBusMarkerSmoothly(snapped, { accuracyMeters: position.coords.accuracy, moving, duration: markerDuration });
            })
            .catch(() => { /* Raw high-accuracy GPS remains the safe fallback. */ })
            .finally(() => { mapMatchInFlight = false; });
        }
        // A snapped point represents only the latest trace sample. Reusing it
        // for several seconds made the marker freeze and then jump.
        const mapMatchFresh = Boolean(mapMatchedPosition && now - mapMatchedAt < 1800);
        // The asynchronous matcher has already animated its own trace sample.
        // New phone fixes must keep moving forward instead of reusing that
        // older snapped coordinate.
        const current: [number, number] = rawCurrent;
        moveBusMarkerSmoothly(current, { accuracyMeters: position.coords.accuracy, moving, duration: markerDuration });
        fixCount += 1;
        const rawRouteMatch = projectOnRoute(rawCurrent, mapCoordinates, cumulativeRouteLengths, {heading:movementHeading});
        const globalMatch = projectOnRoute(current, mapCoordinates, cumulativeRouteLengths, {heading:movementHeading});
        const localMatch = initialized ? projectOnRoute(current, mapCoordinates, cumulativeRouteLengths, {
          startSegment:Math.max(1,lastRouteSegment - 18), endSegment:lastRouteSegment + 110,
          heading:movementHeading, referenceAlong:lastAlong,
        }) : globalMatch;
        // During startup, heading decides between overlapping outbound and
        // inbound paths. After lock-on, continuity prevents jumps to another
        // pass of the same street while still allowing recovery after a gap.
        const resolvingHeading = initialized && !headingLocked && movementHeading != null;
        const routeMatch = !initialized || fixCount <= 4 || resolvingHeading || localMatch.distance > .25 ? globalMatch : localMatch;
        const reliableGps = position.coords.accuracy <= 55;
        if (!reliableGps && !weakGpsAnnounced) { weakGpsAnnounced = true; gpsEvent({type:"gps-weak"}); }
        if (reliableGps) weakGpsAnnounced = false;
        if (!initialized && reliableGps) {
          const ahead = checkpointProgress.findIndex(progress => progress >= routeMatch.along + .01);
          targetIndex = ahead < 0 ? checkpoints.length - 1 : ahead;
          initialized = true;
          const guidance = navigationPlan?.steps[targetIndex];
          if (guidance) {
            const remainingMeters = Math.max(0, guidance.progress - routeMatch.along) * 1609.344;
            guidance.voiceInstructions.forEach((voice, voiceIndex) => {
              if (voice.distanceAlongGeometry >= remainingMeters) spokenMapboxVoices.add(`${targetIndex}:${voiceIndex}`);
            });
          }
          gpsEvent({type:"acquired", index:targetIndex, total:navigationPlan?.steps.length, instruction:guidance?.instruction, modifier:guidance?.modifier, provider:navigationPlan?"Mapbox":"operator"});
        } else if (initialized && !headingLocked && movementHeading != null) {
          const corrected = checkpointProgress.findIndex(progress => progress >= routeMatch.along + .01);
          const correctedTarget = corrected < 0 ? checkpoints.length - 1 : corrected;
          if (Math.abs(correctedTarget - targetIndex) > 1) {
            targetIndex = correctedTarget; promptStage = 0; completionFixes = 0;
            const guidance = navigationPlan?.steps[targetIndex];
            gpsEvent({type:"reacquired", index:targetIndex, total:navigationPlan?.steps.length, instruction:guidance?.instruction, modifier:guidance?.modifier, provider:navigationPlan?"Mapbox":"operator"});
          }
          headingLocked = true;
        }
        updateNavBanner(targetIndex, navigationPlan);
        const maneuverDistance = Math.max(0, checkpointProgress[Math.min(targetIndex, checkpointProgress.length - 1)] - routeMatch.along);
        const nearestStop = stops.map((stop, i) => ({i, stop, distance:miles(current, stop.coordinates)})).sort((a, b) => a.distance - b.distance)[0];
        const routeDistance = rawRouteMatch.distance;
        const status = document.querySelector<HTMLElement>(".live-status span");
        const distance = document.querySelector<HTMLElement>(".next b");
        const routeTolerance = Math.max(.12, position.coords.accuracy * 0.000621371 + .04);
        const onRoute = routeDistance < routeTolerance;
        offRouteFixes = onRoute ? 0 : offRouteFixes + 1; onRouteFixes = onRoute ? onRouteFixes + 1 : 0;
        if (offRouteFixes >= 3 && !offRouteAnnounced) { offRouteAnnounced = true; gpsEvent({type:"off-route"}); }
        if (onRouteFixes >= 2 && offRouteAnnounced) { offRouteAnnounced = false; gpsEvent({type:"back-on-route"}); }
        const wrongWay = reliableGps && onRoute && moving && movementHeading != null && headingDifference(movementHeading, routeMatch.routeBearing) > 105;
        wrongWayFixes = wrongWay ? wrongWayFixes + 1 : 0;
        if (wrongWayFixes >= 3 && !wrongWayAnnounced) { wrongWayAnnounced = true; gpsEvent({type:"wrong-way"}); }
        if (!wrongWay && wrongWayAnnounced) { wrongWayAnnounced = false; gpsEvent({type:"direction-correct"}); }
        lastPosition = rawCurrent; lastRouteSegment = routeMatch.segment; lastAlong = routeMatch.along;
        if (status) { status.textContent = onRoute ? "ON ROUTE" : "OFF ROUTE"; status.className = onRoute ? "tracking" : "off-route"; }
        gpsEvent({type:"status", status:onRoute ? "tracking" : "off-route"});
        if (distance) distance.textContent = `${maneuverDistance < .1 ? Math.round(maneuverDistance * 5280) + " ft" : maneuverDistance.toFixed(1) + " mi"}`;
        if (navigationPlan && reliableGps && onRoute && !wrongWay) {
          const guidance = navigationPlan.steps[targetIndex];
          const remainingMeters = maneuverDistance * 1609.344;
          const eligible = guidance?.voiceInstructions
            .map((voice, voiceIndex) => ({voice, voiceIndex, key:`${targetIndex}:${voiceIndex}`}))
            .filter(item => !spokenMapboxVoices.has(item.key) && remainingMeters <= item.voice.distanceAlongGeometry + 12)
            .sort((a, b) => b.voice.distanceAlongGeometry - a.voice.distanceAlongGeometry);
          const prompt = eligible?.[0];
          if (prompt) {
            spokenMapboxVoices.add(prompt.key);
            gpsEvent({type:"mapbox-voice", index:targetIndex, total:navigationPlan.steps.length, instruction:guidance.instruction, modifier:guidance.modifier, announcement:prompt.voice.announcement});
          }
        } else if (!navigationPlan && reliableGps && onRoute && !wrongWay) {
          if (promptStage < 3 && maneuverDistance <= .035) { promptStage = 3; gpsEvent({type:"now", index:targetIndex, distance:maneuverDistance}); }
          else if (promptStage < 2 && maneuverDistance <= .12) { promptStage = 2; gpsEvent({type:"near", index:targetIndex, distance:maneuverDistance}); }
          else if (promptStage < 1 && maneuverDistance <= .50) { promptStage = 1; gpsEvent({type:"prepare", index:targetIndex, distance:maneuverDistance}); }
        }
        if (reliableGps && onRoute && maneuverDistance > .08 && nearestStop.distance <= 300 / 5280 && !announcedStops.has(nearestStop.i)) {
          announcedStops.add(nearestStop.i);
          gpsEvent({type:"stop-ahead", stopName:nearestStop.stop.name, stopNumber:nearestStop.i + 1, distanceFeet:Math.round(nearestStop.distance * 5280)});
        }
        const passedManeuver = promptStage < 4 && reliableGps && onRoute && !wrongWay && routeMatch.along >= checkpointProgress[targetIndex] + .012;
        completionFixes = passedManeuver ? completionFixes + 1 : 0;
        if (completionFixes >= 2) {
          const completed = targetIndex;
          if (targetIndex < checkpoints.length - 1) { targetIndex += 1; promptStage = 0; completionFixes = 0; }
          else { promptStage = 4; completionFixes = 0; }
          const nextGuidance = navigationPlan?.steps[targetIndex];
          updateNavBanner(targetIndex, navigationPlan);
          gpsEvent({type:"complete", index:completed, nextIndex:targetIndex, total:navigationPlan?.steps.length, finished:completed === checkpoints.length - 1, instruction:nextGuidance?.instruction, modifier:nextGuidance?.modifier, provider:navigationPlan?"Mapbox":"operator"});
        }
        const accuracy = document.querySelector<HTMLElement>(".avl-accuracy");
        const updated = document.querySelector<HTMLElement>(".avl-updated");
        if (accuracy) accuracy.textContent = `±${Math.round(position.coords.accuracy * 3.28084)} ft`;
        if (updated) updated.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
        gpsButton.textContent = `${mapMatchFresh ? "Road matched" : "GPS active"} · ±${Math.round(position.coords.accuracy * 3.28084)} ft`;
      }, error => { gpsButton.textContent = error.code === 1 ? "Location permission denied" : "Unable to get location"; }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 });
    };
    gpsButton.onclick = startGps;
    window.__startRouteGPS = startGps;
  } catch {
    mapNode.remove();
    host.dataset.mapFallback = "true";
    gpsButton.textContent = "Map fallback · GPS ready";
    liveMapCleanups.set(host, () => fallbackResizeObserver.disconnect());
  }
}

if (typeof window !== "undefined") {
  const scan = () => {
    liveMapCleanups.forEach((cleanup, host) => {
      if (!host.isConnected) { cleanup(); liveMapCleanups.delete(host); }
    });
    document.querySelectorAll<HTMLElement>(".live .map").forEach(mountLiveMap);
  };
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  queueMicrotask(scan);
}
import {
  ROUTE30_NORTH_SHAPE,
  ROUTE30_NORTH_STOPS as OFFICIAL_ROUTE30_NORTH_STOPS,
  ROUTE30_SOUTH_SHAPE,
  ROUTE30_SOUTH_STOPS as OFFICIAL_ROUTE30_SOUTH_STOPS,
} from "./route30-official";
import {
  ROUTE3_NORTH_SHAPE,
  ROUTE3_NORTH_STOPS,
  ROUTE3_SOUTH_SHAPE,
  ROUTE3_SOUTH_STOPS,
} from "./route3-official";
import {
  ROUTE5_NORTH_SHAPE,
  ROUTE5_NORTH_STOPS,
  ROUTE5_SOUTH_SHAPE,
  ROUTE5_SOUTH_STOPS,
} from "./route5-official";
import {
  ROUTE8_NORTH_SHAPE,
  ROUTE8_NORTH_STOPS,
  ROUTE8_SOUTH_SHAPE,
  ROUTE8_SOUTH_STOPS,
} from "./route8-official";
import {
  ROUTE24_NORTH_SHAPE,
  ROUTE24_NORTH_STOPS,
  ROUTE24_SOUTH_SHAPE,
  ROUTE24_SOUTH_STOPS,
} from "./route24-official";
import {
  ROUTE11_EAST_SHAPE,
  ROUTE11_EAST_STOPS,
  ROUTE11_WEST_SHAPE,
  ROUTE11_WEST_STOPS,
} from "./route11-official";
import {
  ROUTE4_EAST_SHAPE,
  ROUTE4_EAST_STOPS,
  ROUTE4_WEST_SHAPE,
  ROUTE4_WEST_STOPS,
} from "./route4-official";
import {
  ROUTE14_EAST_SHAPE,
  ROUTE14_EAST_STOPS,
  ROUTE14_WEST_SHAPE,
  ROUTE14_WEST_STOPS,
} from "./route14-official";
import {
  ROUTE35_NORTH_SHAPE,
  ROUTE35_NORTH_STOPS,
  ROUTE35_SOUTH_SHAPE,
  ROUTE35_SOUTH_STOPS,
} from "./route35-official";
import {
  ROUTE36_NORTH_SHAPE,
  ROUTE36_NORTH_STOPS,
  ROUTE36_SOUTH_SHAPE,
  ROUTE36_SOUTH_STOPS,
} from "./route36-official";
import {
  ROUTE26_LOOP_SHAPE,
  ROUTE26_LOOP_STOPS,
} from "./route26-official";
import {
  ROUTE15_EAST_SHAPE,
  ROUTE15_EAST_STOPS,
  ROUTE15_WEST_SHAPE,
  ROUTE15_WEST_STOPS,
} from "./route15-official";
import {
  ROUTE55_EAST_SHAPE,
  ROUTE55_EAST_STOPS,
  ROUTE55_WEST_SHAPE,
  ROUTE55_WEST_STOPS,
} from "./route55-official";
import {
  ROUTE95_NORTH_SHAPE,
  ROUTE95_NORTH_STOPS,
  ROUTE95_SOUTH_SHAPE,
  ROUTE95_SOUTH_STOPS,
} from "./route95-official";

