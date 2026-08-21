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

const WESTBOUND_STOPS = [
  "11th & Dodge", "16th & Dodge", "16th & Howard", "St. Mary's Ave",
  "Leavenworth", "60th & Leavenworth", "60th & Pacific", "67th & Pacific",
  "67th & Pine", "Aksarben Drive", "Mercy Road", "Aksarben T.C.",
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

async function mountLiveMap(host: HTMLElement) {
  if (host.dataset.enhanced) return;
  host.dataset.enhanced = "true";
  const routeNumber = host.dataset.route || "11";
  const route30South = routeNumber === "30" && host.dataset.direction === "southbound";
  const route30Turns = route30South ? ROUTE30_SOUTH_TURNS : ROUTE30_NORTH_TURNS;
  const route30Stops = route30South ? OFFICIAL_ROUTE30_SOUTH_STOPS : OFFICIAL_ROUTE30_NORTH_STOPS;
  const route30Shape = route30South ? ROUTE30_SOUTH_SHAPE : ROUTE30_NORTH_SHAPE;
  const checkpoints = routeNumber === "30" ? route30Turns.map(point => point.coordinates) : (host.dataset.direction === "eastbound" ? [...WESTBOUND].reverse() : WESTBOUND);
  const mapCoordinates = routeNumber === "30" ? route30Shape : checkpoints;
  const checkpointNames = routeNumber === "30" ? route30Turns.map(point => point.name) : (host.dataset.direction === "eastbound" ? [...WESTBOUND_STOPS].reverse() : WESTBOUND_STOPS);
  const stops: MapPoint[] = routeNumber === "30"
    ? route30Stops
    : checkpoints.map((coordinates, index) => ({ name: checkpointNames[index], coordinates }));
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
  host.parentElement?.querySelector(".live-panel")?.prepend(details);
  try {
    const mapboxgl = await loadMapbox();
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({ container: mapNode, style: "mapbox://styles/mapbox/streets-v12", center: [-95.974, 41.251], zoom: 11.7, attributionControl: true, interactive: true, dragPan: true, scrollZoom: true, touchZoomRotate: true, doubleClickZoom: true });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }), "bottom-right");
    map.dragPan.enable(); map.scrollZoom.enable(); map.touchZoomRotate.enable(); map.doubleClickZoom.enable();
    let busPosition: [number, number] = mapCoordinates[0];
    const busMarker = new mapboxgl.Marker({ color: "#17263a", scale: 0.85 })
      .setLngLat(busPosition)
      .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(`Route ${routeNumber} bus location`))
      .addTo(map);
    centerButton.onclick = () => map.easeTo({ center: busPosition, zoom: Math.max(map.getZoom(), 14.5), duration: 500 });
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
        if (routeNumber === "30" && i !== 0 && i !== stops.length - 1) return;
        const stopEl = document.createElement("button");
        stopEl.className = `route-stop-marker ${i === 0 ? "start" : i === stops.length - 1 ? "finish" : ""}`;
        stopEl.type = "button"; stopEl.title = stop.name; stopEl.setAttribute("aria-label", `Stop ${i + 1}: ${stop.name}`); stopEl.innerHTML = `<span>${i + 1}</span><small>${stop.name}</small>`;
        new mapboxgl.Marker({ element: stopEl, anchor: "center" }).setLngLat(stop.coordinates).addTo(map);
      });
      host.dataset.mapReady = "true";
      if (routeNumber !== "30") {
        try {
          const legs = await Promise.all(checkpoints.slice(0, -1).map(async (from, index) => {
            const to = checkpoints[index + 1];
            const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${from.join(",")};${to.join(",")}?geometries=geojson&overview=full&steps=false&access_token=${TOKEN}`);
            if (!response.ok) return [from, to] as [number, number][];
            const data = await response.json();
            return (data.routes?.[0]?.geometry?.coordinates || [from, to]) as [number, number][];
          }));
          const streetGeometry = legs.flatMap((leg, index) => index ? leg.slice(1) : leg);
          if (streetGeometry.length > checkpoints.length) {
            (map.getSource("route-11") as any).setData({ ...routeData, geometry: { type: "LineString", coordinates: streetGeometry } });
          }
        } catch { /* The checkpoint route is already visible. */ }
      }
      const bounds = mapCoordinates.reduce((b: any, p) => b.extend(p), new mapboxgl.LngLatBounds(mapCoordinates[0], mapCoordinates[0]));
      map.fitBounds(bounds, { padding: 45, duration: 0 });
    });
    const startGps = () => {
      if (!navigator.geolocation) { gpsButton.textContent = "GPS unavailable"; return; }
      gpsButton.textContent = "Locating…";
      if (window.__routeTrainerWatch != null) navigator.geolocation.clearWatch(window.__routeTrainerWatch);
      window.__routeTrainerWatch = navigator.geolocation.watchPosition(position => {
        const current: [number, number] = [position.coords.longitude, position.coords.latitude];
        busPosition = current; busMarker.setLngLat(current); map.easeTo({ center: current, zoom: 15.5, duration: 700 });
        const nearest = checkpoints.map((p, i) => ({ i, d: miles(current, p) })).sort((a, b) => a.d - b.d)[0];
        const routeDistance = Math.min(...mapCoordinates.map(point => miles(current, point)));
        const status = document.querySelector<HTMLElement>(".live-status span");
        const distance = document.querySelector<HTMLElement>(".next b");
        const routeTolerance = routeNumber === "30" ? .35 : .2;
        if (status) { status.textContent = routeDistance < routeTolerance ? "ON ROUTE" : "OFF ROUTE"; status.className = routeDistance < routeTolerance ? "tracking" : "off-route"; }
        if (distance) distance.textContent = `${nearest.d < .1 ? Math.round(nearest.d * 5280) + " ft" : nearest.d.toFixed(1) + " mi"}`;
        const accuracy = document.querySelector<HTMLElement>(".avl-accuracy");
        const updated = document.querySelector<HTMLElement>(".avl-updated");
        if (accuracy) accuracy.textContent = `±${Math.round(position.coords.accuracy)} ft`;
        if (updated) updated.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
        gpsButton.textContent = `GPS active · ±${Math.round(position.coords.accuracy)} ft`;
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

