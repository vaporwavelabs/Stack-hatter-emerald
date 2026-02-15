
import React, { useEffect, useRef } from 'react';
import { TerminalLog } from '../types';

interface TerminalProps {
  logs: TerminalLog[];
  telemetry?: {
    location: string;
    storage: string;
    ui: string;
    destinations: string[];
  };
}

const Terminal: React.FC<TerminalProps> = ({ logs, telemetry }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Derived Project Chart Data
  const fileCount = telemetry?.destinations.length || 0;
  const folderCount = telemetry?.destinations.filter(d => d.includes('/')).length || 0;

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-black lg:flex-row">
      {/* Logs View */}
      <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-zinc-800/50">
        <div className="bg-zinc-900/50 px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Standard Output Stream</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 terminal-font">LIVE_RUN_MODE</span>
          </div>
          <div className="flex space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 terminal-font text-xs leading-relaxed scrollbar-hide">
          {logs.map((log) => (
            <div key={log.id} className="mb-1 flex">
              <span className="text-zinc-600 mr-3 select-none">[{log.timestamp}]</span>
              <span className={`
                ${log.type === 'info' ? 'text-blue-400/80' : ''}
                ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
                ${log.type === 'success' ? 'text-emerald-400' : ''}
                ${log.type === 'command' ? 'text-zinc-100 font-bold' : ''}
                ${log.type === 'process' ? 'text-zinc-400 italic' : ''}
              `}>
                {log.type === 'command' && <span className="text-emerald-500 mr-2">m3rlin@arch:~$</span>}
                {log.message}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-zinc-800 italic uppercase tracking-widest text-[10px]">Awaiting system initialization...</div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Telemetry Sidebar & Project Chart */}
      <div className="w-full lg:w-80 bg-zinc-950/50 flex flex-col p-6 space-y-8 overflow-y-auto scrollbar-hide border-t lg:border-t-0 border-zinc-800/50">
        {/* THE CHART: Visual Topology */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-emerald-500/60 mb-6 flex items-center">
            <i className="fas fa-project-diagram mr-3"></i>
            Project Topology Chart
          </h4>
          
          <div className="glass-pane p-5 rounded-3xl border-emerald-500/10 bg-emerald-500/5 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="relative flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-zinc-500">Distribution</span>
                <span className="text-[9px] text-emerald-500 font-black terminal-font">HEALTHY</span>
              </div>
              
              {/* Visual mini-chart */}
              <div className="h-20 flex items-end space-x-2">
                {[45, 80, 55, 95, 40, 60, 85].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-emerald-500/20 border-t border-emerald-500/40 rounded-t transition-all hover:bg-emerald-500/40" 
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[18px] font-black text-white terminal-font">{fileCount}</span>
                  <span className="text-[8px] uppercase text-zinc-500 font-bold">Total Nodes</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[18px] font-black text-white terminal-font">{folderCount}</span>
                  <span className="text-[8px] uppercase text-zinc-500 font-bold">Directories</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-600 mb-6">Environment Pulse</h4>
          
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">Neural Load</span>
            <div className="flex items-center space-x-3">
              <i className="fas fa-microchip text-zinc-500 text-xs"></i>
              <span className="text-xs text-zinc-300 terminal-font">v2.5_STABLE</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-emerald-500 w-[64%] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
          </div>

          <div className="pt-4 space-y-1">
            <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">Global Location</span>
            <div className="flex items-center space-x-3">
              <i className="fas fa-location-dot text-emerald-500/50 text-xs"></i>
              <span className="text-xs text-zinc-300 terminal-font">{telemetry?.location || "UNKNOWN"}</span>
            </div>
          </div>

          <div className="pt-4 space-y-1">
            <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">User Interface Host</span>
            <div className="flex items-center space-x-3">
              <i className="fas fa-desktop text-zinc-500 text-xs"></i>
              <span className="text-xs text-zinc-300 terminal-font">{telemetry?.ui || "HOST_OFFLINE"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-600 mb-4">File Registry</h4>
          <div className="space-y-2">
            {telemetry?.destinations && telemetry.destinations.length > 0 ? (
              telemetry.destinations.map((dest, i) => (
                <div key={i} className="flex items-center space-x-3 group cursor-crosshair">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors"></div>
                  <span className="text-[10px] text-zinc-500 terminal-font group-hover:text-zinc-300 transition-colors truncate">/{dest}</span>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-zinc-800 italic">No targets mapped.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
