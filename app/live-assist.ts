// Mapbox public browser tokens are safe to ship to clients. The split fallback
// keeps hosted builds working when an environment variable is not injected.
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";\n\nconst WESTBOUND: [number, number][] = [
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

declare global {
  interface Window { mapboxgl?: any; __routeTrainerWatch?: number; }
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
  const checkpoints = host.dataset.direction === "eastbound" ? [...WESTBOUND].reverse() : WESTBOUND;
  const fallback = document.createElement("canvas");
  fallback.className = "route-canvas";
  fallback.setAttribute("aria-label", "Route 11 path from downtown Omaha to Aksarben Transit Center");
  host.prepend(fallback);
  const drawFallback = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2), rect = host.getBoundingClientRect();
    fallback.width = Math.max(1, Math.round(rect.width * ratio)); fallback.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = fallback.getContext("2d"); if (!ctx) return; ctx.scale(ratio, ratio);
    const pad = 34, minX = Math.min(...checkpoints.map(p => p[0])), maxX = Math.max(...checkpoints.map(p => p[0])), minY = Math.min(...checkpoints.map(p => p[1])), maxY = Math.max(...checkpoints.map(p => p[1]));
    const point = (p: [number, number]) => [pad + (p[0]-minX)/(maxX-minX)*(rect.width-pad*2), pad + (maxY-p[1])/(maxY-minY)*(rect.height-pad*2)] as const;
    const paint = (color:string,width:number) => {ctx.beginPath();checkpoints.forEach((p,i)=>{const [x,y]=point(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke()};
    paint("#17263a",12); paint("#efb81d",7);
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
  try {
    const mapboxgl = await loadMapbox();
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({ container: mapNode, style: "mapbox://styles/mapbox/streets-v12", center: [-95.974, 41.251], zoom: 11.7, attributionControl: true });
    const busEl = document.createElement("div");
    busEl.className = "gps-bus-marker";
    busEl.innerHTML = "<span>11</span><small>YOU</small>";
    const marker = new mapboxgl.Marker({ element: busEl, anchor: "center" }).setLngLat(checkpoints[0]).addTo(map);
    map.on("load", async () => {
      const routeData = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: checkpoints } };
      const stopData = { type: "FeatureCollection", features: checkpoints.map((coordinates, i) => ({ type: "Feature", properties: { name: (host.dataset.direction === "eastbound" ? [...WESTBOUND_STOPS].reverse() : WESTBOUND_STOPS)[i], number: i + 1 }, geometry: { type: "Point", coordinates } })) };
      map.addSource("route-11", { type: "geojson", data: routeData });
      map.addLayer({ id: "route-11-outline", type: "line", source: "route-11", paint: { "line-color": "#17263a", "line-width": 11, "line-opacity": .95 } });
      map.addLayer({ id: "route-11-line", type: "line", source: "route-11", paint: { "line-color": "#efb81d", "line-width": 6 } });
      map.addSource("route-11-stops", { type: "geojson", data: stopData });
      map.addLayer({ id: "route-11-stop-dots", type: "circle", source: "route-11-stops", paint: { "circle-radius": 7, "circle-color": "#ffffff", "circle-stroke-color": "#17263a", "circle-stroke-width": 3 } });
      map.addLayer({ id: "route-11-stop-labels", type: "symbol", source: "route-11-stops", minzoom: 12.4, layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.25], "text-anchor": "top", "text-allow-overlap": false }, paint: { "text-color": "#17263a", "text-halo-color": "#ffffff", "text-halo-width": 2 } });
      host.dataset.mapReady = "true";
      try {
        const points = checkpoints.map(p => p.join(",")).join(";");
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${points}?geometries=geojson&overview=full&access_token=${TOKEN}`);
        const data = await response.json();
        if (data.routes?.[0]?.geometry?.coordinates) (map.getSource("route-11") as any).setData({ ...routeData, geometry: data.routes[0].geometry });
      } catch { /* The checkpoint route is already visible. */ }
      const bounds = checkpoints.reduce((b: any, p) => b.extend(p), new mapboxgl.LngLatBounds(checkpoints[0], checkpoints[0]));
      map.fitBounds(bounds, { padding: 45, duration: 0 });
    });
    gpsButton.onclick = () => {
      if (!navigator.geolocation) { gpsButton.textContent = "GPS unavailable"; return; }
      gpsButton.textContent = "Locating…";
      if (window.__routeTrainerWatch != null) navigator.geolocation.clearWatch(window.__routeTrainerWatch);
      window.__routeTrainerWatch = navigator.geolocation.watchPosition(position => {
        const current: [number, number] = [position.coords.longitude, position.coords.latitude];
        marker.setLngLat(current); busEl.classList.add("live"); map.easeTo({ center: current, zoom: 15.5, duration: 700 });
        const nearest = checkpoints.map((p, i) => ({ i, d: miles(current, p) })).sort((a, b) => a.d - b.d)[0];
        const status = document.querySelector<HTMLElement>(".live-status span");
        const distance = document.querySelector<HTMLElement>(".next b");
        if (status) { status.textContent = nearest.d < .16 ? "ON ROUTE" : "OFF ROUTE"; status.className = nearest.d < .16 ? "tracking" : "off-route"; }
        if (distance) distance.textContent = `${nearest.d < .1 ? Math.round(nearest.d * 5280) + " ft" : nearest.d.toFixed(1) + " mi"}`;
        gpsButton.textContent = `GPS active · ±${Math.round(position.coords.accuracy)} ft`;
      }, error => { gpsButton.textContent = error.code === 1 ? "Location permission denied" : "Unable to get location"; }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 });
    };
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

