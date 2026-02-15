
import React, { useState } from 'react';
import { FileNode } from '../types';

interface FileExplorerProps {
  nodes: FileNode[];
  onSelect: (node: FileNode) => void;
  selectedPath?: string;
}

const FileItem: React.FC<{ node: FileNode; level: number; onSelect: (node: FileNode) => void; selectedPath?: string }> = ({ node, level, onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer rounded transition-colors duration-150
          ${isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className="mr-2 w-4 flex justify-center">
          {node.type === 'folder' ? (
            <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} text-[10px]`}></i>
          ) : (
            <i className="far fa-file-code text-xs text-blue-400"></i>
          )}
        </span>
        {node.type === 'folder' && (
          <span className="mr-2 text-yellow-500/70">
            <i className={`fas fa-folder${isOpen ? '-open' : ''} text-xs`}></i>
          </span>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileItem key={child.path} node={child} level={level + 1} onSelect={onSelect} selectedPath={selectedPath} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, onSelect, selectedPath }) => {
  return (
    <div className="h-full overflow-y-auto py-2">
      {nodes.length > 0 ? (
        nodes.map((node) => (
          <FileItem key={node.path} node={node} level={0} onSelect={onSelect} selectedPath={selectedPath} />
        ))
      ) : (
        <div className="px-4 py-8 text-center">
          <p className="text-zinc-600 text-sm">No project loaded</p>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
