
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateAppStructure, convertToTree } from './services/geminiService';
import { FileNode, TerminalLog, AppState, UserProfile } from './types';
import Terminal from './components/Terminal';
import FileExplorer from './components/FileExplorer';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH_CHOICE);
  const [prompt, setPrompt] = useState('');
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [projectNodes, setProjectNodes] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [activeTab, setActiveTab] = useState<'explorer' | 'logs'>('explorer');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Dashboard Header Stats
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataSpeed, setDataSpeed] = useState('0.0 kb/s');
  const [dataStream, setDataStream] = useState('IDLE');

  // System Telemetry for Output Page
  const [location, setLocation] = useState("DETECTING...");
  const [storageUsage, setStorageUsage] = useState("64.2GB / 256GB");
  const [uiHost, setUiHost] = useState("M3RLIN_OS_v2.5");

  // Agent Popout Control
  const [isChatPoppedOut, setIsChatPoppedOut] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: window.innerWidth - 680, y: window.innerHeight - 280 });
  const [chatSize, setChatSize] = useState({ width: 640, height: 160 });
  
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });

  // Auth State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [hasNewAlert, setHasNewAlert] = useState(true);

  // Initialize
  useEffect(() => {
    const savedProfile = localStorage.getItem('stack_hat_profile');
    if (savedProfile) {
      try { setUserProfile(JSON.parse(savedProfile)); } catch (e) { console.error(e); }
    }

    // Restore last project if it exists
    const lastProject = localStorage.getItem('stack_hat_autosave');
    if (lastProject) {
      try {
        const parsed = JSON.parse(lastProject);
        setProjectName(parsed.name || 'Untitled Project');
        setProjectNodes(parsed.nodes || []);
      } catch (e) { console.error("Restore failed", e); }
    }

    // Geolocation for telemetry
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`),
        () => setLocation("LOC_ENCRYPTED")
      );
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // AUTO-SAVE PROJECT
  useEffect(() => {
    if (projectNodes.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        const data = {
          name: projectName,
          nodes: projectNodes,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem('stack_hat_autosave', JSON.stringify(data));
        console.debug("Project auto-saved.");
      }, 1000);
      return () => clearTimeout(autoSaveTimer);
    }
  }, [projectNodes, projectName]);

  useEffect(() => {
    if (appState === AppState.GENERATING || appState === AppState.BUILDING) {
      const interval = setInterval(() => {
        setDataSpeed(`${(Math.random() * 950 + 200).toFixed(1)} kb/s`);
        setDataStream(['ai.google.dev', 'cdn.esm.sh', 'npm.registry', 'github.com', 'm3rlin.neural'][Math.floor(Math.random() * 5)]);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setDataSpeed('0.0 kb/s');
      setDataStream('IDLE');
    }
  }, [appState]);

  useEffect(() => {
    if (isDarkMode) document.body.classList.remove('light-mode');
    else document.body.classList.add('light-mode');
  }, [isDarkMode]);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    const newLog: TerminalLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const handleTerminalCommand = (cmd: string) => {
    addLog(cmd, 'command');
    const lower = cmd.toLowerCase().trim();
    
    if (lower === 'run' || lower === 'start') {
      addLog(`Searching for entry point...`, 'info');
      addLog(`Executing project "${projectName}" runtime environment...`, 'process');
      setTimeout(() => addLog(`Virtual terminal initialized. App running at localhost:3000 (SIMULATED)`, 'success'), 1200);
    } else if (lower === 'ls' || lower === 'dir') {
      const paths = projectNodes.map(n => (n.type === 'folder' ? `[DIR]  ` : `[FILE] `) + n.name).join('\n');
      addLog(paths || 'Empty directory.', 'info');
    } else if (lower === 'help') {
      addLog('Available commands: run, ls, help, clear, build, debug, status', 'info');
    } else if (lower === 'clear') {
      setLogs([]);
    } else if (lower.startsWith('cat ')) {
      const fileName = lower.replace('cat ', '');
      const file = projectNodes.find(n => n.name.toLowerCase() === fileName);
      if (file && file.content) {
        addLog(`Reading ${file.name}:\n${file.content.slice(0, 200)}...`, 'info');
      } else {
        addLog(`File "${fileName}" not found in root.`, 'error');
      }
    } else {
      addLog(`Command "${cmd}" not recognized. Type "help" for a list of commands.`, 'error');
    }
  };

  const handleAction = async () => {
    if (!prompt.trim()) return;

    // If terminal is active, treat as command
    if (activeTab === 'logs') {
      handleTerminalCommand(prompt);
      setPrompt('');
      return;
    }

    // Logic for "Add code to [file]"
    if (prompt.toLowerCase().startsWith('add code to ')) {
      const parts = prompt.split(':');
      if (parts.length >= 2) {
        const fileTarget = parts[0].replace('add code to ', '').trim();
        const content = parts.slice(1).join(':').trim();
        addLog(`Injecting code into ${fileTarget}...`, 'command');
        
        // Simple update logic
        const updatedNodes = [...projectNodes];
        const updateNode = (nodes: FileNode[]) => {
          for (let node of nodes) {
            if (node.name.toLowerCase() === fileTarget.toLowerCase()) {
              node.content = (node.content || '') + '\n\n' + content;
              return true;
            }
            if (node.children) {
              if (updateNode(node.children)) return true;
            }
          }
          return false;
        };

        if (updateNode(updatedNodes)) {
          setProjectNodes(updatedNodes);
          addLog(`Content successfully appended to ${fileTarget}.`, 'success');
        } else {
          // Create new file if not found
          const newNode: FileNode = {
            name: fileTarget,
            type: 'file',
            path: fileTarget,
            content: content
          };
          setProjectNodes([...projectNodes, newNode]);
          addLog(`New file "${fileTarget}" created with provided code.`, 'success');
        }
        setPrompt('');
        return;
      }
    }

    // Default: Build or Update App
    setAppState(AppState.GENERATING);
    setLogs([]);
    addLog(`Initiating architect pattern for: ${prompt.slice(0, 30)}...`, 'command');
    try {
      const { name, files } = await generateAppStructure(prompt);
      setProjectName(name);
      setAppState(AppState.BUILDING);
      const tree = convertToTree(files);
      setProjectNodes(tree);
      setAppState(AppState.IDLE);
      setActiveTab('explorer');
      addLog(`Build successful. Project "${name}" initialized.`, 'success');
      setPrompt('');
    } catch (error) {
      addLog(`Architect failure. Connection unstable.`, "error");
      setAppState(AppState.IDLE);
    }
  };

  const handleStartDrag = (e: React.MouseEvent) => {
    if (!isChatPoppedOut || resizing) return;
    setIsDraggingChat(true);
    dragOffset.current = { x: e.clientX - chatPosition.x, y: e.clientY - chatPosition.y };
  };

  const handleStartResize = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setResizing(direction);
    resizeStart.current = { width: chatSize.width, height: chatSize.height, x: e.clientX, y: e.clientY };
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingChat) {
      setChatPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    } else if (resizing) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      setChatSize({
        width: resizing.includes('right') ? Math.max(350, resizeStart.current.width + dx) : chatSize.width,
        height: resizing.includes('bottom') ? Math.max(120, resizeStart.current.height + dy) : chatSize.height
      });
    }
  }, [isDraggingChat, resizing, chatSize]);

  useEffect(() => {
    const onMouseUp = () => { setIsDraggingChat(false); setResizing(null); };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleGlobalMouseMove]);

  const ChatContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center space-x-6 p-6">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAction()}
          placeholder={activeTab === 'logs' ? "Enter terminal command (run, ls, cat...)" : "Enter architect instructions or 'Add code to filename: code'..."}
          className="flex-1 bg-transparent border-none focus:ring-0 text-base text-zinc-100 placeholder-zinc-700 terminal-font"
        />
        <button 
          onClick={handleAction}
          disabled={appState === AppState.GENERATING || !prompt.trim()}
          className={`w-16 h-16 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded-2xl flex items-center justify-center transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 group relative`}
          title={activeTab === 'logs' ? "Execute Command" : "Invoke M3RLIN"}
        >
          {appState === AppState.GENERATING ? (
            <i className="fas fa-sync animate-spin text-2xl"></i>
          ) : (
            <i className={`fas ${activeTab === 'logs' ? 'fa-terminal' : 'fa-hat-wizard'} text-3xl group-hover:scale-110 transition-transform`}></i>
          )}
        </button>
      </div>
    </div>
  );

  const AuthScreen = (mode: 'new' | 'login') => (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <div className="max-w-md w-full glass-pane p-14 rounded-[3rem] shadow-2xl backdrop-blur-3xl border-emerald-500/15">
        <h2 className="text-2xl font-black text-white mb-12 text-center tracking-widest uppercase terminal-font">Security Keypad</h2>
        <div className="flex justify-center space-x-5 mb-12">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${pinInput.length > i ? 'bg-emerald-500 border-emerald-500 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'border-zinc-800'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'CLEAR', 0, 'DEL'].map((val) => (
            <button
              key={val}
              onClick={() => {
                if (val === 'CLEAR') setPinInput('');
                else if (val === 'DEL') setPinInput(p => p.slice(0, -1));
                else if (typeof val === 'number' && pinInput.length < 6) setPinInput(p => p + val);
              }}
              className="h-20 glass-pane hover:bg-emerald-500/15 text-zinc-100 font-black rounded-3xl transition-all text-2xl active:scale-90 border-emerald-500/5"
            >
              {val === 'DEL' ? <i className="fas fa-backspace"></i> : val}
            </button>
          ))}
        </div>
        <button 
          onClick={() => {
            if (mode === 'new') {
              const profile = { pin: pinInput, createdAt: new Date().toISOString() };
              localStorage.setItem('stack_hat_profile', JSON.stringify(profile));
              setUserProfile(profile);
              setAppState(AppState.AUTHORIZED);
            } else if (pinInput === userProfile?.pin) {
              setAppState(AppState.AUTHORIZED);
            } else {
              setPinInput('');
            }
          }}
          className="w-full mt-12 bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-3xl font-black shadow-2xl shadow-emerald-500/30 transition-all uppercase tracking-[0.4em] text-sm"
        >
          Validate Access
        </button>
      </div>
    </div>
  );

  if (appState === AppState.AUTH_CHOICE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
        <div className="max-w-md w-full glass-pane p-14 rounded-[3.5rem] shadow-2xl text-center relative overflow-hidden">
          <div className="w-28 h-28 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 border border-emerald-500/25 shadow-[0_0_40px_rgba(16,185,129,0.15)] animate-pulse">
            <i className="fas fa-hat-wizard text-5xl"></i>
          </div>
          <h1 className="text-5xl font-black mb-3 text-white tracking-tighter terminal-font uppercase glow-text-emerald">stack_hat</h1>
          <p className="text-zinc-500 mb-12 text-xs tracking-[0.4em] font-black uppercase opacity-60">System Architect Portal</p>
          <div className="space-y-5">
            <button onClick={() => setAppState(AppState.AUTH_LOGIN)} disabled={!userProfile} className={`w-full py-6 px-10 rounded-[2rem] font-black transition-all flex items-center justify-between group ${userProfile ? 'bg-emerald-600 text-white shadow-xl' : 'bg-zinc-800/30 text-zinc-600 cursor-not-allowed'}`}>
              <span className="tracking-[0.2em] uppercase text-xs">Resume Profile</span>
              <i className="fas fa-shield-halved text-2xl group-hover:scale-125 transition-transform"></i>
            </button>
            <button onClick={() => setAppState(AppState.AUTH_NEW)} className="w-full bg-zinc-800/60 hover:bg-zinc-700 text-zinc-200 py-6 px-10 rounded-[2rem] font-black transition-all flex items-center justify-between border border-zinc-700/40">
              <span className="tracking-[0.2em] uppercase text-xs">Initialize New</span>
              <i className="fas fa-plus-circle text-2xl"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.AUTH_NEW || appState === AppState.AUTH_LOGIN) return AuthScreen(appState === AppState.AUTH_NEW ? 'new' : 'login');

  return (
    <div className={`h-screen flex overflow-hidden relative transition-all duration-700 ${isDarkMode ? 'dark' : 'light-mode'}`}>
      <div className="scanline"></div>

      {/* SIDEBAR */}
      <aside className="w-80 glass-pane border-r border-zinc-800/15 flex flex-col z-20">
        <div className="p-10 flex items-center space-x-5 text-emerald-500">
          <button 
            onClick={() => setIsChatPoppedOut(!isChatPoppedOut)} 
            className="w-14 h-14 flex items-center justify-center glass-pane rounded-2xl border-emerald-500/40 hover:scale-110 active:rotate-12 transition-all shadow-xl shadow-emerald-500/10 group"
          >
             <i className="fas fa-hat-wizard text-3xl group-hover:glow-text-emerald"></i>
          </button>
          <span className="font-black text-2xl tracking-tighter uppercase terminal-font glow-text-emerald">stack_hat</span>
        </div>

        <div className="flex-1 flex flex-col px-8 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-600 mb-6 opacity-60">File Manifest</span>
            <div className="flex-1 overflow-y-auto scrollbar-hide mb-6">
              <FileExplorer 
                nodes={projectNodes} 
                onSelect={(node) => { setSelectedFile(node); setActiveTab('explorer'); }} 
                selectedPath={selectedFile?.path} 
              />
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="p-8 space-y-4 bg-zinc-950/25 border-t border-zinc-800/15">
          <button 
            onClick={() => { addLog('Compiling project structure...', 'command'); setAppState(AppState.SAVING); setTimeout(() => setAppState(AppState.IDLE), 800); }}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center space-x-4 font-black text-[10px] transition-all uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <i className="fas fa-mortar-pestle text-sm"></i>
            <span>Compile</span>
          </button>
          <button 
            onClick={handleAction}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center space-x-4 font-black text-[10px] transition-all uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/25 active:scale-95"
          >
            <i className="fas fa-dragon text-sm"></i>
            <span>Launch Build</span>
          </button>
          
          <div className="p-5 glass-pane rounded-2xl border-emerald-500/15 mt-5">
            <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Architect Pulse</span>
               <span className="text-[10px] text-emerald-500 font-black glow-text-emerald">SYNCHRONIZED</span>
            </div>
            <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[100%] shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* DASHBOARD HEADER */}
        <header className="h-24 glass-pane border-b border-zinc-800/15 flex items-center justify-between px-12 z-10">
          <div className="flex items-center space-x-12">
             <div className="flex flex-col">
               <span className="text-3xl font-black text-white terminal-font leading-none tracking-tighter">
                 {currentTime.toLocaleTimeString([], { hour12: false })}
               </span>
               <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] mt-1.5">
                 {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </span>
             </div>
             
             <div className="dashboard-stat-container flex items-center space-x-10">
               <div className="flex flex-col">
                 <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest opacity-60 mb-1.5">Agent Integrity</span>
                 <div className="flex items-center space-x-2.5">
                   <div className={`w-2.5 h-2.5 rounded-full ${appState === AppState.IDLE ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]' : 'bg-amber-500 animate-pulse'}`}></div>
                   <span className={`text-[12px] font-black uppercase tracking-[0.25em] ${appState === AppState.IDLE ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {appState}
                   </span>
                 </div>
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest opacity-60 mb-1.5">Neural Telemetry</span>
                 <span className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">
                   {dataStream} <span className="text-emerald-500/40 mx-2 font-light">/</span> {dataSpeed}
                 </span>
               </div>
             </div>
          </div>

          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-5 glass-pane px-5 py-2.5 rounded-2xl border-zinc-800/40 shadow-inner">
              <i className={`fas fa-sun text-sm ${!isDarkMode ? 'text-amber-400' : 'text-zinc-600'}`}></i>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-14 h-7 rounded-full bg-zinc-900/50 relative transition-all duration-300 border border-zinc-800/30`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 shadow-xl ${isDarkMode ? 'left-8 bg-emerald-500 shadow-emerald-500/40' : 'left-1 bg-zinc-400 shadow-zinc-400/20'}`}></div>
              </button>
              <i className={`fas fa-moon text-sm ${isDarkMode ? 'text-emerald-400' : 'text-zinc-600'}`}></i>
            </div>
            
            <div 
              className="w-14 h-14 rounded-2xl glass-pane flex items-center justify-center hover:border-emerald-500/60 transition-all cursor-pointer group shadow-lg relative"
              onClick={() => setHasNewAlert(false)}
            >
              <i className="fas fa-user-gear text-xl text-zinc-400 group-hover:text-emerald-500"></i>
              {hasNewAlert && (
                <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-emerald-500 rounded-full border-[3px] border-zinc-950 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <main className="flex-1 flex flex-col p-12 bg-transparent overflow-hidden">
          {/* TABS */}
          <div className="flex border-b border-zinc-800/15 mb-10">
            <button onClick={() => setActiveTab('explorer')} className={`px-10 py-5 text-[11px] font-black uppercase tracking-[0.4em] flex items-center space-x-4 border-b-2 transition-all ${activeTab === 'explorer' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}>
              <i className="fas fa-code-branch text-lg"></i>
              <span>Project Files</span>
            </button>
            <button onClick={() => setActiveTab('logs')} className={`px-10 py-5 text-[11px] font-black uppercase tracking-[0.4em] flex items-center space-x-4 border-b-2 transition-all ${activeTab === 'logs' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}>
              <i className="fas fa-terminal text-lg"></i>
              <span>System Output</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 glass-pane rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.4)] border-emerald-500/5">
              {activeTab === 'explorer' ? (
                <>
                  <div className="h-16 bg-zinc-950/30 border-b border-zinc-800/10 flex items-center justify-between px-10">
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-600">
                      {selectedFile ? selectedFile.name.toUpperCase() : 'AWAITING_FILE_SELECTION'}
                    </span>
                    <div className="flex items-center space-x-8">
                      <button className="text-zinc-500 hover:text-emerald-500 transition-all active:scale-90"><i className="far fa-copy text-lg"></i></button>
                      <button onClick={() => { setPrompt(''); setProjectNodes([]); setProjectName('Untitled Project'); localStorage.removeItem('stack_hat_autosave'); }} className="text-zinc-500 hover:text-red-500 transition-all active:scale-90"><i className="fas fa-trash-can text-lg"></i></button>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    {selectedFile ? (
                      <pre className="absolute inset-0 p-12 overflow-auto terminal-font text-[13px] leading-loose text-zinc-300 scrollbar-hide">
                        <code>{selectedFile.content}</code>
                      </pre>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 opacity-15 select-none">
                        <i className="fas fa-hat-wizard text-[12rem] mb-8"></i>
                        <span className="terminal-font font-black uppercase tracking-[0.6em] text-lg">Initialize Architect Core</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Terminal 
                  logs={logs} 
                  telemetry={{ 
                    location, 
                    storage: storageUsage, 
                    ui: uiHost, 
                    destinations: projectNodes.map(n => n.name)
                  }} 
                />
              )}
            </div>

            {/* ANCHORED CHAT BAR (Visible only when not popped out) */}
            {!isChatPoppedOut && (
              <div className="mt-10 glass-pane border-emerald-500/30 rounded-[2.5rem] p-4 shadow-2xl transition-all duration-1000 animate-in slide-in-from-bottom-10">
                {ChatContent}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* POPPED OUT AGENT COMMAND WINDOW */}
      {isChatPoppedOut && (
        <div 
          className={`fixed z-[100] agent-popout glass-pane flex flex-col animate-in zoom-in-95 duration-400 transition-all ${isMinimized ? '!h-16 !w-96 !rounded-full' : 'rounded-[2.5rem]'}`}
          style={{ 
            left: chatPosition.x, 
            top: chatPosition.y, 
            width: isMinimized ? 384 : chatSize.width, 
            height: isMinimized ? 64 : chatSize.height 
          }}
        >
          {/* VIBRANT GREEN HEADER */}
          <div 
            className={`h-14 flex items-center justify-between px-8 cursor-move bg-emerald-600 text-white shadow-xl ${isMinimized ? 'rounded-full' : 'rounded-t-[2.4rem]'}`}
            onMouseDown={handleStartDrag}
          >
            <div className="flex items-center space-x-5">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] terminal-font">
                {isMinimized ? `Active Task: ${appState}` : 'agentic host: M3RLIN'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsMinimized(!isMinimized)} className="w-9 h-9 flex items-center justify-center hover:bg-white/25 rounded-xl transition-colors">
                <i className={`fas fa-${isMinimized ? 'expand-arrows-alt' : 'minus'} text-sm`}></i>
              </button>
              <button onClick={() => setIsChatPoppedOut(false)} className="w-9 h-9 flex items-center justify-center hover:bg-white/25 rounded-xl transition-colors" title="Anchor to layout">
                <i className="fas fa-anchor text-sm"></i>
              </button>
            </div>
          </div>
          
          {/* POP-OUT CONTENT & RESIZERS */}
          {!isMinimized && (
            <div className="flex-1 relative bg-zinc-950/20 rounded-b-[2.4rem]">
              {ChatContent}
              
              {/* Resize Handles */}
              <div className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-emerald-500/15" onMouseDown={(e) => handleStartResize(e, 'right')}></div>
              <div className="absolute bottom-0 left-0 h-2 w-full cursor-s-resize hover:bg-emerald-500/15" onMouseDown={(e) => handleStartResize(e, 'bottom')}></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize flex items-end justify-end p-2.5 z-50 group" onMouseDown={(e) => handleStartResize(e, 'bottomright')}>
                <div className="w-4 h-4 border-r-4 border-b-4 border-emerald-500/40 group-hover:border-emerald-500 transition-colors rounded-sm"></div>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="h-2 bg-emerald-600 absolute bottom-0 w-full z-30 opacity-70 blur-[4px]"></footer>
    </div>
  );
};

export default App;
