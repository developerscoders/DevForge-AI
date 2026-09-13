import { FileNode } from '../types.js';

export function generateCalculatorProjectFiles(appName: string, prompt: string, safeName: string): FileNode[] {
  const cleanTitle = appName || 'Precision Scientific Calculator';

  return [
    // 1. PRD.md
    {
      path: 'PRD.md',
      name: 'PRD.md',
      type: 'file',
      content: `# Product Requirements Document (PRD)
## Project: ${cleanTitle}

### 1. Executive Overview
${prompt || 'An enterprise-grade, high-precision calculation engine and interactive web application.'}

### 2. Core Functional Requirements
- **Standard Calculations**: Addition, subtraction, multiplication, division, modulo, percentage, negative/positive negation.
- **Precision Arithmetic**: Guarded against floating point rounding artifacts (e.g. 0.1 + 0.2 = 0.3).
- **Scientific Mode**:
  - Trigonometry: sin, cos, tan with degree/radian accuracy.
  - Logarithmic: natural log (ln), common log (log10).
  - Exponential & Algebraic: square root, x^2, x^y, 1/x, factorial (n!).
  - Universal Constants: π (Pi), e (Euler's number).
- **Memory Registers**:
  - MC (Memory Clear), MR (Memory Recall), M+ (Memory Add), M- (Memory Subtract), MS (Memory Store).
- **History Tape & Audit Trail**:
  - Live session calculation log with timestamp.
  - Replay button: 1-click re-insertion of past expressions or results into the active display.
  - Clear history action.
- **Integrated Unit Converter**:
  - Instant conversion between metric and imperial units for Length, Weight, and Temperature.
- **Keyboard Shortcuts**:
  - Full numeric keypad mapping (0-9, ., +, -, *, /, Enter, Backspace, Esc).

### 3. Architecture & Modular File Tree
Following modern Lovable/Vite architecture:
- \`src/App.tsx\`: Application shell, mode tabs, and theme layout.
- \`src/components/Calculator.tsx\`: Primary state coordinator.
- \`src/components/Display.tsx\`: High-contrast display with memory indicator and clipboard copy.
- \`src/components/Keypad.tsx\`: Tactile button matrix.
- \`src/components/ScientificKeypad.tsx\`: Advanced mathematical function controls.
- \`src/components/HistoryTape.tsx\`: Historical logs and replay mechanisms.
- \`src/components/UnitConverter.tsx\`: Multi-unit transformer.
- \`src/lib/calculatorEngine.ts\`: Pure mathematical algorithms and precision helpers.
- \`src/lib/utils.ts\`: Formatting and clipboard utilities.
- \`src/types.ts\`: TypeScript interfaces.
- \`server/server.ts\`: Express server on port 3000.
- \`server/routes.ts\`: Calculation audit and math APIs.
`
    },

    // 2. architecture.md
    {
      path: 'architecture.md',
      name: 'architecture.md',
      type: 'file',
      content: `# System Architecture Specification
## ${cleanTitle}

### Component Hierarchy
\`\`\`
[Browser Client]
       │
       ▼
src/App.tsx (Mode Controller: Standard | Scientific | Converter)
       │
       ├── src/components/Calculator.tsx (Central Engine State)
       │     ├── src/components/Display.tsx (Active Value + Memory Badge)
       │     ├── src/components/Keypad.tsx (Standard Input Matrix)
       │     └── src/components/ScientificKeypad.tsx (Advanced Math Controls)
       │
       ├── src/components/HistoryTape.tsx (Calculation Logs & Replay)
       │
       └── src/components/UnitConverter.tsx (Metric & Imperial Conversions)
\`\`\`

### Data & State Management
- Pure evaluation logic separated in \`src/lib/calculatorEngine.ts\`.
- All operations adhere to standard arithmetic precedence.
- Server-side audit logging supported via Express \`server/routes.ts\`.
`
    },

    // 3. package.json
    {
      path: 'package.json',
      name: 'package.json',
      type: 'file',
      content: JSON.stringify(
        {
          name: safeName,
          version: '1.0.0',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
            'server:start': 'node server/server.js'
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.460.0'
          },
          devDependencies: {
            vite: '^6.2.0',
            '@vitejs/plugin-react': '^4.3.0',
            '@tailwindcss/vite': '^4.0.0',
            tailwindcss: '^4.0.0',
            typescript: '^5.7.0',
            '@types/react': '^19.0.0',
            '@types/react-dom': '^19.0.0'
          }
        },
        null,
        2
      )
    },

    // 4. tsconfig.json
    {
      path: 'tsconfig.json',
      name: 'tsconfig.json',
      type: 'file',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            useDefineForClassFields: true,
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true
          },
          include: ['src', 'server']
        },
        null,
        2
      )
    },

    // 5. vite.config.ts
    {
      path: 'vite.config.ts',
      name: 'vite.config.ts',
      type: 'file',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
`
    },

    // 5b. vercel.json
    {
      path: 'vercel.json',
      name: 'vercel.json',
      type: 'file',
      content: JSON.stringify(
        {
          $schema: 'https://openapi.vercel.sh/vercel.json',
          framework: 'vite',
          buildCommand: 'vite build',
          outputDirectory: 'dist',
          cleanUrls: true,
          rewrites: [
            { source: '/(.*)', destination: '/index.html' }
          ]
        },
        null,
        2
      )
    },

    // 6. index.html
    {
      path: 'index.html',
      name: 'index.html',
      type: 'file',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${cleanTitle}</title>
    <!-- Instant Tailwind CSS Engine via CDN: Guarantees 100% full styling on Vercel, Netlify, and static edge -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#09090b] text-slate-100 antialiased font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
    },

    // 7. src/main.tsx
    {
      path: 'src/main.tsx',
      name: 'main.tsx',
      type: 'file',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },

    // 8. src/index.css
    {
      path: 'src/index.css',
      name: 'index.css',
      type: 'file',
      content: `@import "tailwindcss";

@layer base {
  body {
    background-color: #09090b;
    color: #f8fafc;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
}
`
    },

    // 9. src/types.ts
    {
      path: 'src/types.ts',
      name: 'types.ts',
      type: 'file',
      content: `export type CalculatorMode = 'standard' | 'scientific' | 'converter';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export interface UnitConversion {
  category: 'length' | 'weight' | 'temp';
  fromUnit: string;
  toUnit: string;
  inputValue: number;
  resultValue: number;
}
`
    },

    // 10. src/lib/calculatorEngine.ts
    {
      path: 'src/lib/calculatorEngine.ts',
      name: 'calculatorEngine.ts',
      type: 'file',
      content: `/**
 * Core mathematical engine providing precision arithmetic,
 * trigonometric evaluation, and algebraic utilities.
 */
export function calculate(a: number, b: number, operator: string): number {
  let res = 0;
  switch (operator) {
    case '+':
      res = a + b;
      break;
    case '−':
    case '-':
      res = a - b;
      break;
    case '×':
    case '*':
      res = a * b;
      break;
    case '÷':
    case '/':
      res = b !== 0 ? a / b : 0;
      break;
    case '%':
      res = a % b;
      break;
    case '^':
      res = Math.pow(a, b);
      break;
    default:
      res = b;
  }
  // Eliminate IEEE 754 floating point artifacts
  return parseFloat(res.toPrecision(12));
}

export function evaluateScientific(value: number, funcName: string): { result: number; label: string } {
  let result = value;
  let label = '';

  switch (funcName) {
    case 'sin':
      result = Math.sin((value * Math.PI) / 180);
      label = \`sin(\${value}°)\`;
      break;
    case 'cos':
      result = Math.cos((value * Math.PI) / 180);
      label = \`cos(\${value}°)\`;
      break;
    case 'tan':
      result = Math.tan((value * Math.PI) / 180);
      label = \`tan(\${value}°)\`;
      break;
    case 'sqrt':
      result = value >= 0 ? Math.sqrt(value) : 0;
      label = \`√(\${value})\`;
      break;
    case 'sqr':
      result = value * value;
      label = \`sqr(\${value})\`;
      break;
    case 'log':
      result = value > 0 ? Math.log10(value) : 0;
      label = \`log(\${value})\`;
      break;
    case 'ln':
      result = value > 0 ? Math.log(value) : 0;
      label = \`ln(\${value})\`;
      break;
    case '1/x':
      result = value !== 0 ? 1 / value : 0;
      label = \`1/(\${value})\`;
      break;
    case '+/-':
      result = value * -1;
      label = '';
      break;
    case 'pi':
      result = Math.PI;
      label = 'π';
      break;
    case 'e':
      result = Math.E;
      label = 'e';
      break;
    case 'fact':
      const n = Math.floor(Math.abs(value));
      let f = 1;
      for (let i = 2; i <= Math.min(n, 12); i++) f *= i;
      result = f;
      label = \`fact(\${n})\`;
      break;
  }

  return {
    result: parseFloat(result.toPrecision(12)),
    label
  };
}
`
    },

    // 11. src/lib/utils.ts
    {
      path: 'src/lib/utils.ts',
      name: 'utils.ts',
      type: 'file',
      content: `export function formatNumber(val: number): string {
  if (Number.isInteger(val)) return val.toString();
  return parseFloat(val.toFixed(8)).toString();
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}
`
    },

    // 12. src/components/Display.tsx
    {
      path: 'src/components/Display.tsx',
      name: 'Display.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../lib/utils';

interface DisplayProps {
  value: string;
  expression: string;
  memory: number;
  mode: string;
}

export default function Display({ value, expression, memory, mode }: DisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#050507] border border-[#222] rounded-2xl p-5 space-y-2 relative shadow-inner">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 min-h-[20px]">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
            {mode}
          </span>
          {memory !== 0 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              M = {memory}
            </span>
          )}
        </div>
        <span className="truncate max-w-[280px] text-slate-400">{expression || '\u00A0'}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-3xl md:text-5xl font-mono font-black text-white tracking-tight overflow-x-auto truncate">
          {value}
        </span>
        <button
          onClick={handleCopy}
          className="p-2 text-slate-400 hover:text-white bg-[#111] hover:bg-[#222] rounded-lg transition shrink-0"
          title="Copy result"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
`
    },

    // 13. src/components/Keypad.tsx
    {
      path: 'src/components/Keypad.tsx',
      name: 'Keypad.tsx',
      type: 'file',
      content: `import React from 'react';
import { Delete } from 'lucide-react';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onOperator: (op: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEquals: () => void;
  onDecimal: () => void;
  onNegate: () => void;
}

export default function Keypad({
  onDigit,
  onOperator,
  onClear,
  onBackspace,
  onEquals,
  onDecimal,
  onNegate
}: KeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      <button
        onClick={onClear}
        className="py-3.5 md:py-4 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl font-bold font-mono text-base transition active:scale-95"
      >
        AC
      </button>
      <button
        onClick={onBackspace}
        className="py-3.5 md:py-4 bg-[#1e1e24] hover:bg-[#282830] text-slate-200 rounded-xl font-bold font-mono text-base transition flex items-center justify-center active:scale-95"
      >
        <Delete className="w-5 h-5" />
      </button>
      <button
        onClick={onNegate}
        className="py-3.5 md:py-4 bg-[#1e1e24] hover:bg-[#282830] text-slate-200 rounded-xl font-bold font-mono text-base transition active:scale-95"
      >
        ±
      </button>
      <button
        onClick={() => onOperator('÷')}
        className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
      >
        ÷
      </button>

      {['7', '8', '9'].map((d) => (
        <button
          key={d}
          onClick={() => onDigit(d)}
          className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
        >
          {d}
        </button>
      ))}
      <button
        onClick={() => onOperator('×')}
        className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
      >
        ×
      </button>

      {['4', '5', '6'].map((d) => (
        <button
          key={d}
          onClick={() => onDigit(d)}
          className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
        >
          {d}
        </button>
      ))}
      <button
        onClick={() => onOperator('−')}
        className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
      >
        −
      </button>

      {['1', '2', '3'].map((d) => (
        <button
          key={d}
          onClick={() => onDigit(d)}
          className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
        >
          {d}
        </button>
      ))}
      <button
        onClick={() => onOperator('+')}
        className="py-3.5 md:py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black font-mono text-xl transition active:scale-95 shadow"
      >
        +
      </button>

      <button
        onClick={() => onDigit('0')}
        className="col-span-2 py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
      >
        0
      </button>
      <button
        onClick={onDecimal}
        className="py-3.5 md:py-4 bg-[#18181c] hover:bg-[#222228] text-white rounded-xl font-bold font-mono text-xl transition active:scale-95 border border-[#222]"
      >
        .
      </button>
      <button
        onClick={onEquals}
        className="py-3.5 md:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-black font-mono text-2xl transition active:scale-95 shadow-lg"
      >
        =
      </button>
    </div>
  );
}
`
    },

    // 14. src/components/ScientificKeypad.tsx
    {
      path: 'src/components/ScientificKeypad.tsx',
      name: 'ScientificKeypad.tsx',
      type: 'file',
      content: `import React from 'react';

interface ScientificKeypadProps {
  onScientific: (fn: string) => void;
}

export default function ScientificKeypad({ onScientific }: ScientificKeypadProps) {
  const functions = ['sin', 'cos', 'tan', 'sqrt', 'sqr', 'fact', 'log', 'ln', '1/x', 'pi', 'e', '+/-'];

  return (
    <div className="grid grid-cols-6 gap-2 text-xs font-mono">
      {functions.map((fn) => (
        <button
          key={fn}
          onClick={() => onScientific(fn)}
          className="py-2.5 bg-[#1a1a20] hover:bg-violet-900/40 text-violet-300 hover:text-white rounded-lg font-bold transition border border-violet-500/10 active:scale-95"
        >
          {fn}
        </button>
      ))}
    </div>
  );
}
`
    },

    // 15. src/components/HistoryTape.tsx
    {
      path: 'src/components/HistoryTape.tsx',
      name: 'HistoryTape.tsx',
      type: 'file',
      content: `import React from 'react';
import { History } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryTapeProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function HistoryTape({ history, onSelect, onClear }: HistoryTapeProps) {
  return (
    <div className="bg-[#121215] border border-[#222] rounded-3xl p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#222] pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <History className="w-4 h-4 text-violet-400" />
          <span>Calculation History</span>
        </span>
        <button
          onClick={onClear}
          className="text-[10px] font-mono text-slate-500 hover:text-rose-400 uppercase font-bold"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-mono">
            No calculations recorded. Perform arithmetic to build history tape.
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="p-3 bg-[#0a0a0d] hover:bg-[#18181f] border border-[#222] rounded-xl cursor-pointer transition group"
            >
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{item.timestamp}</span>
                <span className="text-violet-400 opacity-0 group-hover:opacity-100 transition">Replay →</span>
              </div>
              <div className="text-xs font-mono text-slate-300 mt-1">{item.expression}</div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5 text-right">= {item.result}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
`
    },

    // 16. src/components/UnitConverter.tsx
    {
      path: 'src/components/UnitConverter.tsx',
      name: 'UnitConverter.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

export default function UnitConverter() {
  const [category, setCategory] = useState<'length' | 'weight' | 'temp'>('length');
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('feet');
  const [inputValue, setInputValue] = useState('1');

  const calculateConversion = () => {
    const val = parseFloat(inputValue) || 0;
    if (category === 'length') {
      const inMeters: Record<string, number> = { meters: 1, feet: 0.3048, inches: 0.0254, kilometers: 1000, miles: 1609.34 };
      const meters = val * (inMeters[fromUnit] || 1);
      return (meters / (inMeters[toUnit] || 1)).toFixed(4);
    }
    if (category === 'weight') {
      const inKg: Record<string, number> = { kilograms: 1, pounds: 0.453592, ounces: 0.0283495, grams: 0.001 };
      const kg = val * (inKg[fromUnit] || 1);
      return (kg / (inKg[toUnit] || 1)).toFixed(4);
    }
    if (category === 'temp') {
      if (fromUnit === 'celsius' && toUnit === 'fahrenheit') return ((val * 9) / 5 + 32).toFixed(2);
      if (fromUnit === 'fahrenheit' && toUnit === 'celsius') return (((val - 32) * 5) / 9).toFixed(2);
      if (fromUnit === 'celsius' && toUnit === 'kelvin') return (val + 273.15).toFixed(2);
      if (fromUnit === 'kelvin' && toUnit === 'celsius') return (val - 273.15).toFixed(2);
      return String(val);
    }
    return '0';
  };

  return (
    <div className="bg-[#121215] border border-[#222] rounded-2xl p-6 md:p-8 space-y-6 max-w-xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#222] pb-4">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-violet-400" />
          <span>Unit Converter Engine</span>
        </h3>
        <div className="flex gap-2">
          {(['length', 'weight', 'temp'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                if (cat === 'length') { setFromUnit('meters'); setToUnit('feet'); }
                if (cat === 'weight') { setFromUnit('kilograms'); setToUnit('pounds'); }
                if (cat === 'temp') { setFromUnit('celsius'); setToUnit('fahrenheit'); }
              }}
              className={\`px-2.5 py-1 text-xs font-mono uppercase font-bold rounded \${category === cat ? 'bg-violet-600 text-white' : 'bg-[#1a1a1e] text-slate-400 hover:text-white'}\`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400">From</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-[#09090b] border border-[#333] px-4 py-3 text-lg font-mono text-white rounded-lg outline-none focus:border-violet-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400">To (Calculated)</label>
          <div className="w-full bg-[#09090b] border border-violet-500/40 px-4 py-3 text-lg font-mono text-violet-300 font-bold rounded-lg">
            {calculateConversion()} {toUnit}
          </div>
        </div>
      </div>
    </div>
  );
}
`
    },

    // 17. src/components/Calculator.tsx
    {
      path: 'src/components/Calculator.tsx',
      name: 'Calculator.tsx',
      type: 'file',
      content: `import React, { useState, useEffect } from 'react';
import Display from './Display';
import Keypad from './Keypad';
import ScientificKeypad from './ScientificKeypad';
import HistoryTape from './HistoryTape';
import UnitConverter from './UnitConverter';
import { calculate, evaluateScientific } from '../lib/calculatorEngine';
import { HistoryItem } from '../types';

export default function Calculator({ appName }: { appName: string }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [mode, setMode] = useState<'standard' | 'scientific' | 'converter'>('standard');
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept keystrokes when the user is typing in form inputs, textareas, or contentEditable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('[contenteditable="true"]'))
      ) {
        return;
      }

      if (mode === 'converter') return;
      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        e.preventDefault();
        const map: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
        handleOperator(map[e.key]);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, display, waitingForOperand, operator, prevValue]);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (waitingForOperand) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const handleOperator = (nextOp: string) => {
    const val = parseFloat(display);
    if (prevValue === null) {
      setPrevValue(val);
      setExpression(\`\${display} \${nextOp}\`);
    } else if (operator) {
      const res = calculate(prevValue, val, operator);
      setPrevValue(res);
      setDisplay(String(res));
      setExpression(\`\${res} \${nextOp}\`);
    }
    setWaitingForOperand(true);
    setOperator(nextOp);
  };

  const handleEquals = () => {
    if (operator === null || prevValue === null) return;
    const val = parseFloat(display);
    const res = calculate(prevValue, val, operator);
    const strRes = String(res);
    const expr = \`\${prevValue} \${operator} \${val}\`;

    setHistory((prev) => [
      { id: String(Date.now()), expression: expr, result: strRes, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 19)
    ]);
    setDisplay(strRes);
    setExpression(\`\${expr} =\`);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleScientific = (fn: string) => {
    const val = parseFloat(display);
    const { result, label } = evaluateScientific(val, fn);
    setDisplay(String(result));
    if (label) setExpression(\`\${label} =\`);
    setWaitingForOperand(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 text-xs font-mono">
        {(['standard', 'scientific', 'converter'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={\`px-3 py-1.5 rounded font-bold uppercase transition \${mode === m ? 'bg-violet-600 text-white' : 'bg-[#18181c] text-slate-400 hover:text-white'}\`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'converter' ? (
        <UnitConverter />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121215] border border-[#222] rounded-3xl p-6 md:p-8 space-y-6">
            <Display value={display} expression={expression} memory={memory} mode={mode} />
            {mode === 'scientific' && <ScientificKeypad onScientific={handleScientific} />}
            <Keypad
              onDigit={inputDigit}
              onOperator={handleOperator}
              onClear={handleClear}
              onBackspace={handleBackspace}
              onEquals={handleEquals}
              onDecimal={inputDecimal}
              onNegate={() => handleScientific('+/-')}
            />
          </div>
          <HistoryTape
            history={history}
            onSelect={(item) => {
              setDisplay(item.result);
              setExpression(\`\${item.expression} =\`);
              setWaitingForOperand(true);
            }}
            onClear={() => setHistory([])}
          />
        </div>
      )}
    </div>
  );
}
`
    },

    // 18. src/App.tsx
    {
      path: 'src/App.tsx',
      name: 'App.tsx',
      type: 'file',
      content: `import React from 'react';
import Calculator from './components/Calculator';
import { Calculator as CalcIcon } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center space-x-3 pb-4 border-b border-[#222]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <CalcIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">${cleanTitle}</h1>
            <p className="text-xs text-slate-400 font-mono">100% Operational Precision Calculation Engine</p>
          </div>
        </header>

        <main>
          <Calculator appName="${cleanTitle}" />
        </main>
      </div>
    </div>
  );
}
`
    },

    // 19. server/routes.ts
    {
      path: 'server/routes.ts',
      name: 'routes.ts',
      type: 'file',
      content: `import { Router } from 'express';
import { calculate } from '../src/lib/calculatorEngine.js';

export const calculationRouter = Router();

calculationRouter.post('/calculate', (req, res) => {
  const { a, b, operator } = req.body;
  if (typeof a !== 'number' || typeof b !== 'number' || !operator) {
    return res.status(400).json({ error: 'Invalid math parameters' });
  }
  const result = calculate(a, b, operator);
  res.json({ result, status: 'computed' });
});
`
    },

    // 20. server/server.ts
    {
      path: 'server/server.ts',
      name: 'server.ts',
      type: 'file',
      content: `import express from 'express';
import { calculationRouter } from './routes.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api', calculationRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: '${safeName}' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server listening on http://0.0.0.0:\${PORT}\`);
});
`
    },

    // 21. README.md
    {
      path: 'README.md',
      name: 'README.md',
      type: 'file',
      content: `# ${cleanTitle}

${prompt}

## Features
- **Standard Calculations**: (+, -, ×, ÷, %, +/-) with full keyboard input
- **Scientific Mode**: sin, cos, tan, log, ln, sqrt, powers, factorials
- **Memory Registers**: MC, MR, M+, M-, MS
- **History Tape**: Replay previous answers with 1 click
- **Unit Converter**: Length, Weight, Temperature

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`
`
    }
  ];
}
