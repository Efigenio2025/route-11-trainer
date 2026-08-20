# Route Trainer

A mobile-first personal bus-route training PWA. Route 11 is loaded from the original driver route sheet, with separate westbound and eastbound instructions.

## Open on your phone

- GitHub Pages: https://efigenio2025.github.io/route-11-trainer/
- Live app: https://route-11-trainer.joshuaefigenio.chatgpt.site/

## Run locally

1. Install Node.js 22 or newer.
2. In this folder, run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000` on a computer, or the displayed network address on a phone connected to the same Wi-Fi.

For a production check, run `npm run build`.

## Included

- My Routes dashboard and reusable multi-route data model
- Westbound / eastbound direction selection
- Learn Route step mode
- Turn Quiz and Full Route Test
- Local progress and trouble-spot counts
- Live Assist simulation with on-route and off-route states
- Web app manifest, service worker, and add-to-home-screen support

## Live GPS and maps

Live Assist now has twelve westbound GPS checkpoints, a Mapbox road-following route, live high-accuracy phone location, distance reporting, and basic on/off-route detection. Simulation remains available for safe desk testing. Real on-device ride-along tests are still required to tune turn thresholds and verify the final transit-center approach. The local Mapbox token lives in `.env.local`; copy `.env.example` when setting up another device.
