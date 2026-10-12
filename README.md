# GPS Navigation Simulator — Dijkstra's Shortest Path

An interactive GPS-style route finder that runs **our own implementation of Dijkstra's algorithm** on real OpenStreetMap road data. Leaflet is used only for drawing the map; the route you see is the output of `src/algorithms/Dijkstra.ts`, not an external routing engine.

Built with React 19, TypeScript, Vite, Tailwind CSS 4 and Leaflet.

---

## Features

- **Demo / Educational mode**: pre-built city networks with step-by-step algorithm visualization (good for viva and presentations).
- **Real Map mode**: click any two points (or search by name) and the app downloads live road data, builds a weighted graph, and runs Dijkstra on it.
- **Works in villages as well as cities**: adaptive search area, nearest-road snapping up to 5 km, and off-road connectors (see below).
- **Place search**: find any city, town or village by name and set it as source or destination.
- **Algorithm Visualizer** and **Graph Overlay** toggles.
- **Statistics**: distance, estimated time, nodes processed, edges examined/relaxed, execution time, graph size.

---

## Getting Started

Requirements: Node.js 18+ and an internet connection (map tiles and road data are fetched online).

```bash
npm install
npm run dev        # start dev server
npm run build      # production build (single self-contained HTML file in dist/)
npm run preview    # preview the production build
```

---

## How to Use

### Demo mode
1. Choose a city network in the left panel.
2. Click **Find Shortest Route**.
3. Turn on **Algorithm Visualizer** to watch Dijkstra step by step.

### Real Map mode
1. Switch to **Real Map** in the header.
2. Set the route points in either way:
   - Click **Source Location** / **Destination**, then click the map, or
   - Type a place in **Search Village / Town** (e.g. `Village, District, State`) and press **Set as Source** / **Set as Dest**.
3. Click **Find Shortest Route**.

Tip: the two points should be within roughly 80 km of each other. For longer distances use Demo mode.

---

## How It Works

```
Click / search points
        ↓
Fetch roads from OpenStreetMap (Overpass API)
        ↓
Parse nodes + ways → graph (adjacency list, Haversine edge weights)
        ↓
Snap points to nearest roads in the same connected network
        ↓
Dijkstra with a priority queue
        ↓
Route drawn on the map
```

| Real world | Graph |
|---|---|
| Road intersection | Vertex |
| Road segment | Edge |
| Segment length (meters) | Edge weight |
| Start / end location | Source / destination vertex |

Complexity: O((V + E) log V) with a binary-heap priority queue; O(V + E) space.

---

## Village and Rural Routing

Rural OpenStreetMap data is sparse and often split into disconnected pieces. To handle this, Real mode:

1. Tries up to **3 progressively larger search areas** until a connected road is found.
2. Snaps each point to the nearest road within a radius that grows from 1.5 km to **5 km**.
3. Chooses source and destination nodes that belong to the **same connected road network**, so it does not land on an isolated dead-end fragment.
4. Draws a **dashed orange connector** from your clicked point to the nearest road when it is more than 25 m away, and adds that distance to the total.
5. Shows notes in the result panel explaining what was adjusted.

If it still fails, the roads are probably not mapped in OpenStreetMap. Place the points closer to a visible road or search a nearby town.

---

## Reliability (API and Network Errors)

Road data comes from the public Overpass API, which can be busy. `src/algorithms/OverpassClient.ts` handles this by:

- Trying **4 different Overpass servers** instead of one.
- Applying a **30 second timeout** per request.
- **Retrying** with a delay between rounds on rate limits (429), server errors (5xx) and invalid replies.
- **Caching** results for the session, so the same area loads instantly the second time.
- Showing specific messages (offline, server busy, timeout) instead of a generic error.

Map tiles fall back to a second tile server if OpenStreetMap tiles fail to load.

If you still see network errors, check for a VPN, firewall or ad-blocker blocking `overpass-api.de`, `nominatim.openstreetmap.org` or `unpkg.com`.

---

## Project Structure

```
src/
├── App.tsx                      # App state and layout
├── algorithms/
│   ├── Dijkstra.ts              # Dijkstra implementation (+ step capture)
│   ├── PriorityQueue.ts         # Min-heap
│   ├── Graph.ts                 # Weighted graph (adjacency list)
│   ├── GraphBuilder.ts          # OSM → graph, nearest-node snapping, connected components
│   ├── OverpassClient.ts        # Resilient Overpass fetcher (mirrors, retry, cache)
│   ├── Distance.ts              # Haversine distance, time estimates
│   └── SampleGraph.ts           # Demo city networks
├── components/
│   ├── MapView.tsx              # Leaflet map + routing logic
│   ├── ControlPanel.tsx         # Left sidebar controls
│   ├── PlaceSearch.tsx          # Village / town search (Nominatim)
│   ├── AlgorithmPanel.tsx       # Algorithm explanation
│   ├── AlgoVisualizer.tsx       # Step-by-step visualizer
│   ├── DemoGraphVisualizer.tsx  # Demo graph view
│   ├── InfoPanel.tsx            # Bottom stats bar
│   ├── Header.tsx               # Mode switch
│   └── WelcomeModal.tsx
└── types/index.ts               # Shared types
```

---

## Known Limitations

- Live road download is capped at about 80 km between the two points.
- Distance and time are based on road length at a flat assumed speed; there is no live traffic and turn restrictions are not modeled.
- All highway types in OpenStreetMap are used for routing, including tracks and paths.
- Public Overpass and Nominatim servers have usage limits; avoid rapid repeated requests.

---

## Credits

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Map rendering by [Leaflet](https://leafletjs.com/)
- Geocoding by [Nominatim](https://nominatim.org/)
