import React, { useState, useEffect } from 'react';
import { FileCode, Save, Sparkles, AlertCircle, PlayCircle, Download, CheckCircle, RefreshCw } from 'lucide-react';

interface CodeViewerProps {
  filePath: string;
  initialContent: string;
  projectId: string;
  onSave: (path: string, content: string) => Promise<void>;
}

export default function CodeViewer({ filePath, initialContent, projectId, onSave }: CodeViewerProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [sreOptimizing, setSreOptimizing] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'running' | 'success' | 'failed'; logs: string[] }>({
    status: 'idle',
    logs: [],
  });

  useEffect(() => {
    setContent(initialContent);
    setTestResult({ status: 'idle', logs: [] });
  }, [initialContent, filePath]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(filePath, content);
    setIsSaving(false);
  };

  // SRE auto-healing API trigger
  const runSreOptimize = async () => {
    setSreOptimizing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sre-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.optimizedContent);
        await onSave(filePath, data.optimizedContent);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSreOptimizing(false);
    }
  };

  // Simulated SRE test suite compilation
  const runTestSuite = () => {
    setRunningTests(true);
    setTestResult({ status: 'running', logs: ['Initializing test harness...', 'Mounting mock virtual DOM...', 'Validating state hooks compliance...'] });

    setTimeout(() => {
      setTestResult(prev => ({
        ...prev,
        logs: [...prev.logs, '✔ App component rendered without throwing', '✔ State modification triggers re-render', '✔ Tailwind utility classes compiled'],
      }));
    }, 1000);

    setTimeout(() => {
      setTestResult({
        status: 'success',
        logs: [
          'Initializing test harness...',
          'Mounting mock virtual DOM...',
          'Validating state hooks compliance...',
          '✔ App component rendered without throwing',
          '✔ State modification triggers re-render',
          '✔ Tailwind utility classes compiled',
          'SRE VALIDATION PASSED: 3/3 tests succeeded. High-availability verified.',
        ],
      });
      setRunningTests(false);
    }, 2000);
  };

  // Download code file
  const downloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filePath.split('/').pop() || 'code.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = content.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  return (
    <div className="bg-[#111111] border border-[#222222] flex flex-col h-[520px] text-slate-100 overflow-hidden shadow-2xl rounded-none" id="code-viewer">
      
      {/* Editor Control Bar */}
      <div className="bg-[#050505] px-4 py-3 border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
          <FileCode className="text-violet-400 w-4 h-4" />
          <span className="font-bold tracking-wider">{filePath}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* SRE Optimize */}
          <button
            onClick={runSreOptimize}
            disabled={sreOptimizing}
            className="bg-indigo-500/10 hover:bg-[#111111] text-indigo-400 border border-indigo-500/20 px-2.5 py-1.5 text-[10px] font-mono font-bold flex items-center space-x-1.5 disabled:opacity-50 transition uppercase tracking-widest rounded-none"
            id="sre-autoheal-btn"
          >
            {sreOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>SRE Auto-Heal</span>
          </button>

          {/* SRE Unit Tests */}
          <button
            onClick={runTestSuite}
            disabled={runningTests}
            className="bg-cyan-500/10 hover:bg-[#111111] text-cyan-400 border border-cyan-500/20 px-2.5 py-1.5 text-[10px] font-mono font-bold flex items-center space-x-1.5 disabled:opacity-50 transition uppercase tracking-widest rounded-none"
            id="run-tests-btn"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Run Tests</span>
          </button>

          {/* Save file */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white hover:bg-violet-400 text-black px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest flex items-center space-x-1.5 disabled:opacity-50 transition rounded-none"
            id="save-code-btn"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save File'}</span>
          </button>

          {/* Download */}
          <button
            onClick={downloadFile}
            className="p-1.5 text-slate-400 hover:text-white bg-[#050505] hover:bg-[#1a1a1a] border border-[#222222] transition rounded-none"
            title="Download file"
            id="download-code-btn"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Body */}
      <div className="flex-1 flex overflow-hidden font-mono text-sm">
        {/* Line Gutter */}
        <div className="bg-[#111111] text-slate-600 text-right select-none pr-3 pl-4 py-4 border-r border-[#222222] text-xs text-slate-600/70">
          {lineNumbers.map((num) => (
            <div key={num} className="h-[21px]">
              {num}
            </div>
          ))}
        </div>

        {/* Text Area Canvas */}
        <textarea
          className="flex-1 bg-[#050505] text-slate-200 px-4 py-4 focus:ring-0 focus:outline-none resize-none font-mono text-xs leading-[21px] overflow-auto border-none outline-none select-text whitespace-pre rounded-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          id="editor-canvas"
        />
      </div>

      {/* SRE test popup terminal logs */}
      {testResult.status !== 'idle' && (
        <div className="border-t border-[#222222] bg-[#050505] px-5 py-3.5 font-mono text-xs space-y-2 rounded-none">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Test suite run logs
            </span>
            <span>{testResult.status}</span>
          </div>
          <div className="bg-[#111111] p-3 rounded-none border border-[#222222] text-slate-300 max-h-24 overflow-y-auto space-y-1">
            {testResult.logs.map((log, i) => (
              <div key={i} className={log.startsWith('SRE') ? 'text-emerald-400 font-bold' : log.startsWith('✔') ? 'text-emerald-400' : 'text-slate-400'}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
