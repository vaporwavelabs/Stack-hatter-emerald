
export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
  gitStatus?: 'untracked' | 'modified' | 'staged' | 'none';
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'command' | 'process';
  message: string;
}

export interface UserProfile {
  pin: string;
  faceData?: string;
  createdAt: string;
}

export type TechStack = 'PYTHON' | 'SOLIDITY' | 'JSON' | 'HTML' | 'GENERAL';

export interface SavedProject {
  id: string;
  name: string;
  nodes: FileNode[];
  lastSaved: string;
  branch: string;
  isGitInitialized: boolean;
  tech?: TechStack;
}

export enum AppState {
  INITIAL = 'INITIAL',
  AUTH_CHOICE = 'AUTH_CHOICE',
  AUTH_NEW = 'AUTH_NEW',
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTHORIZED = 'AUTHORIZED',
  GENERATING = 'GENERATING',
  BUILDING = 'BUILDING',
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  DEBUGGING = 'DEBUGGING',
  GIT_OP = 'GIT_OP',
  SAVING = 'SAVING'
}
