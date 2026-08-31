import React, { useState, useRef } from 'react';
import { FileNode } from '../types';
import { Folder, FolderOpen, FileCode, ChevronDown, ChevronRight, FileJson, FileText, Upload, Download, Plus } from 'lucide-react';

interface FileTreeProps {
  files: FileNode[];
  onSelectFile: (path: string) => void;
  selectedFilePath: string;
  onUploadFile?: (path: string, content: string) => void;
  onDownloadProject?: () => void;
}

export default function FileTree({
  files,
  onSelectFile,
  selectedFilePath,
  onUploadFile,
  onDownloadProject,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
  });
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return FileJson;
    if (fileName.endsWith('.md')) return FileText;
    return FileCode;
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const filePath = `src/${file.name}`;
      onUploadFile(filePath, content);
      onSelectFile(filePath);
    };
    reader.readAsText(file);
  };

  const renderNode = (node: FileNode) => {
    const isFolder = node.type === 'folder' || node.children;
    const isExpanded = expandedFolders[node.path];

    if (isFolder) {
      const FolderIcon = isExpanded ? FolderOpen : Folder;
      return (
        <div key={node.path} className="space-y-1">
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center space-x-2 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-slate-100 hover:bg-[#1a1a1a]/50 cursor-pointer transition font-sans rounded-none"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
            <FolderIcon className="w-4 h-4 text-indigo-400" />
            <span>{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div className="pl-4 border-l border-[#222222] ml-3.5 space-y-1">
              {node.children.map((child) => renderNode(child))}
            </div>
          )}
        </div>
      );
    } else {
      const FileIcon = getFileIcon(node.name);
      const isSelected = selectedFilePath === node.path;
      return (
        <div
          key={node.path}
          onClick={() => onSelectFile(node.path)}
          className={`flex items-center space-x-2 px-2 py-1.5 text-xs font-mono transition cursor-pointer rounded-none ${
            isSelected
              ? 'bg-[#1a1a1a] text-violet-400 font-bold border-l-2 border-violet-500 pl-1.5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a1a]/30'
          }`}
          id={`file-tree-item-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
        >
          <FileIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-violet-400' : 'text-slate-500'}`} />
          <span className="truncate">{node.name}</span>
        </div>
      );
    }
  };

  // Convert linear file list to structured nodes if not already nested
  const buildTree = (fileList: FileNode[]): FileNode[] => {
    const root: FileNode[] = [];
    const map: Record<string, FileNode> = {};

    fileList.forEach((file) => {
      const parts = file.path.split('/');
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;

        if (!map[currentPath]) {
          const newNode: FileNode = {
            path: currentPath,
            name: part,
            type: isLast ? 'file' : 'folder',
            content: isLast ? file.content : undefined,
            children: isLast ? undefined : [],
          };
          map[currentPath] = newNode;

          if (index === 0) {
            root.push(newNode);
          } else {
            const parentPath = parts.slice(0, index).join('/');
            map[parentPath].children?.push(newNode);
          }
        }
      });
    });

    return root;
  };

  const treeStructure = files[0]?.children ? files : buildTree(files);

  return (
    <div
      className="bg-[#111111] border border-[#222222] p-4 shadow-xl h-full space-y-3 rounded-none flex flex-col justify-between"
      id="file-tree-container"
    >
      <div className="space-y-3">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-2 pb-2 border-b border-[#222222] flex justify-between items-center font-bold">
          <span>File Workspace</span>
          <span>{files.length} Files</span>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[320px] pr-1">
          {treeStructure.map((node) => renderNode(node))}
        </div>
      </div>

      {/* File Action Controls (Upload / Download) */}
      <div className="pt-3 border-t border-[#222222] space-y-2">
        <input
          type="file"
          ref={fileUploadRef}
          onChange={handleFileChosen}
          className="hidden"
          accept=".tsx,.ts,.jsx,.js,.json,.css,.html,.md,.txt,.env"
        />
        <button
          onClick={() => fileUploadRef.current?.click()}
          className="w-full bg-[#080808] hover:bg-[#1a1a1a] text-violet-400 hover:text-violet-300 border border-[#222222] px-2.5 py-1.5 text-[10px] font-mono font-bold flex items-center justify-center space-x-1.5 transition uppercase tracking-wider"
          id="upload-file-btn"
        >
          <Upload className="w-3 h-3" />
          <span>Upload File</span>
        </button>

        {onDownloadProject && (
          <button
            onClick={onDownloadProject}
            className="w-full bg-[#080808] hover:bg-[#1a1a1a] text-slate-300 hover:text-white border border-[#222222] px-2.5 py-1.5 text-[10px] font-mono font-bold flex items-center justify-center space-x-1.5 transition uppercase tracking-wider"
            id="download-project-bundle-btn"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Download Bundle</span>
          </button>
        )}
      </div>
    </div>
  );
}
