/**
 * WelcomeModal.tsx
 * Welcome screen explaining the DAA project
 */

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg text-2xl">
              🗺️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GPS Navigation Simulator</h1>
              <p className="text-blue-200 text-sm">Dijkstra's Shortest Path Algorithm · OpenStreetMap · Leaflet.js</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* DAA Context */}
          <div className="bg-blue-950/50 border border-blue-700/50 rounded-xl p-4">
            <div className="text-blue-300 font-bold mb-2 flex items-center gap-2">
              <span>🎓</span> DAA Laboratory Project — B.Tech Computer Science
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              This simulator demonstrates how <strong className="text-white">Dijkstra's Shortest Path Algorithm</strong> solves the real-world navigation problem.
              The road network is converted into a <strong className="text-white">weighted graph</strong>, and our custom implementation of Dijkstra
              finds the optimal route — the same foundational algorithm used in Google Maps and GPS devices.
            </p>
          </div>

          {/* How it Works */}
          <div>
            <div className="text-sm font-bold text-gray-200 mb-3">How It Works</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🌍', title: 'Real Map Data', desc: 'OpenStreetMap provides actual road network data via Overpass API' },
                { icon: '🔢', title: 'Graph Construction', desc: 'Roads → Edges, Intersections → Vertices, Distance → Edge Weight' },
                { icon: '⚡', title: "Dijkstra's Algorithm", desc: 'Min-heap priority queue extracts shortest path in O((V+E) log V)' },
                { icon: '📍', title: 'Route Display', desc: 'Leaflet renders the computed path on the OpenStreetMap tile layer' },
              ].map(item => (
                <div key={item.title} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <div className="text-xs font-bold text-white mb-1">{item.title}</div>
                  <div className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Modes */}
          <div>
            <div className="text-sm font-bold text-gray-200 mb-3">Two Modes Available</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-950/40 border border-blue-700/50 rounded-xl p-3">
                <div className="text-blue-300 font-bold text-xs mb-1.5">🎓 Demo Mode (Recommended)</div>
                <ul className="text-[11px] text-gray-400 space-y-1">
                  <li>• Pre-built Indian city networks</li>
                  <li>• Instant algorithm execution</li>
                  <li>• Full visualization &amp; analysis</li>
                  <li>• Best for viva demonstration</li>
                </ul>
              </div>
              <div className="bg-green-950/40 border border-green-700/50 rounded-xl p-3">
                <div className="text-green-300 font-bold text-xs mb-1.5">🌍 Real Map Mode</div>
                <ul className="text-[11px] text-gray-400 space-y-1">
                  <li>• Click anywhere on the map</li>
                  <li>• Fetches live OSM road data</li>
                  <li>• Runs Dijkstra on real roads</li>
                  <li>• Works within ~50 km range</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-xs font-bold text-gray-300 mb-3">Algorithm Pipeline</div>
            <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
              {[
                { label: 'OSM Data', color: 'bg-green-700' },
                { label: 'Graph Builder', color: 'bg-blue-700' },
                { label: "Dijkstra's", color: 'bg-purple-700' },
                { label: 'Shortest Path', color: 'bg-orange-700' },
                { label: 'Leaflet Display', color: 'bg-cyan-700' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-1">
                  <span className={`${step.color} text-white px-2 py-1 rounded-lg font-semibold`}>{step.label}</span>
                  {i < 4 && <span className="text-gray-600">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Attribution */}
          <div className="text-[10px] text-gray-600 leading-relaxed">
            <strong className="text-gray-500">Open Source Technologies Used:</strong> OpenStreetMap (ODbL License) · Overpass API · Leaflet.js (BSD License) · React + TypeScript · Tailwind CSS.
            Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-500">OpenStreetMap</a> contributors.
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all text-sm active:scale-95 shadow-lg"
          >
            🚀 Launch GPS Navigation Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
