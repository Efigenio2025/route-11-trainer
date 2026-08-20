const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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
  if (host.dataset.enhanced || !TOKEN) return;
  host.dataset.enhanced = "true";
  const mapNode = document.createElement("div");
  mapNode.className = "mapbox-canvas";
  host.prepend(mapNode);
  const gpsButton = document.createElement("button");
  gpsButton.className = "gps-button";
  gpsButton.textContent = "⌖ Use phone GPS";
  host.appendChild(gpsButton);
  try {
    const mapboxgl = await loadMapbox();
    const map = new mapboxgl.Map({ accessToken: TOKEN, container: mapNode, style: "mapbox://styles/mapbox/streets-v12", center: [-95.974, 41.251], zoom: 11.7, attributionControl: true });
    const marker = new mapboxgl.Marker({ color: "#17263a" }).setLngLat(WESTBOUND[0]).addTo(map);
    map.on("load", async () => {
      host.dataset.mapReady = "true";
      let coordinates = WESTBOUND;
      try {
        const points = WESTBOUND.map(p => p.join(",")).join(";");
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${points}?geometries=geojson&overview=full&access_token=${TOKEN}`);
        const data = await response.json();
        if (data.routes?.[0]?.geometry?.coordinates) coordinates = data.routes[0].geometry.coordinates;
      } catch { /* checkpoint line remains available offline */ }
      map.addSource("route-11-westbound", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } } });
      map.addLayer({ id: "route-11-outline", type: "line", source: "route-11-westbound", paint: { "line-color": "#17263a", "line-width": 10, "line-opacity": .9 } });
      map.addLayer({ id: "route-11-line", type: "line", source: "route-11-westbound", paint: { "line-color": "#efb81d", "line-width": 6 } });
      const bounds = WESTBOUND.reduce((b: any, p) => b.extend(p), new mapboxgl.LngLatBounds(WESTBOUND[0], WESTBOUND[0]));
      map.fitBounds(bounds, { padding: 45, duration: 0 });
    });
    gpsButton.onclick = () => {
      if (!navigator.geolocation) { gpsButton.textContent = "GPS unavailable"; return; }
      gpsButton.textContent = "Locating…";
      if (window.__routeTrainerWatch != null) navigator.geolocation.clearWatch(window.__routeTrainerWatch);
      window.__routeTrainerWatch = navigator.geolocation.watchPosition(position => {
        const current: [number, number] = [position.coords.longitude, position.coords.latitude];
        marker.setLngLat(current); map.easeTo({ center: current, zoom: 15, duration: 700 });
        const nearest = WESTBOUND.map((p, i) => ({ i, d: miles(current, p) })).sort((a, b) => a.d - b.d)[0];
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

