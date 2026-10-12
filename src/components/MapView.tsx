/**
 * MapView.tsx
 * Core map component using Leaflet + OpenStreetMap
 *
 * Responsibilities:
 * 1. Display OpenStreetMap tiles via Leaflet
 * 2. Handle map clicks for source/destination selection
 * 3. Fetch road network data from Overpass API (real mode)
 * 4. Build Graph from OSM data / sample networks (demo mode)
 * 5. Run Dijkstra's algorithm on the graph
 * 6. Display route polyline on the map
 * 7. Show graph overlay (nodes + edges) when requested
 *
 * IMPORTANT SEPARATION:
 *   - Leaflet is ONLY for rendering and user interaction
 *   - Dijkstra is OUR implementation in /algorithms/Dijkstra.ts
 *   - The route displayed is the output of OUR algorithm, NOT an external routing engine
 */

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { AppMode, SelectionMode, LatLon, RouteResult } from '../types';
import { buildGraphFromOSM, findNearestNode, pickConnectedPair } from '../algorithms/GraphBuilder';
import { OverpassError } from '../algorithms/OverpassClient';
import { haversineDistance } from '../algorithms/Distance';
import { buildSampleGraph, SAMPLE_NETWORKS } from '../algorithms/SampleGraph';
import { runDijkstra } from '../algorithms/Dijkstra';
import { Graph } from '../algorithms/Graph';

interface MapViewProps {
  appMode: AppMode;
  selectionMode: SelectionMode;
  sourcePoint: LatLon | null;
  destPoint: LatLon | null;
  routeResult: RouteResult | null;
  showGraph: boolean;
  visitedNodes?: Set<string>;
  pathNodes?: string[];
  selectedDemoNetwork: number;
  triggerRoute: number;
  onMapClick: (lat: number, lon: number, label?: string) => void;
  onRouteComputed: (result: RouteResult | null, error?: string) => void;
  setIsLoading: (v: boolean) => void;
  onStatus?: (msg: string) => void;
  focusPoint?: { lat: number; lon: number; zoom?: number; nonce: number } | null;
}

// Fix Leaflet default marker icons (common Vite issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const sourceIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;background:#22c55e;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "><div style="
    width:10px;height:10px;background:white;border-radius:50%;
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
});

const destIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;background:#ef4444;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "><div style="
    width:10px;height:10px;background:white;border-radius:50%;
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
});

// nodeIcon reserved for future use

export default function MapView({
  appMode, selectionMode, sourcePoint, destPoint,
  routeResult, showGraph,
  selectedDemoNetwork, triggerRoute,
  onMapClick, onRouteComputed, setIsLoading,
  onStatus, focusPoint,
}: MapViewProps) {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const sourceMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const graphLayerRef = useRef<L.LayerGroup | null>(null);
  const demoNetworkLayerRef = useRef<L.LayerGroup | null>(null);
  const currentGraphRef = useRef<Graph | null>(null);
  const triggerRef = useRef(0);
  const connectorLayerRef = useRef<L.LayerGroup | null>(null);

  // ─── Initialize Leaflet Map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: true,
    });

    // OpenStreetMap tile layer with proper attribution
    // Falls back to a second tile server if the primary one fails (network errors)
    const osmAttribution =
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const primaryTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: osmAttribution,
      maxZoom: 19,
    }).addTo(map);

    let tileErrors = 0;
    let switched = false;
    primaryTiles.on('tileerror', () => {
      tileErrors++;
      if (tileErrors >= 6 && !switched) {
        switched = true;
        map.removeLayer(primaryTiles);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: osmAttribution + ' © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);
      }
    });

    // Connector layer (dashed lines from clicked points to nearest road)
    connectorLayerRef.current = L.layerGroup().addTo(map);

    // Graph overlay layer group
    const graphLayer = L.layerGroup().addTo(map);
    graphLayerRef.current = graphLayer;

    // Demo network layer
    const demoLayer = L.layerGroup().addTo(map);
    demoNetworkLayerRef.current = demoLayer;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── Fly to a searched place ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusPoint) return;
    map.flyTo([focusPoint.lat, focusPoint.lon], focusPoint.zoom ?? 14, { duration: 1.2 });
  }, [focusPoint]);

  // ─── Draw / clear off-road connector lines ────────────────────────────────
  useEffect(() => {
    const layer = connectorLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!routeResult?.connectors) return;
    for (const [a, b] of routeResult.connectors) {
      L.polyline([a, b], { color: '#f59e0b', weight: 3, opacity: 0.9, dashArray: '3, 8' })
        .bindTooltip('Off-road connector to nearest road', { sticky: true })
        .addTo(layer);
    }
  }, [routeResult]);

  // ─── Map click handler ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (selectionMode === 'none') return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [selectionMode, onMapClick]);

  // ─── Update cursor style based on selection mode ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    container.style.cursor = selectionMode !== 'none' ? 'crosshair' : '';
  }, [selectionMode]);

  // ─── Source marker ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (sourceMarkerRef.current) {
      map.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }

    if (sourcePoint) {
      const marker = L.marker([sourcePoint.lat, sourcePoint.lon], { icon: sourceIcon })
        .addTo(map)
        .bindPopup('<b>🟢 Source</b>');
      sourceMarkerRef.current = marker;
    }
  }, [sourcePoint]);

  // ─── Destination marker ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    if (destPoint) {
      const marker = L.marker([destPoint.lat, destPoint.lon], { icon: destIcon })
        .addTo(map)
        .bindPopup('<b>🔴 Destination</b>');
      destMarkerRef.current = marker;
    }
  }, [destPoint]);

  // ─── Draw route on map ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (!routeResult || !routeResult.found || routeResult.pathCoords.length === 0) return;

    // Draw the route computed by OUR Dijkstra implementation
    const routeLine = L.polyline(routeResult.pathCoords, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Animated route (dashed overlay)
    const animatedLine = L.polyline(routeResult.pathCoords, {
      color: '#60a5fa',
      weight: 3,
      opacity: 0.6,
      dashArray: '12, 8',
    }).addTo(map);

    routeLayerRef.current = routeLine;

    // Fit map to route
    const bounds = routeLine.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Cleanup animated line with routeLayer
    return () => {
      if (map) {
        map.removeLayer(animatedLine);
      }
    };
  }, [routeResult]);

  // ─── Graph overlay ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const graphLayer = graphLayerRef.current;
    const graph = currentGraphRef.current;
    if (!map || !graphLayer) return;

    graphLayer.clearLayers();

    if (!showGraph || !graph) return;

    const allNodes = graph.getAllNodes();
    const adjacencyList = graph.getAdjacencyList();

    // Limit to prevent performance issues with huge graphs
    const maxNodes = Math.min(allNodes.length, 500);

    // Draw edges first (lines)
    for (let i = 0; i < maxNodes; i++) {
      const node = allNodes[i];
      const edges = adjacencyList.get(node.id) || [];
      for (const edge of edges.slice(0, 5)) {
        const toNode = graph.getNode(edge.to);
        if (!toNode) continue;
        L.polyline(
          [[node.lat, node.lon], [toNode.lat, toNode.lon]],
          { color: '#374151', weight: 1, opacity: 0.4 }
        ).addTo(graphLayer);
      }
    }

    // Draw nodes on top
    for (let i = 0; i < Math.min(maxNodes, 300); i++) {
      const node = allNodes[i];
      const isOnPath = routeResult?.pathCoords.some(
        ([lat, lon]) => Math.abs(lat - node.lat) < 0.0001 && Math.abs(lon - node.lon) < 0.0001
      );
      L.circleMarker([node.lat, node.lon], {
        radius: isOnPath ? 5 : 3,
        color: isOnPath ? '#60a5fa' : '#6b7280',
        fillColor: isOnPath ? '#3b82f6' : '#4b5563',
        fillOpacity: 0.8,
        weight: 1,
      })
        .bindTooltip(node.label || node.id, { permanent: false, sticky: true, direction: 'top' })
        .addTo(graphLayer);
    }
  }, [showGraph, routeResult]);

  // ─── Demo mode: show network nodes/edges on map ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const demoLayer = demoNetworkLayerRef.current;
    if (!map || !demoLayer) return;

    demoLayer.clearLayers();

    if (appMode !== 'demo') return;

    const net = SAMPLE_NETWORKS[selectedDemoNetwork];
    map.setView(net.center, net.zoom, { animate: true });

    // Draw all edges of the demo network
    for (const edge of net.edges) {
      const fromNode = net.nodes.find(n => n.id === edge.from);
      const toNode = net.nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) continue;
      L.polyline(
        [[fromNode.lat, fromNode.lon], [toNode.lat, toNode.lon]],
        { color: '#4b5563', weight: 2, opacity: 0.5, dashArray: '4,4' }
      ).addTo(demoLayer);
    }

    // Draw all nodes
    for (const node of net.nodes) {
      const isSource = node.id === net.defaultSource;
      const isDest = node.id === net.defaultDest;
      L.circleMarker([node.lat, node.lon], {
        radius: isSource || isDest ? 10 : 7,
        color: isSource ? '#22c55e' : isDest ? '#ef4444' : '#6b7280',
        fillColor: isSource ? '#16a34a' : isDest ? '#dc2626' : '#374151',
        fillOpacity: 0.85,
        weight: 2,
      })
        .bindTooltip(`<b>${node.label || node.id}</b>`, { permanent: false, direction: 'top' })
        .addTo(demoLayer);
    }
  }, [selectedDemoNetwork, appMode]);

  // ─── Real mode: zoom to India initially ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || appMode !== 'real') return;
    map.setView([20.5937, 78.9629], 5, { animate: true });
  }, [appMode]);

  // ─── MAIN ROUTING LOGIC — triggered by Find Route button ─────────────────
  useEffect(() => {
    if (triggerRoute === 0) return;
    if (triggerRoute === triggerRef.current) return;
    triggerRef.current = triggerRoute;

    if (appMode === 'demo') {
      runDemoRoute(selectedDemoNetwork);
    } else {
      runRealRoute();
    }
  }, [triggerRoute, appMode, selectedDemoNetwork, sourcePoint, destPoint]);

  // ─── DEMO MODE: Run Dijkstra on sample pre-built graph ───────────────────
  const runDemoRoute = useCallback(async (networkIndex: number) => {
    const network = SAMPLE_NETWORKS[networkIndex];
    setIsLoading(true);

    try {
      // Build the graph from the sample network
      const graph = buildSampleGraph(network);
      currentGraphRef.current = graph;

      const sourceId = network.defaultSource;
      const destId = network.defaultDest;

      const sourceNode = graph.getNode(sourceId);
      const destNode = graph.getNode(destId);

      if (!sourceNode || !destNode) {
        onRouteComputed(null, 'Demo network source or destination node not found.');
        return;
      }

      // Update markers
      const map = mapRef.current;
      if (map) {
        if (sourceMarkerRef.current) map.removeLayer(sourceMarkerRef.current);
        if (destMarkerRef.current) map.removeLayer(destMarkerRef.current);

        sourceMarkerRef.current = L.marker([sourceNode.lat, sourceNode.lon], { icon: sourceIcon })
          .addTo(map)
          .bindPopup(`<b>🟢 Source: ${sourceNode.label || sourceId}</b>`);

        destMarkerRef.current = L.marker([destNode.lat, destNode.lon], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>🔴 Destination: ${destNode.label || destId}</b>`);
      }

      // ─── RUN DIJKSTRA'S ALGORITHM ─────────────────────────────────────
      const result = runDijkstra(graph, sourceId, destId, true);

      const stats = graph.getStats();

      // Convert path node IDs → lat/lon coordinates for Leaflet
      const pathCoords: [number, number][] = result.path
        .map(nodeId => {
          const node = graph.getNode(nodeId);
          return node ? [node.lat, node.lon] as [number, number] : null;
        })
        .filter((c): c is [number, number] => c !== null);

      const routeResult: RouteResult = {
        pathCoords,
        totalDistance: result.totalDistance,
        nodesProcessed: result.nodesProcessed,
        edgesExamined: result.edgesExamined,
        edgesRelaxed: result.edgesRelaxed,
        executionTimeMs: result.executionTimeMs,
        vertexCount: stats.vertexCount,
        edgeCount: stats.edgeCount,
        found: result.found,
        sourceName: sourceNode.label || sourceId,
        destName: destNode.label || destId,
      };

      onRouteComputed(routeResult);
    } catch (err) {
      onRouteComputed(null, `Demo route error: ${(err as Error).message}`);
    }
  }, [onRouteComputed, setIsLoading]);

  // ─── REAL MODE: Fetch OSM data → Build Graph → Run Dijkstra ──────────────
  // Works in cities AND villages:
  //   • Tries progressively larger search areas until a road connection exists
  //   • Snaps to the nearest road within a growing radius (up to 5 km)
  //   • Picks source/dest nodes that belong to the SAME connected road network
  //   • Falls back to an off-road connector when a point is far from any road
  const runRealRoute = useCallback(async () => {
    if (!sourcePoint || !destPoint) {
      onRouteComputed(null, 'Please select both source and destination on the map.');
      return;
    }

    setIsLoading(true);

    try {
      const directDist = haversineDistance(sourcePoint.lat, sourcePoint.lon, destPoint.lat, destPoint.lon);
      if (directDist < 10) {
        onRouteComputed(null, 'Source and destination are the same place. Pick two different points.');
        return;
      }

      // Attempts: [padding factor, minimum padding in degrees, max snap radius in meters]
      // Later attempts cover more area so sparse village roads can connect.
      const attempts: Array<[number, number, number]> = [
        [0.3, 0.005, 1500],
        [0.8, 0.02, 3000],
        [1.5, 0.05, 5000],
      ];

      const MAX_SPAN = 0.75; // degrees (~80 km) — hard cap to protect the API
      let lastReason = '';
      let usedAttempt = 0;
      const notes: string[] = [];

      for (let attempt = 0; attempt < attempts.length; attempt++) {
        const [padFactor, minPad, snapMax] = attempts[attempt];

        const minLat = Math.min(sourcePoint.lat, destPoint.lat);
        const maxLat = Math.max(sourcePoint.lat, destPoint.lat);
        const minLon = Math.min(sourcePoint.lon, destPoint.lon);
        const maxLon = Math.max(sourcePoint.lon, destPoint.lon);
        const latPad = Math.max((maxLat - minLat) * padFactor, minPad);
        const lonPad = Math.max((maxLon - minLon) * padFactor, minPad);
        const bbox = {
          south: minLat - latPad, north: maxLat + latPad,
          west: minLon - lonPad, east: maxLon + lonPad,
        };

        if (bbox.north - bbox.south > MAX_SPAN || bbox.east - bbox.west > MAX_SPAN) {
          if (attempt === 0) {
            onRouteComputed(
              null,
              'Selected points are too far apart for a live road download (limit ≈ 80 km). Pick points closer together, or use Demo Mode for long-distance routing.'
            );
            return;
          }
          break; // can't expand any further
        }

        if (attempt > 0) {
          onStatus?.(`No connected road found yet — widening search area (attempt ${attempt + 1}/${attempts.length})...`);
        } else {
          onStatus?.('Fetching road data...');
        }

        // Fetch road network (multi-server, retry, cached)
        const buildResult = await buildGraphFromOSM(bbox.south, bbox.west, bbox.north, bbox.east, onStatus);
        const graph = buildResult.graph;
        currentGraphRef.current = graph;

        if (graph.vertexCount === 0) {
          lastReason = 'No road data found in this area of OpenStreetMap.';
          continue;
        }

        // Snap to nearest roads that are in the SAME connected network
        onStatus?.('Snapping points to nearest roads...');
        const pair = pickConnectedPair(graph, sourcePoint, destPoint, snapMax);
        if (!pair) {
          const sN = findNearestNode(graph, sourcePoint.lat, sourcePoint.lon, snapMax);
          const dN = findNearestNode(graph, destPoint.lat, destPoint.lon, snapMax);
          if (!sN) lastReason = 'No road found near the source point.';
          else if (!dN) lastReason = 'No road found near the destination point.';
          else lastReason = 'The roads near source and destination are not connected in OpenStreetMap data.';
          continue;
        }

        const sourceNode = pair.source;
        const destNode = pair.dest;

        if (sourceNode.id === destNode.id) {
          onRouteComputed(null, 'Source and destination snap to the same road node. Pick points further apart.');
          return;
        }

        // ─── RUN DIJKSTRA'S ALGORITHM ──────────────────────────────────
        onStatus?.('Running Dijkstra...');
        const result = runDijkstra(graph, sourceNode.id, destNode.id, false);

        if (!result.found) {
          lastReason = 'No drivable connection between the selected roads.';
          continue;
        }

        usedAttempt = attempt;

        // Update markers to snapped positions
        const map = mapRef.current;
        if (map) {
          if (sourceMarkerRef.current) map.removeLayer(sourceMarkerRef.current);
          if (destMarkerRef.current) map.removeLayer(destMarkerRef.current);

          sourceMarkerRef.current = L.marker([sourceNode.lat, sourceNode.lon], { icon: sourceIcon })
            .addTo(map)
            .bindPopup(`<b>🟢 Source</b><br/>${sourceNode.label || sourceNode.id}`);

          destMarkerRef.current = L.marker([destNode.lat, destNode.lon], { icon: destIcon })
            .addTo(map)
            .bindPopup(`<b>🔴 Destination</b><br/>${destNode.label || destNode.id}`);
        }

        const stats = graph.getStats();
        const pathCoords: [number, number][] = result.path
          .map(nodeId => {
            const node = graph.getNode(nodeId);
            return node ? [node.lat, node.lon] as [number, number] : null;
          })
          .filter((c): c is [number, number] => c !== null);

        // Off-road connectors for points that are away from the road (villages / fields)
        const connectors: Array<[[number, number], [number, number]]> = [];
        let extra = 0;
        if (pair.sourceSnap > 25) {
          connectors.push([[sourcePoint.lat, sourcePoint.lon], [sourceNode.lat, sourceNode.lon]]);
          extra += pair.sourceSnap;
          notes.push(`Source is ${Math.round(pair.sourceSnap)} m from the nearest road (dashed orange line).`);
        }
        if (pair.destSnap > 25) {
          connectors.push([[destPoint.lat, destPoint.lon], [destNode.lat, destNode.lon]]);
          extra += pair.destSnap;
          notes.push(`Destination is ${Math.round(pair.destSnap)} m from the nearest road (dashed orange line).`);
        }
        if (usedAttempt > 0) {
          notes.unshift('Search area was widened automatically to find a connected road (sparse village road data).');
        }

        const routeResult: RouteResult = {
          pathCoords,
          totalDistance: result.totalDistance + extra,
          nodesProcessed: result.nodesProcessed,
          edgesExamined: result.edgesExamined,
          edgesRelaxed: result.edgesRelaxed,
          executionTimeMs: result.executionTimeMs,
          vertexCount: stats.vertexCount,
          edgeCount: stats.edgeCount,
          wayCount: buildResult.wayCount,
          found: true,
          sourceName: sourceNode.label || `(${sourceNode.lat.toFixed(4)}, ${sourceNode.lon.toFixed(4)})`,
          destName: destNode.label || `(${destNode.lat.toFixed(4)}, ${destNode.lon.toFixed(4)})`,
          notes: notes.length ? notes : undefined,
          connectors: connectors.length ? connectors : undefined,
        };

        onRouteComputed(routeResult);
        return;
      }

      // All attempts exhausted
      onRouteComputed(
        null,
        `${lastReason || 'No route found.'} In remote villages OpenStreetMap may have incomplete roads. Try placing the points closer to a visible road, or search the nearest town/village by name.`
      );
    } catch (err) {
      if (err instanceof OverpassError) {
        onRouteComputed(null, err.message);
      } else {
        onRouteComputed(null, `Routing error: ${(err as Error).message}`);
      }
    }
  }, [sourcePoint, destPoint, onRouteComputed, setIsLoading, onStatus]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
