/**
 * Header.tsx
 * Application header with mode switcher
 */

import { AppMode } from '../types';

interface HeaderProps {
  appMode: AppMode;
  onModeSwitch: (mode: AppMode) => void;
}

export default function Header({ appMode, onModeSwitch }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0 z-50">
      {/* Logo / Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">GPS Navigation Simulator</h1>
          <p className="text-xs text-gray-400 leading-tight">Dijkstra's Shortest Path Algorithm · OpenStreetMap</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">Mode:</span>
        <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-600">
          <button
            onClick={() => onModeSwitch('demo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              appMode === 'demo'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🎓 Demo Mode
          </button>
          <button
            onClick={() => onModeSwitch('real')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              appMode === 'real'
                ? 'bg-green-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🌍 Real Map Mode
          </button>
        </div>

        {/* Attribution */}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-300 ml-2 hidden lg:block"
        >
          © OpenStreetMap
        </a>
      </div>
    </header>
  );
}
