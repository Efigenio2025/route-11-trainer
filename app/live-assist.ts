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

function loadMapbox(): Promise<any> {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  return new Promise((resolve, reject) => {
    if (!document.querySelector("link[data-mapbox]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.25.0/mapbox-gl.css";
      link.dataset.mapbox = "true";
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>("script[data-mapbox]");
    if (existing) { existing.addEventListener("load", () => resolve(window.mapboxgl)); return; }
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.25.0/mapbox-gl.js";
    script.dataset.mapbox = "true";
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = reject;
    document.head.appendChild(script);
  });
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

function sampleOrderedWaypoints(points: [number, number][], maximum: number) {
  if (points.length <= maximum) return points;
  return Array.from({length:maximum}, (_, index) => points[Math.round(index * (points.length - 1) / (maximum - 1))])
    .filter((point, index, sampled) => index === 0 || point !== sampled[index - 1]);
}

function appleMapsRouteUrl(source: [number, number], destination: [number, number], waypoints: [number, number][]) {
  const coordinate = ([longitude, latitude]: [number, number]) => `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const parameters = new URLSearchParams({
    source:coordinate(source),
    destination:coordinate(destination),
    mode:"driving",
    start:"3",
  });
  waypoints.forEach(point => parameters.append("waypoint", coordinate(point)));
  return `https://maps.apple.com/directions?${parameters.toString()}`;
}

function googleMapsRouteUrl(source: [number, number], destination: [number, number], waypoints: [number, number][]) {
  const coordinate = ([longitude, latitude]: [number, number]) => `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const parameters = new URLSearchParams({
    api:"1",
    origin:coordinate(source),
    destination:coordinate(destination),
    travelmode:"driving",
    dir_action:"navigate",
  });
  if (waypoints.length) parameters.set("waypoints", waypoints.map(coordinate).join("|"));
  return `https://www.google.com/maps/dir/?${parameters.toString()}`;
}

async function mountLiveMap(host: HTMLElement) {
  if (host.dataset.enhanced) return;
  host.dataset.enhanced = "true";
  const routeNumber = host.dataset.route || "11";
  const route30South = routeNumber === "30" && host.dataset.direction === "southbound";
  const route11East = routeNumber === "11" && host.dataset.direction === "eastbound";
  const route4East = routeNumber === "4" && host.dataset.direction === "eastbound";
  const route30Turns = route30South ? ROUTE30_SOUTH_TURNS : ROUTE30_NORTH_TURNS;
  const route30Stops = route30South ? OFFICIAL_ROUTE30_SOUTH_STOPS : OFFICIAL_ROUTE30_NORTH_STOPS;
  const route30Shape = route30South ? ROUTE30_SOUTH_SHAPE : ROUTE30_NORTH_SHAPE;
  const route11Stops = route11East ? ROUTE11_EAST_STOPS : ROUTE11_WEST_STOPS;
  const route11Shape = route11East ? ROUTE11_EAST_SHAPE : ROUTE11_WEST_SHAPE;
  const route4Stops = route4East ? ROUTE4_EAST_STOPS : ROUTE4_WEST_STOPS;
  const route4Shape = route4East ? ROUTE4_EAST_SHAPE : ROUTE4_WEST_SHAPE;
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
  const mapCoordinates = routeNumber === "30" ? route30Shape : routeNumber === "4" ? route4Shape : routeNumber === "35" ? route35Shape : routeNumber === "36" ? route36Shape : routeNumber === "26" ? route26Shape : routeNumber === "15" ? route15Shape : routeNumber === "55" ? route55Shape : routeNumber === "95" ? route95Shape : route11Shape;
  const checkpoints = routeNumber === "30"
    ? route30Turns.map(point => point.coordinates)
    : routeNumber === "95" ? (route95Am ? ROUTE95_AM_TURNS : ROUTE95_PM_TURNS)
    : calibratedCheckpoints(mapCoordinates, maneuverCount);
  const cumulativeRouteLengths = routeLengths(mapCoordinates);
  const checkpointProgress = orderedCheckpointProgress(checkpoints, mapCoordinates, cumulativeRouteLengths);
  const stops: MapPoint[] = routeNumber === "30"
    ? route30Stops
    : routeNumber === "4" ? route4Stops : routeNumber === "35" ? route35Stops : routeNumber === "36" ? route36Stops : routeNumber === "26" ? route26Stops : routeNumber === "15" ? route15Stops : routeNumber === "55" ? route55Stops : routeNumber === "95" ? route95Stops : route11Stops;
  const fallback = document.createElement("canvas");
  fallback.className = "route-canvas";
  fallback.setAttribute("aria-label", `Route ${routeNumber} path`);
  host.prepend(fallback);
  const drawFallback = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2), rect = host.getBoundingClientRect();
    fallback.width = Math.max(1, Math.round(rect.width * ratio)); fallback.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = fallback.getContext("2d"); if (!ctx) return; ctx.scale(ratio, ratio);
    const pad = 34, minX = Math.min(...mapCoordinates.map(p => p[0])), maxX = Math.max(...mapCoordinates.map(p => p[0])), minY = Math.min(...mapCoordinates.map(p => p[1])), maxY = Math.max(...mapCoordinates.map(p => p[1]));
    const point = (p: [number, number]) => [pad + (p[0]-minX)/(maxX-minX)*(rect.width-pad*2), pad + (maxY-p[1])/(maxY-minY)*(rect.height-pad*2)] as const;
    const paint = (color:string,width:number) => {ctx.beginPath();mapCoordinates.forEach((p,i)=>{const [x,y]=point(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke()};
    paint("#17263a",7); paint("#efb81d",4);
    checkpoints.forEach((p,i)=>{const[x,y]=point(p);ctx.beginPath();ctx.arc(x,y,i===0||i===checkpoints.length-1?7:4,0,Math.PI*2);ctx.fillStyle=i===0?"#148b63":i===checkpoints.length-1?"#d65572":"#fff";ctx.fill();ctx.strokeStyle="#17263a";ctx.lineWidth=2;ctx.stroke()});
  };
  drawFallback(); new ResizeObserver(drawFallback).observe(host);
  const mapNode = document.createElement("div");
  mapNode.className = "mapbox-canvas";
  host.prepend(mapNode);
  const gpsButton = document.createElement("button");
  gpsButton.className = "gps-button";
  gpsButton.textContent = "⌖ Use phone GPS";
  host.appendChild(gpsButton);
  const details = document.createElement("div");
  details.className = "avl-details";
  details.innerHTML = `<span>GPS <b class="avl-accuracy">—</b></span><span>UPDATED <b class="avl-updated">—</b></span>`;
  const centerButton = document.createElement("button");
  centerButton.type = "button";
  centerButton.className = "center-bus";
  centerButton.textContent = "Center on bus";
  details.appendChild(centerButton);
  const appleMapsButton = document.createElement("button");
  appleMapsButton.type = "button";
  appleMapsButton.className = "apple-maps-button";
  appleMapsButton.textContent = "Start Apple Maps navigation";
  details.appendChild(appleMapsButton);
  const googleMapsButton = document.createElement("button");
  googleMapsButton.type = "button";
  googleMapsButton.className = "google-maps-button";
  googleMapsButton.textContent = "Start Google Maps navigation";
  details.appendChild(googleMapsButton);
  const appleMapsNote = document.createElement("small");
  appleMapsNote.className = "apple-maps-note";
  appleMapsNote.textContent = "Choose Apple or Google for spoken driving guidance. Route Trainer alerts may pause while another navigation app is open.";
  details.appendChild(appleMapsNote);
  host.parentElement?.querySelector(".live-panel")?.prepend(details);
  let busPosition: [number, number] = mapCoordinates[0];
  let currentRouteProgress = 0;
  appleMapsButton.onclick = () => {
    const destination = mapCoordinates[mapCoordinates.length - 1];
    const remainingTurns = checkpoints.filter((point, index) =>
      checkpointProgress[index] > currentRouteProgress + .01 && miles(point, destination) > .03
    );
    const previewUrl = appleMapsRouteUrl(busPosition, destination, sampleOrderedWaypoints(remainingTurns, 8));
    window.location.assign(previewUrl);
  };
  googleMapsButton.onclick = () => {
    const destination = mapCoordinates[mapCoordinates.length - 1];
    const remainingTurns = checkpoints.filter((point, index) =>
      checkpointProgress[index] > currentRouteProgress + .01 && miles(point, destination) > .03
    );
    const navigationUrl = googleMapsRouteUrl(busPosition, destination, sampleOrderedWaypoints(remainingTurns, 3));
    window.location.assign(navigationUrl);
  };
  try {
    const mapboxgl = await loadMapbox();
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({ container: mapNode, style: "mapbox://styles/mapbox/streets-v12", center: [-95.974, 41.251], zoom: 11.7, attributionControl: true, interactive: true, dragPan: true, scrollZoom: true, touchZoomRotate: true, doubleClickZoom: true });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }), "bottom-right");
    map.dragPan.enable(); map.scrollZoom.enable(); map.touchZoomRotate.enable(); map.doubleClickZoom.enable();
    const busMarker = new mapboxgl.Marker({ color: "#17263a", scale: 0.85 })
      .setLngLat(busPosition)
      .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(`Route ${routeNumber} bus location`))
      .addTo(map);
    let followBus = true;
    centerButton.onclick = () => { followBus = true; map.easeTo({ center: busPosition, zoom: Math.max(map.getZoom(), 14.5), duration: 500 }); };
    map.on("dragstart", () => { followBus = false; });
    map.on("zoomstart", (event: any) => { if (event.originalEvent) followBus = false; });
    map.on("load", async () => {
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
      host.dataset.mapReady = "true";
      const bounds = mapCoordinates.reduce((b: any, p) => b.extend(p), new mapboxgl.LngLatBounds(mapCoordinates[0], mapCoordinates[0]));
      map.fitBounds(bounds, { padding: 45, duration: 0 });
    });
    const startGps = () => {
      if (!navigator.geolocation) { gpsButton.textContent = "GPS unavailable"; return; }
      gpsButton.textContent = "Locating…";
      let targetIndex = 0, promptStage = 0, completionFixes = 0, offRouteFixes = 0, onRouteFixes = 0, offRouteAnnounced = false;
      let initialized = false, headingLocked = false, lastPosition: [number, number] | null = null, lastRouteSegment = 1, lastAlong: number | null = null;
      let fixCount = 0, wrongWayFixes = 0, wrongWayAnnounced = false, weakGpsAnnounced = false;
      let mapMatchedPosition: [number, number] | null = null, mapMatchedAt = 0, mapMatchInFlight = false, lastMapMatchRequest = 0;
      const gpsTrace: {coordinates:[number,number]; accuracy:number; timestamp:number}[] = [];
      const announcedStops = new Set<number>();
      followBus = true;
      // Fired synchronously from the Start live GPS tap. This unlocks spoken
      // guidance on iPhone Safari before asynchronous location fixes arrive.
      gpsEvent({type:"start"});
      if (window.__routeTrainerWatch != null) navigator.geolocation.clearWatch(window.__routeTrainerWatch);
      window.__routeTrainerWatch = navigator.geolocation.watchPosition(position => {
        const rawCurrent: [number, number] = [position.coords.longitude, position.coords.latitude];
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
              busPosition = snapped; busMarker.setLngLat(snapped);
              if (followBus) map.easeTo({center:snapped, zoom:15.5, duration:350});
            })
            .catch(() => { /* Raw high-accuracy GPS remains the safe fallback. */ })
            .finally(() => { mapMatchInFlight = false; });
        }
        const mapMatchFresh = mapMatchedPosition && now - mapMatchedAt < 9000;
        const current: [number, number] = mapMatchFresh ? mapMatchedPosition! : rawCurrent;
        busPosition = current; busMarker.setLngLat(current); if (followBus) map.easeTo({ center: current, zoom: 15.5, duration: 500 });
        fixCount += 1;
        const moved = lastPosition ? miles(lastPosition, rawCurrent) : 0;
        const movementHeading = Number.isFinite(position.coords.heading) && position.coords.heading != null
          ? position.coords.heading
          : lastPosition && moved > .004 ? bearing(lastPosition, rawCurrent) : null;
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
        currentRouteProgress = routeMatch.along;
        const reliableGps = position.coords.accuracy <= 55;
        if (!reliableGps && !weakGpsAnnounced) { weakGpsAnnounced = true; gpsEvent({type:"gps-weak"}); }
        if (reliableGps) weakGpsAnnounced = false;
        if (!initialized && reliableGps) {
          const ahead = checkpointProgress.findIndex(progress => progress >= routeMatch.along + .01);
          targetIndex = ahead < 0 ? checkpoints.length - 1 : ahead;
          initialized = true;
          gpsEvent({type:"acquired", index:targetIndex});
        } else if (initialized && !headingLocked && movementHeading != null) {
          const corrected = checkpointProgress.findIndex(progress => progress >= routeMatch.along + .01);
          const correctedTarget = corrected < 0 ? checkpoints.length - 1 : corrected;
          if (Math.abs(correctedTarget - targetIndex) > 1) {
            targetIndex = correctedTarget; promptStage = 0; completionFixes = 0;
            gpsEvent({type:"reacquired", index:targetIndex});
          }
          headingLocked = true;
        }
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
        const moving = (position.coords.speed ?? 0) > 1.5 || moved > .004;
        const wrongWay = reliableGps && onRoute && moving && movementHeading != null && headingDifference(movementHeading, routeMatch.routeBearing) > 105;
        wrongWayFixes = wrongWay ? wrongWayFixes + 1 : 0;
        if (wrongWayFixes >= 3 && !wrongWayAnnounced) { wrongWayAnnounced = true; gpsEvent({type:"wrong-way"}); }
        if (!wrongWay && wrongWayAnnounced) { wrongWayAnnounced = false; gpsEvent({type:"direction-correct"}); }
        lastPosition = rawCurrent; lastRouteSegment = routeMatch.segment; lastAlong = routeMatch.along;
        if (status) { status.textContent = onRoute ? "ON ROUTE" : "OFF ROUTE"; status.className = onRoute ? "tracking" : "off-route"; }
        gpsEvent({type:"status", status:onRoute ? "tracking" : "off-route"});
        if (distance) distance.textContent = `${maneuverDistance < .1 ? Math.round(maneuverDistance * 5280) + " ft" : maneuverDistance.toFixed(1) + " mi"}`;
        if (reliableGps && onRoute && !wrongWay) {
          if (promptStage < 3 && maneuverDistance <= .035) { promptStage = 3; gpsEvent({type:"now", index:targetIndex, distance:maneuverDistance}); }
          else if (promptStage < 2 && maneuverDistance <= .12) { promptStage = 2; gpsEvent({type:"near", index:targetIndex, distance:maneuverDistance}); }
          else if (promptStage < 1 && maneuverDistance <= .50) { promptStage = 1; gpsEvent({type:"prepare", index:targetIndex, distance:maneuverDistance}); }
        }
        if (reliableGps && onRoute && maneuverDistance > .08 && nearestStop.distance <= 300 / 5280 && !announcedStops.has(nearestStop.i)) {
          announcedStops.add(nearestStop.i);
          gpsEvent({type:"stop-ahead", stopName:nearestStop.stop.name, distanceFeet:Math.round(nearestStop.distance * 5280)});
        }
        const passedManeuver = promptStage < 4 && reliableGps && onRoute && !wrongWay && routeMatch.along >= checkpointProgress[targetIndex] + .012;
        completionFixes = passedManeuver ? completionFixes + 1 : 0;
        if (completionFixes >= 2) {
          const completed = targetIndex;
          if (targetIndex < checkpoints.length - 1) { targetIndex += 1; promptStage = 0; completionFixes = 0; }
          else { promptStage = 4; completionFixes = 0; }
          gpsEvent({type:"complete", index:completed, nextIndex:targetIndex, finished:completed === checkpoints.length - 1});
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
    gpsButton.textContent = "Static map · simulation ready";
  }
}

if (typeof window !== "undefined") {
  const scan = () => document.querySelectorAll<HTMLElement>(".live .map").forEach(mountLiveMap);
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

