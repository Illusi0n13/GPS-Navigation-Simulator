/**
 * App.tsx
 * GPS Navigation Simulator — Main Application Component
 * Using Dijkstra's Shortest Path Algorithm + OpenStreetMap + Leaflet
 */

import { useState, useCallback } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import AlgorithmPanel from './components/AlgorithmPanel';
import InfoPanel from './components/InfoPanel';
import AlgoVisualizer from './components/AlgoVisualizer';
import Header from './components/Header';
import WelcomeModal from './components/WelcomeModal';
import { RouteResult, AppMode, SelectionMode, LatLon } from './types';

export default function App() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [appMode, setAppMode] = useState<AppMode>('demo');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [sourcePoint, setSourcePoint] = useState<LatLon | null>(null);
  const [destPoint, setDestPoint] = useState<LatLon | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [destName, setDestName] = useState<string>('');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [selectedDemoNetwork, setSelectedDemoNetwork] = useState<number>(0);
  const [triggerRoute, setTriggerRoute] = useState<number>(0);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lon: number; zoom?: number; nonce: number } | null>(null);

  // ─── Map click handler ────────────────────────────────────────────────────
  const handleMapClick = useCallback((lat: number, lon: number, label?: string) => {
    if (selectionMode === 'source') {
      setSourcePoint({ lat, lon });
      setSourceName(label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      setSelectionMode('none');
      setRouteResult(null);
      setErrorMessage('');
    } else if (selectionMode === 'destination') {
      setDestPoint({ lat, lon });
      setDestName(label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      setSelectionMode('none');
      setRouteResult(null);
      setErrorMessage('');
    }
  }, [selectionMode]);

  // ─── Search result → set point directly (villages / towns) ────────────────
  const handleSetPoint = useCallback((kind: 'source' | 'destination', lat: number, lon: number, label: string) => {
    if (kind === 'source') {
      setSourcePoint({ lat, lon });
      setSourceName(label);
    } else {
      setDestPoint({ lat, lon });
      setDestName(label);
    }
    setRouteResult(null);
    setErrorMessage('');
    setFocusPoint({ lat, lon, zoom: 14, nonce: Date.now() });
  }, []);

  const handleFocusPlace = useCallback((lat: number, lon: number) => {
    setFocusPoint({ lat, lon, zoom: 14, nonce: Date.now() });
  }, []);

  // ─── Route computed callback ──────────────────────────────────────────────
  const handleRouteComputed = useCallback((result: RouteResult | null, error?: string) => {
    setIsLoading(false);
    setLoadingMessage('');
    if (error) {
      setErrorMessage(error);
      setRouteResult(null);
    } else if (result) {
      setRouteResult(result);
      setErrorMessage('');
    }
  }, []);

  // ─── Find route trigger ───────────────────────────────────────────────────
  const handleFindRoute = useCallback(() => {
    if (!sourcePoint && appMode === 'real') {
      setErrorMessage('Please select a source location on the map.');
      return;
    }
    if (!destPoint && appMode === 'real') {
      setErrorMessage('Please select a destination location on the map.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    setRouteResult(null);
    setTriggerRoute(t => t + 1);
  }, [sourcePoint, destPoint, appMode]);

  // ─── Clear all ────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setSourcePoint(null);
    setDestPoint(null);
    setSourceName('');
    setDestName('');
    setRouteResult(null);
    setErrorMessage('');
    setSelectionMode('none');
  }, []);

  // ─── Mode switch ──────────────────────────────────────────────────────────
  const handleModeSwitch = useCallback((mode: AppMode) => {
    setAppMode(mode);
    handleClear();
  }, [handleClear]);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Welcome Modal */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {/* Header */}
      <Header appMode={appMode} onModeSwitch={handleModeSwitch} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 flex flex-col bg-gray-900 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <ControlPanel
            appMode={appMode}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            sourcePoint={sourcePoint}
            destPoint={destPoint}
            sourceName={sourceName}
            destName={destName}
            isLoading={isLoading}
            errorMessage={errorMessage}
            routeResult={routeResult}
            selectedDemoNetwork={selectedDemoNetwork}
            setSelectedDemoNetwork={setSelectedDemoNetwork}
            onFindRoute={handleFindRoute}
            onClear={handleClear}
            showGraph={showGraph}
            setShowGraph={setShowGraph}
            showVisualizer={showVisualizer}
            setShowVisualizer={setShowVisualizer}
            onSetPoint={handleSetPoint}
            onFocusPlace={handleFocusPlace}
          />
          <AlgorithmPanel routeResult={routeResult} isLoading={isLoading} />
        </div>

        {/* Center Map */}
        <div className="flex-1 relative overflow-hidden">
          <MapView
            appMode={appMode}
            selectionMode={selectionMode}
            sourcePoint={sourcePoint}
            destPoint={destPoint}
            routeResult={routeResult}
            showGraph={showGraph}
            selectedDemoNetwork={selectedDemoNetwork}
            triggerRoute={triggerRoute}
            onMapClick={handleMapClick}
            onRouteComputed={handleRouteComputed}
            setIsLoading={setIsLoading}
            onStatus={setLoadingMessage}
            focusPoint={focusPoint}
          />

          {/* Cursor hint */}
          {selectionMode !== 'none' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                🗺️ Click on the map to set {selectionMode === 'source' ? 'Source' : 'Destination'}
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="bg-gray-900 rounded-xl p-6 flex flex-col items-center gap-3 shadow-2xl border border-blue-500">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-blue-300 font-semibold text-sm">
                  {appMode === 'real' ? (loadingMessage || 'Fetching road data & running Dijkstra...') : 'Running Dijkstra\'s Algorithm...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar — Visualizer */}
        {showVisualizer && (
          <div className="w-80 flex flex-col bg-gray-900 border-l border-gray-700 overflow-y-auto flex-shrink-0">
            <AlgoVisualizer
              routeResult={routeResult}
              isLoading={isLoading}
              onClose={() => setShowVisualizer(false)}
              selectedDemoNetwork={selectedDemoNetwork}
              appMode={appMode}
            />
          </div>
        )}
      </div>

      {/* Bottom Info Panel */}
      <InfoPanel routeResult={routeResult} />
    </div>
  );
}
