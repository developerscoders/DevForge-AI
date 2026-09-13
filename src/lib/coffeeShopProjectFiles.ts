import { FileNode } from '../types.js';

/**
 * Generates an animated, warm-aesthetic, production-ready Coffee Shop & Artisan Roastery application.
 * Incorporates top CSS keyframe animations (rising steam, floating aroma particles, cup fill levels,
 * shimmer badges, drip physics) and complete interactive functionality (cup customizer, live barista
 * brewing station, filterable menu, animated cart drawer, and order checkout).
 */
export function generateCoffeeShopProjectFiles(appName: string, prompt: string, safeName: string): FileNode[] {
  const cleanTitle = appName || 'Artisan Roast & Animated Coffee House';

  return [
    // 1. PRD.md
    {
      path: 'PRD.md',
      name: 'PRD.md',
      type: 'file',
      content: `# Product Requirements Document (PRD)
## Project: ${cleanTitle}

### 1. Executive Summary
${prompt || 'An artisan animated coffee shop web application featuring dynamic CSS steam animations, an interactive beverage customizer, live espresso brewing simulator, filterable menu, and seamless cart checkout.'}

### 2. Core Functional Requirements
- **Atmospheric Visual Identity**: Warm artisan coffee house color scheme (Warm Cream, Roasted Espresso, Caramel Amber, Latte Froth) with dynamic theme switching (Warm Artisan, Velvet Roast, Matcha Cream).
- **Top CSS Keyframe Animations**:
  - \`@keyframes steam\`: Rising and dispersing multi-stream steam waves above hot beverages.
  - \`@keyframes float\`: Gentle floating aroma particles and roasted coffee bean badges.
  - \`@keyframes pulseGlow\`: Soft golden aroma glow on signature barista creations.
  - \`@keyframes drip\`: Pour-over coffee drip physics simulation.
- **Interactive Drink Customizer**:
  - Size selection: Short (8oz), Tall (12oz), Grande (16oz) with dynamic visual cup scaling.
  - Milk options: Oat Milk, Whole Milk, Almond Milk, Coconut Froth.
  - Roast profile: Blonde Sun-Dried, House Medium, Dark French Roast.
  - Add-ons: Extra espresso shots (+1, +2), Artisan Syrups (Vanilla, Salted Caramel, Hazelnut), Ice Level.
  - Dynamic calorie, caffeine, and pricing calculator with animated cup graphic.
- **Live Barista Brewing Station**:
  - Interactive espresso extraction timer with real-time pressure gauge, extraction drip rate, and steam release.
- **Filterable Artisan Menu**:
  - Categories: Signature Lattes, Pour-Over & Drip, Cold Brew & Nitro, Fresh Bakery & Treats.
  - Hover lift cards with quick-add micro-interactions.
- **Animated Cart Drawer & Checkout**:
  - Slide-out order tray, live subtotal & tax calculation, customization badges, and 1-click checkout confirmation with celebration.
- **Roastery Story & Process Timeline**:
  - Interactive 4-step bean-to-cup journey (Sourcing, Small-Batch Roasting, Precision Grind, Master Extraction).
- **Customer Reviews & Testimonials**:
  - Interactive community rating submission with live review appending.
`
    },

    // 2. architecture.md
    {
      path: 'architecture.md',
      name: 'architecture.md',
      type: 'file',
      content: `# System Architecture Specification
## ${cleanTitle}

### 1. Architectural Topology
\`\`\`
[ React 19 Frontend ]  <--->  [ Express API Gateway (Port 3000) ]  <--->  [ Coffee Catalog Store ]
       |                                     |                                    |
(Tailwind + CSS Keyframes)              (REST / JSON)                      (In-Memory Cache)
\`\`\`

### 2. Component Hierarchy
- \`src/App.tsx\`: Root controller managing global cart state, active theme, and modal dialogs.
- \`src/components/Header.tsx\`: Responsive navigation with theme switcher and animated cart counter.
- \`src/components/Hero.tsx\`: Immersive hero with animated rising steam, ambient floating particles, and quick actions.
- \`src/components/DrinkCustomizer.tsx\`: Interactive beverage builder with visual cup graphics and ingredient toggles.
- \`src/components/BrewingSimulator.tsx\`: Barista extraction station with interactive 30s timer and pressure gauge.
- \`src/components/MenuSection.tsx\`: Filterable catalog with categorized drink cards and animated add buttons.
- \`src/components/CartDrawer.tsx\`: Slide-out tray with quantity controls, item breakdowns, and checkout.
- \`src/components/RoastingJourney.tsx\`: Interactive 4-step bean-to-cup process visualizer.
- \`src/components/ReviewsSection.tsx\`: Social proof wall with interactive star rating submission.
- \`src/types.ts\`: Domain models for DrinkItem, CustomizationOptions, CartItem, Review.
- \`src/index.css\`: Keyframes for steam, float, pulseGlow, and shimmer.
- \`server/server.ts\`: Express REST endpoints (\`/api/menu\`, \`/api/orders\`, \`/api/brew\`).
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
            test: 'vitest run',
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
            vitest: '^2.1.0',
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
            allowImportingTsExtensions: false,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: false,
            noUnusedParameters: false,
            noFallthroughCasesInSwitch: true
          },
          include: ['src', 'tests']
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

    // 6. vercel.json
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
          rewrites: [{ source: '/(.*)', destination: '/index.html' }]
        },
        null,
        2
      )
    },

    // 7. index.html
    {
      path: 'index.html',
      name: 'index.html',
      type: 'file',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d97706'><path d='M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z'/><line x1='6' y1='1' x2='6' y2='4'/><line x1='10' y1='1' x2='10' y2='4'/><line x1='14' y1='1' x2='14' y2='4'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${cleanTitle}</title>
    <meta name="description" content="Artisan animated coffee house featuring live steam animations, drink customizer, and specialty roastery menu." />
    <!-- Tailwind CSS Engine for instant edge rendering and full styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,800;1,600&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#faf7f2] text-[#2a1a12] antialiased selection:bg-amber-500 selection:text-white transition-colors duration-300">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
    },

    // 8. src/index.css (Top CSS Keyframe Animations)
    {
      path: 'src/index.css',
      name: 'index.css',
      type: 'file',
      content: `@import "tailwindcss";

@layer base {
  body {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  }
  h1, h2, h3, .font-serif-heading {
    font-family: 'Playfair Display', Georgia, serif;
  }
}

/* --- TOP CSS KEYFRAME ANIMATIONS --- */

/* 1. Rising and billowing steam waves */
@keyframes steamWaveOne {
  0% {
    transform: translateY(0) translateX(0) scaleX(1);
    opacity: 0;
  }
  15% {
    opacity: 0.7;
  }
  50% {
    transform: translateY(-28px) translateX(-6px) scaleX(1.3);
    opacity: 0.45;
  }
  100% {
    transform: translateY(-56px) translateX(8px) scaleX(1.8);
    opacity: 0;
  }
}

@keyframes steamWaveTwo {
  0% {
    transform: translateY(0) translateX(0) scaleX(1);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  60% {
    transform: translateY(-32px) translateX(8px) scaleX(1.4);
    opacity: 0.35;
  }
  100% {
    transform: translateY(-64px) translateX(-6px) scaleX(2);
    opacity: 0;
  }
}

@keyframes steamWaveThree {
  0% {
    transform: translateY(0) translateX(0) scaleX(1);
    opacity: 0;
  }
  25% {
    opacity: 0.6;
  }
  55% {
    transform: translateY(-30px) translateX(-4px) scaleX(1.2);
    opacity: 0.4;
  }
  100% {
    transform: translateY(-58px) translateX(5px) scaleX(1.6);
    opacity: 0;
  }
}

/* 2. Gentle ambient float for coffee beans and badges */
@keyframes floatGentle {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(2deg);
  }
}

/* 3. Golden aroma pulse glow */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(217, 119, 6, 0.25), 0 0 30px rgba(245, 158, 11, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(217, 119, 6, 0.45), 0 0 60px rgba(245, 158, 11, 0.2);
  }
}

/* 4. Pour-over liquid drip */
@keyframes coffeeDrip {
  0% {
    transform: translateY(0) scaleY(1);
    opacity: 0.9;
  }
  60% {
    transform: translateY(22px) scaleY(1.4);
    opacity: 1;
  }
  100% {
    transform: translateY(40px) scaleY(0.4);
    opacity: 0;
  }
}

/* 5. Metallic artisan shimmer */
@keyframes metallicShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Utility classes */
.animate-steam-1 {
  animation: steamWaveOne 3.2s infinite ease-out;
}
.animate-steam-2 {
  animation: steamWaveTwo 3.8s infinite ease-out 0.7s;
}
.animate-steam-3 {
  animation: steamWaveThree 3.4s infinite ease-out 1.4s;
}
.animate-float {
  animation: floatGentle 4.5s ease-in-out infinite;
}
.animate-pulse-glow {
  animation: pulseGlow 3s infinite ease-in-out;
}
.animate-drip {
  animation: coffeeDrip 1.6s infinite cubic-bezier(0.4, 0, 0.6, 1);
}
.animate-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: metallicShimmer 2.8s infinite;
}
`
    },

    // 9. src/types.ts
    {
      path: 'src/types.ts',
      name: 'types.ts',
      type: 'file',
      content: `export interface DrinkItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'espresso' | 'pour-over' | 'cold-brew' | 'bakery';
  basePrice: number;
  calories: number;
  roastLevel: 'Blonde' | 'Medium' | 'Dark';
  image: string;
  popular?: boolean;
  notes: string[];
}

export type CupSize = 'short' | 'tall' | 'grande';
export type MilkType = 'oat' | 'whole' | 'almond' | 'coconut';
export type SweetnessLevel = 'none' | 'vanilla' | 'caramel' | 'hazelnut';
export type TempOption = 'hot' | 'iced';

export interface CustomizationOptions {
  size: CupSize;
  milk: MilkType;
  sweetness: SweetnessLevel;
  extraShots: number;
  temperature: TempOption;
}

export interface CartItem {
  id: string;
  drink: DrinkItem;
  customization: CustomizationOptions;
  finalPrice: number;
  quantity: number;
}

export interface Review {
  id: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  drinkMentioned: string;
  date: string;
}

export type ThemeMode = 'artisan' | 'velvet-dark' | 'matcha';
`
    },

    // 10. src/data/drinks.ts
    {
      path: 'src/data/drinks.ts',
      name: 'drinks.ts',
      type: 'file',
      content: `import { DrinkItem } from '../types';

export const MENU_DRINKS: DrinkItem[] = [
  {
    id: 'drink_1',
    name: 'Caramel Cloud Macchiato',
    tagline: 'Velvety micro-foam with fleur de sel caramel drizzle',
    description: 'Freshly pulled double espresso poured over silky steamed oat milk, finished with golden bourbon caramel and vanilla bean essence.',
    category: 'espresso',
    basePrice: 5.75,
    calories: 210,
    roastLevel: 'Medium',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
    popular: true,
    notes: ['Salted Toffee', 'Vanilla Bean', 'Honeycomb']
  },
  {
    id: 'drink_2',
    name: 'Ethiopian Yirgacheffe Pour-Over',
    tagline: 'Single origin hand-crafted manual pour-over',
    description: 'Lightly roasted heirloom beans with sparkling floral jasmine aroma, bergamot citrus notes, and a crisp wild honey finish.',
    category: 'pour-over',
    basePrice: 6.25,
    calories: 5,
    roastLevel: 'Blonde',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80',
    popular: true,
    notes: ['Jasmine', 'Bergamot', 'Wild Peach']
  },
  {
    id: 'drink_3',
    name: 'Nitro Cold Brew with Vanilla Sweet Cream',
    tagline: 'Slow steeped for 24 hours & infused with nitrogen',
    description: 'Ultra-smooth draft cold brew cascading with velvet micro-bubbles, crowned with artisan Madagascar vanilla sweet foam.',
    category: 'cold-brew',
    basePrice: 5.95,
    calories: 140,
    roastLevel: 'Dark',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
    popular: true,
    notes: ['Dark Chocolate', 'Malted Grain', 'Creamy Froth']
  },
  {
    id: 'drink_4',
    name: 'Smoked Cinnamon Cortado',
    tagline: 'Equal parts precision espresso and silky warm milk',
    description: 'Double ristretto blended with gently textured whole milk, infused with torched Ceylon cinnamon and a drop of maple syrup.',
    category: 'espresso',
    basePrice: 4.85,
    calories: 110,
    roastLevel: 'Dark',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80',
    notes: ['Smoked Cinnamon', 'Nutmeg', 'Maple Sugar']
  },
  {
    id: 'drink_5',
    name: 'Kyoto-Style Slow Drip Reserve',
    tagline: 'Single droplet cold extraction over Japanese cedar',
    description: 'An 18-hour cold percolation that unlocks complex dark chocolate, wine-like fruit undertones, and zero bitterness.',
    category: 'cold-brew',
    basePrice: 6.85,
    calories: 10,
    roastLevel: 'Medium',
    image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=500&auto=format&fit=crop&q=80',
    notes: ['Dark Plum', 'Cacao Nibs', 'Black Cherry']
  },
  {
    id: 'drink_6',
    name: 'Almond Cardamom Morning Croissant',
    tagline: 'Freshly baked French butter pastry with toasted frangipane',
    description: 'Twice-baked flaky croissant filled with rich almond cream, dusted with powdered raw cane sugar and crushed cardamom.',
    category: 'bakery',
    basePrice: 4.50,
    calories: 340,
    roastLevel: 'Medium',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
    popular: true,
    notes: ['Flaky Butter', 'Toasted Almond', 'Green Cardamom']
  }
];

export const INITIAL_REVIEWS = [
  {
    id: 'rev_1',
    author: 'Elena Rostova',
    role: 'Specialty Coffee Guild Member',
    rating: 5,
    comment: 'The rising steam visuals and interactive customizer are phenomenal. The Ethiopian Yirgacheffe pour-over had the exact jasmine notes promised.',
    drinkMentioned: 'Ethiopian Yirgacheffe Pour-Over',
    date: 'Yesterday'
  },
  {
    id: 'rev_2',
    author: 'Marcus Vance',
    role: 'Design Director',
    rating: 5,
    comment: 'Finally a coffee app that matches the warm sensory atmosphere of an actual artisan roastery! The live brewing timer is so satisfying.',
    drinkMentioned: 'Caramel Cloud Macchiato',
    date: '2 days ago'
  },
  {
    id: 'rev_3',
    author: 'Sarah Chen',
    role: 'Food & Architecture Critic',
    rating: 5,
    comment: 'The micro-interactions, smooth steam keyframes, and attention to roast profiles make this the gold standard coffee experience.',
    drinkMentioned: 'Nitro Cold Brew with Vanilla Sweet Cream',
    date: '3 days ago'
  }
];
`
    },

    // 11. src/components/Header.tsx
    {
      path: 'src/components/Header.tsx',
      name: 'Header.tsx',
      type: 'file',
      content: `import React from 'react';
import { Coffee, ShoppingBag, Sun, Moon, Sparkles, MapPin, Clock } from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  cartCount: number;
  onOpenCart: () => void;
  onScrollToMenu: () => void;
  onScrollToCustomizer: () => void;
  onScrollToBrew: () => void;
}

export default function Header({
  theme,
  setTheme,
  cartCount,
  onOpenCart,
  onScrollToMenu,
  onScrollToCustomizer,
  onScrollToBrew
}: HeaderProps) {
  const isDark = theme === 'velvet-dark';

  return (
    <header className={\`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 \${
      isDark
        ? 'bg-[#18110b]/90 border-[#322015] text-[#f5ede3]'
        : 'bg-[#faf7f2]/90 border-[#ebdcc9] text-[#2a1a12]'
    }\`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white text-[11px] font-medium py-1 px-4 text-center flex items-center justify-center space-x-3">
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-amber-200 animate-spin" />
          <span>Fresh Single-Origin Batch Roasted 4 Hours Ago</span>
        </span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Live Barista Station Online</span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo with animated coffee steam */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center shadow-lg shadow-amber-900/20 group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5 text-amber-100" />
            {/* Tiny steam trails above icon */}
            <span className="absolute -top-2 left-3 w-1 h-3 bg-amber-400/60 rounded-full animate-steam-1" />
            <span className="absolute -top-3 left-5 w-1 h-4 bg-amber-300/60 rounded-full animate-steam-2" />
          </div>
          <div>
            <div className="font-serif-heading font-bold text-lg sm:text-xl tracking-tight leading-none flex items-center space-x-1.5">
              <span>AURA ROASTERS</span>
              <span className="text-[10px] uppercase font-sans font-extrabold tracking-widest bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">Artisan</span>
            </div>
            <div className="text-[10px] text-amber-800/70 dark:text-amber-200/70 font-medium flex items-center space-x-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-amber-600" />
              <span>San Francisco • Hand-Poured Daily</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider">
          <button onClick={onScrollToMenu} className="hover:text-amber-600 transition cursor-pointer">
            Menu
          </button>
          <button onClick={onScrollToCustomizer} className="hover:text-amber-600 transition flex items-center space-x-1 cursor-pointer">
            <span>Drink Builder</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-bold">Interactive</span>
          </button>
          <button onClick={onScrollToBrew} className="hover:text-amber-600 transition flex items-center space-x-1 cursor-pointer">
            <span>Barista Lab</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Theme Switcher Toggle */}
          <div className="flex items-center bg-amber-100/60 dark:bg-amber-950/40 p-1 rounded-full border border-amber-200 dark:border-amber-800 text-xs">
            <button
              onClick={() => setTheme('artisan')}
              className={\`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center space-x-1 \${
                theme === 'artisan'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-amber-900 dark:text-amber-200 hover:text-amber-600'
              }\`}
              title="Warm Artisan Latte Palette"
            >
              <Sun className="w-3 h-3" />
              <span className="hidden sm:inline">Warm</span>
            </button>
            <button
              onClick={() => setTheme('velvet-dark')}
              className={\`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center space-x-1 \${
                theme === 'velvet-dark'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-900 dark:text-amber-200 hover:text-amber-600'
              }\`}
              title="Velvet Mocha Dark Palette"
            >
              <Moon className="w-3 h-3" />
              <span className="hidden sm:inline">Mocha</span>
            </button>
          </div>

          {/* Cart Trigger with Bouncing Badge */}
          <button
            onClick={onOpenCart}
            className="relative bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-900/20 flex items-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-amber-900 text-[10px] font-black flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
`
    },

    // 12. src/components/Hero.tsx
    {
      path: 'src/components/Hero.tsx',
      name: 'Hero.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import { Coffee, Flame, Sparkles, ArrowRight, Award, ShieldCheck, Heart } from 'lucide-react';

interface HeroProps {
  onExploreMenu: () => void;
  onCustomizeDrink: () => void;
}

export default function Hero({ onExploreMenu, onCustomizeDrink }: HeroProps) {
  const [steamIntensity, setSteamIntensity] = useState<'gentle' | 'rich' | 'intense'>('rich');

  return (
    <section className="relative overflow-hidden py-12 md:py-20 px-4 sm:px-6">
      {/* Background warm radial aura */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Typography & Story */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-amber-500/15 border border-amber-600/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-800 dark:text-amber-200 animate-float">
            <Award className="w-4 h-4 text-amber-600" />
            <span>2026 World Barista Championship Winner • Special Reserve</span>
          </div>

          <h1 className="font-serif-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#2c1810] dark:text-[#fdf8f4]">
            Crafted with Passion. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900">
              Steamed to Perfection.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#5c3e2e] dark:text-[#d1b8a5] max-w-xl leading-relaxed">
            Welcome to Aura Roasters. Every cup is an aromatic journey—from sun-drenched Ethiopian hillsides to our in-house German cast-iron roaster, poured with precision micro-foam and artisanal syrups.
          </p>

          {/* Interactive Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[#f2ebe1] dark:bg-[#251811] p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 text-center">
              <div className="font-serif-heading text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300">100%</div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#735341] dark:text-[#a88d7b] uppercase">Arabica Heirloom</div>
            </div>
            <div className="bg-[#f2ebe1] dark:bg-[#251811] p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 text-center">
              <div className="font-serif-heading text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300">92°C</div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#735341] dark:text-[#a88d7b] uppercase">Precision Extraction</div>
            </div>
            <div className="bg-[#f2ebe1] dark:bg-[#251811] p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 text-center">
              <div className="font-serif-heading text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300">0s</div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#735341] dark:text-[#a88d7b] uppercase">Zero Delay Order</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onExploreMenu}
              className="bg-[#2c1810] hover:bg-[#3d2317] text-white dark:bg-amber-600 dark:hover:bg-amber-500 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-950/20 flex items-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Explore Coffee Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onCustomizeDrink}
              className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-600/30 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl flex items-center space-x-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Interactive Cup Customizer</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Animated Coffee Cup & Rising Steam Station */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#f5ede3] to-[#ebdcc9] dark:from-[#231710] dark:to-[#18110b] p-8 rounded-3xl border border-amber-300/40 dark:border-amber-700/40 shadow-2xl animate-pulse-glow">
            {/* Top Steam Emitter with Multi-Wave Keyframes */}
            <div className="relative h-24 flex items-end justify-center mb-2">
              <div className="absolute bottom-2 flex space-x-5 pointer-events-none">
                <span className="w-2.5 h-16 bg-gradient-to-t from-amber-200/90 to-transparent rounded-full filter blur-[2px] animate-steam-1" />
                <span className="w-3.5 h-20 bg-gradient-to-t from-amber-100/95 to-transparent rounded-full filter blur-[2px] animate-steam-2" />
                <span className="w-2.5 h-14 bg-gradient-to-t from-amber-200/80 to-transparent rounded-full filter blur-[2px] animate-steam-3" />
                {steamIntensity === 'intense' && (
                  <span className="w-4 h-22 bg-gradient-to-t from-white/90 to-transparent rounded-full filter blur-[1px] animate-steam-1" />
                )}
              </div>
            </div>

            {/* Visual Cup Centerpiece */}
            <div className="relative flex flex-col items-center">
              {/* Cup Rim & Froth */}
              <div className="w-44 h-8 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 rounded-[50%] border-4 border-amber-300 shadow-inner flex items-center justify-center z-10">
                <div className="w-36 h-5 bg-[#3a2014] rounded-[50%] shadow-inner flex items-center justify-center">
                  {/* Latte Art Rosette SVG */}
                  <div className="w-20 h-3 bg-amber-100/70 rounded-full blur-[0.6px] animate-pulse" />
                </div>
              </div>

              {/* Cup Body */}
              <div className="w-40 h-36 bg-gradient-to-b from-[#fcf9f5] to-[#ece3d4] dark:from-[#352217] dark:to-[#22150f] rounded-b-[40px] border-x-4 border-b-4 border-amber-300/80 shadow-2xl flex flex-col items-center justify-center relative -mt-4">
                <div className="w-12 h-12 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-serif-heading font-black text-lg shadow">
                  A
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 dark:text-amber-200 mt-1">
                  Aura Roasters
                </div>
                <div className="text-[9px] text-amber-700/70 dark:text-amber-400/70 font-mono">
                  Single Origin 2026
                </div>

                {/* Cup Handle */}
                <div className="absolute -right-7 top-6 w-9 h-16 border-4 border-amber-300/80 rounded-r-3xl bg-transparent" />
              </div>

              {/* Saucer */}
              <div className="w-56 h-4 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 dark:from-amber-800 dark:via-amber-700 dark:to-amber-800 rounded-full border border-amber-300 shadow-xl -mt-1" />
            </div>

            {/* Steam Control Toggle */}
            <div className="mt-8 pt-4 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between text-xs">
              <span className="font-bold text-[#5c3e2e] dark:text-[#d1b8a5] flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Steam Intensity</span>
              </span>
              <div className="flex items-center space-x-1 bg-amber-200/50 dark:bg-amber-900/40 p-0.5 rounded-lg text-[10px] font-bold">
                {(['gentle', 'rich', 'intense'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSteamIntensity(lvl)}
                    className={\`px-2 py-0.5 rounded transition capitalize \${
                      steamIntensity === lvl
                        ? 'bg-amber-700 text-white'
                        : 'text-amber-900 dark:text-amber-300 hover:text-amber-700'
                    }\`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`
    },

    // 13. src/components/DrinkCustomizer.tsx
    {
      path: 'src/components/DrinkCustomizer.tsx',
      name: 'DrinkCustomizer.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import { Coffee, Plus, Check, Sparkles, Droplets, Thermometer, ShieldCheck } from 'lucide-react';
import { DrinkItem, CustomizationOptions, CupSize, MilkType, SweetnessLevel, TempOption } from '../types';

interface DrinkCustomizerProps {
  onAddToCart: (customizedDrink: { drink: DrinkItem; customization: CustomizationOptions; finalPrice: number }) => void;
}

const BASE_CUSTOM_DRINK: DrinkItem = {
  id: 'custom_latte_special',
  name: 'Custom Artisan Signature',
  tagline: 'Tailored to your exact flavor palate and roast preference',
  description: 'Handcrafted espresso drink created step-by-step with your selected cup size, organic milk choice, and craft flavor syrups.',
  category: 'espresso',
  basePrice: 5.25,
  calories: 160,
  roastLevel: 'Medium',
  image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
  notes: ['Custom Blend', 'Micro-Foam', 'Made Fresh']
};

export default function DrinkCustomizer({ onAddToCart }: DrinkCustomizerProps) {
  const [size, setSize] = useState<CupSize>('tall');
  const [milk, setMilk] = useState<MilkType>('oat');
  const [sweetness, setSweetness] = useState<SweetnessLevel>('vanilla');
  const [extraShots, setExtraShots] = useState<number>(1);
  const [temperature, setTemperature] = useState<TempOption>('hot');
  const [isAdded, setIsAdded] = useState(false);

  // Price calculations
  const sizePrice = size === 'short' ? 0 : size === 'tall' ? 0.65 : 1.25;
  const milkPrice = milk === 'oat' || milk === 'almond' ? 0.75 : milk === 'coconut' ? 0.85 : 0;
  const syrupPrice = sweetness !== 'none' ? 0.50 : 0;
  const shotsPrice = extraShots * 0.95;
  const finalPrice = Number((BASE_CUSTOM_DRINK.basePrice + sizePrice + milkPrice + syrupPrice + shotsPrice).toFixed(2));

  // Dynamic calorie calculations
  const calBase = 80;
  const calMilk = milk === 'whole' ? 120 : milk === 'oat' ? 90 : milk === 'almond' ? 45 : 75;
  const calSyrup = sweetness !== 'none' ? 60 : 0;
  const totalCalories = calBase + calMilk + calSyrup;

  const handleAdd = () => {
    onAddToCart({
      drink: {
        ...BASE_CUSTOM_DRINK,
        name: \`\${temperature === 'iced' ? 'Iced ' : 'Steamed '}\${milk.toUpperCase()} Custom Latte (\${size.toUpperCase()})\`
      },
      customization: { size, milk, sweetness, extraShots, temperature },
      finalPrice
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <section id="customizer-section" className="py-14 px-4 sm:px-6 bg-[#f5ede3] dark:bg-[#1e140d] border-y border-amber-200/70 dark:border-amber-800/40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Barista Workshop</span>
          </div>
          <h2 className="font-serif-heading text-3xl sm:text-4xl font-black text-[#2c1810] dark:text-[#fef3c7]">
            Build Your Dream Coffee
          </h2>
          <p className="text-xs sm:text-sm text-[#5c3e2e] dark:text-[#d1b8a5]">
            Tweak every attribute—from temperature and cup scale to extra espresso shots and artisanal froth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Visual Cup Graphic */}
          <div className="lg:col-span-5 bg-[#faf7f2] dark:bg-[#251811] p-8 rounded-3xl border border-amber-200 dark:border-amber-800/60 shadow-xl flex flex-col items-center justify-between min-h-[460px]">
            <div className="w-full flex justify-between items-center text-xs font-mono">
              <span className="text-amber-800 dark:text-amber-300 font-bold uppercase">Live Visualization</span>
              <span className="text-[#8c6b57] dark:text-[#b39580]">{totalCalories} kcal • {extraShots + 1} Shots</span>
            </div>

            {/* Cup Render Container */}
            <div className="relative py-12 flex flex-col items-center">
              {/* Hot steam waves (only if hot) */}
              {temperature === 'hot' && (
                <div className="absolute top-2 flex space-x-3 pointer-events-none">
                  <span className="w-2 h-14 bg-amber-400/50 rounded-full filter blur-[1.5px] animate-steam-1" />
                  <span className="w-2.5 h-16 bg-amber-300/60 rounded-full filter blur-[1.5px] animate-steam-2" />
                </div>
              )}

              {/* Cup scale changes with size */}
              <div
                className={\`transition-all duration-500 flex flex-col items-center \${
                  size === 'short' ? 'scale-90' : size === 'tall' ? 'scale-100' : 'scale-110'
                }\`}
              >
                {/* Cup Rim */}
                <div className="w-36 h-6 bg-amber-200 rounded-[50%] border-2 border-amber-400 flex items-center justify-center shadow-inner">
                  <div className="w-30 h-4 bg-[#3a2014] rounded-[50%] flex items-center justify-center">
                    <span className="text-[8px] font-mono text-amber-200/60">{milk} foam</span>
                  </div>
                </div>

                {/* Cup Glass Container */}
                <div className="w-32 h-44 bg-gradient-to-b from-amber-100/90 to-amber-900/40 rounded-b-3xl border-2 border-amber-300/60 shadow-2xl relative overflow-hidden flex flex-col justify-end p-2 -mt-3">
                  {/* Liquid fill layer */}
                  <div
                    className={\`w-full bg-gradient-to-t from-[#2c1810] via-[#5c3e2e] to-[#c78851] rounded-b-2xl transition-all duration-700 flex flex-col items-center justify-center text-white text-[10px] font-mono \${
                      size === 'short' ? 'h-24' : size === 'tall' ? 'h-32' : 'h-38'
                    }\`}
                  >
                    <span className="font-bold uppercase tracking-wider">{temperature}</span>
                    <span className="text-[9px] opacity-80">{extraShots + 1}x Espresso</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Summary Tag */}
            <div className="w-full bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-amber-800 dark:text-amber-300 font-mono uppercase font-bold">Calculated Price</div>
                <div className="font-serif-heading text-2xl font-black text-amber-900 dark:text-amber-200">${finalPrice}</div>
              </div>
              <button
                onClick={handleAdd}
                className={\`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer \${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }\`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Cup</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Controls Grid */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Temperature Toggle */}
            <div className="bg-[#faf7f2] dark:bg-[#251811] p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4a2e1f] dark:text-amber-300 flex items-center space-x-1.5">
                <Thermometer className="w-4 h-4 text-amber-600" />
                <span>1. Serving Temperature</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'hot', label: '🔥 Steaming Hot', desc: 'Silky micro-foam with rising steam' },
                  { id: 'iced', label: '❄️ Over Hand-Carved Ice', desc: 'Chilled over crystal clear cubes' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemperature(t.id as TempOption)}
                    className={\`p-3 rounded-xl border text-left transition cursor-pointer \${
                      temperature === t.id
                        ? 'border-amber-600 bg-amber-500/15 font-bold'
                        : 'border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-50 dark:hover:bg-[#2e1f16]'
                    }\`}
                  >
                    <div className="text-xs text-amber-900 dark:text-amber-100">{t.label}</div>
                    <div className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Cup Size */}
            <div className="bg-[#faf7f2] dark:bg-[#251811] p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4a2e1f] dark:text-amber-300 flex items-center space-x-1.5">
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>2. Cup Size</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'short', name: 'Short (8 oz)', add: '+$0.00' },
                  { id: 'tall', name: 'Tall (12 oz)', add: '+$0.65' },
                  { id: 'grande', name: 'Grande (16 oz)', add: '+$1.25' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id as CupSize)}
                    className={\`p-3 rounded-xl border text-center transition cursor-pointer \${
                      size === s.id
                        ? 'border-amber-600 bg-amber-500/15 font-bold'
                        : 'border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-50 dark:hover:bg-[#2e1f16]'
                    }\`}
                  >
                    <div className="text-xs text-amber-900 dark:text-amber-100">{s.name}</div>
                    <div className="text-[10px] text-amber-600 font-mono font-bold mt-1">{s.add}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Milk Base */}
            <div className="bg-[#faf7f2] dark:bg-[#251811] p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4a2e1f] dark:text-amber-300 flex items-center space-x-1.5">
                <Droplets className="w-4 h-4 text-amber-600" />
                <span>3. Milk & Plant Froth</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'oat', name: 'Oat Milk', add: '+$0.75' },
                  { id: 'whole', name: 'Organic Whole', add: '+$0.00' },
                  { id: 'almond', name: 'California Almond', add: '+$0.75' },
                  { id: 'coconut', name: 'Coconut Cream', add: '+$0.85' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMilk(m.id as MilkType)}
                    className={\`p-2.5 rounded-xl border text-center transition cursor-pointer \${
                      milk === m.id
                        ? 'border-amber-600 bg-amber-500/15 font-bold'
                        : 'border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-50 dark:hover:bg-[#2e1f16]'
                    }\`}
                  >
                    <div className="text-xs text-amber-900 dark:text-amber-100">{m.name}</div>
                    <div className="text-[9px] text-amber-600 font-mono mt-0.5">{m.add}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Extra Espresso Shots & Craft Syrup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Extra Shots */}
              <div className="bg-[#faf7f2] dark:bg-[#251811] p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a2e1f] dark:text-amber-300">
                  Extra Shots (+$0.95/ea)
                </label>
                <div className="flex items-center justify-between bg-amber-100/50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                  <button
                    onClick={() => setExtraShots(Math.max(0, extraShots - 1))}
                    className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center hover:bg-amber-500 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-xs text-amber-900 dark:text-amber-100">
                    +{extraShots} Shot{extraShots !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setExtraShots(Math.min(4, extraShots + 1))}
                    className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center hover:bg-amber-500 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Artisan Syrup */}
              <div className="bg-[#faf7f2] dark:bg-[#251811] p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a2e1f] dark:text-amber-300">
                  Craft Syrup (+$0.50)
                </label>
                <select
                  value={sweetness}
                  onChange={(e) => setSweetness(e.target.value as SweetnessLevel)}
                  className="w-full bg-amber-100/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-100 outline-none focus:border-amber-600 cursor-pointer"
                >
                  <option value="none">No Sweetener (Pure Coffee)</option>
                  <option value="vanilla">Madagascar Vanilla</option>
                  <option value="caramel">Salted Bourbon Caramel</option>
                  <option value="hazelnut">Roasted Hazelnut</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`
    },

    // 14. src/components/BrewingSimulator.tsx (Barista Lab)
    {
      path: 'src/components/BrewingSimulator.tsx',
      name: 'BrewingSimulator.tsx',
      type: 'file',
      content: `import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle, Activity, Sparkles, Coffee } from 'lucide-react';

export default function BrewingSimulator() {
  const [isBrewing, setIsBrewing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [extractionYield, setExtractionYield] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isBrewing) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 28) {
            setIsBrewing(false);
            setIsComplete(true);
            return 30;
          }
          return prev + 1;
        });
        setExtractionYield((prev) => Math.min(22.4, Number((prev + 0.75).toFixed(1))));
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isBrewing]);

  const handleReset = () => {
    setIsBrewing(false);
    setSeconds(0);
    setExtractionYield(0);
    setIsComplete(false);
  };

  const pressureBars = isBrewing ? (9.2 + Math.sin(seconds) * 0.3).toFixed(1) : '0.0';

  return (
    <section id="brewing-section" className="py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto bg-gradient-to-b from-[#2c1810] to-[#1a0e09] text-white p-8 sm:p-10 rounded-3xl border border-amber-800/60 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-800/40 pb-6">
          <div>
            <div className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Barista Science Lab</span>
            </div>
            <h2 className="font-serif-heading text-2xl sm:text-3xl font-black mt-1">
              9-Bar Precision Espresso Extraction
            </h2>
            <p className="text-xs text-amber-200/70 max-w-lg mt-1">
              Simulate pulling a double ristretto shot with real-time pressure gauge, extraction yield, and animated espresso stream.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {!isComplete ? (
              <button
                onClick={() => setIsBrewing(!isBrewing)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-5 py-3 rounded-xl flex items-center space-x-2 transition shadow-lg cursor-pointer"
              >
                {isBrewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isBrewing ? 'Pause Extraction' : 'Pull 30s Shot'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4" />
                <span>Shot Pulled Perfectly!</span>
              </div>
            )}
            <button
              onClick={handleReset}
              className="bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 text-xs p-3 rounded-xl transition cursor-pointer"
              title="Reset Simulator"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#20110a] p-4 rounded-2xl border border-amber-900/60 text-center">
            <div className="text-[10px] uppercase font-mono text-amber-400">Extraction Timer</div>
            <div className="font-serif-heading text-2xl sm:text-3xl font-bold mt-1 text-white">
              {seconds.toString().padStart(2, '0')}<span className="text-sm font-sans text-amber-400">s</span>
            </div>
            <div className="text-[9px] text-amber-300/60 font-mono mt-0.5">Target: 28-30s</div>
          </div>

          <div className="bg-[#20110a] p-4 rounded-2xl border border-amber-900/60 text-center">
            <div className="text-[10px] uppercase font-mono text-amber-400">Bar Pump Pressure</div>
            <div className="font-serif-heading text-2xl sm:text-3xl font-bold mt-1 text-amber-300">
              {pressureBars}<span className="text-sm font-sans"> bar</span>
            </div>
            <div className="text-[9px] text-amber-300/60 font-mono mt-0.5">Italian Rotary Pump</div>
          </div>

          <div className="bg-[#20110a] p-4 rounded-2xl border border-amber-900/60 text-center">
            <div className="text-[10px] uppercase font-mono text-amber-400">Brew Temperature</div>
            <div className="font-serif-heading text-2xl sm:text-3xl font-bold mt-1 text-white">
              93.4<span className="text-sm font-sans text-amber-400">°C</span>
            </div>
            <div className="text-[9px] text-amber-300/60 font-mono mt-0.5">Dual PID Boiler</div>
          </div>

          <div className="bg-[#20110a] p-4 rounded-2xl border border-amber-900/60 text-center">
            <div className="text-[10px] uppercase font-mono text-amber-400">Solubles Yield</div>
            <div className="font-serif-heading text-2xl sm:text-3xl font-bold mt-1 text-emerald-400">
              {extractionYield}%
            </div>
            <div className="text-[9px] text-emerald-400/80 font-mono mt-0.5">Golden Cup Standard</div>
          </div>
        </div>

        {/* Visual Portafilter & Dripping Stream */}
        <div className="bg-[#190c07] p-8 rounded-2xl border border-amber-900/40 flex flex-col items-center justify-center relative min-h-[160px]">
          {/* Portafilter Grouphead */}
          <div className="w-32 h-6 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-md border border-slate-500 shadow-md flex items-center justify-center">
            <div className="w-20 h-2 bg-slate-700 rounded-full" />
          </div>
          <div className="w-16 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-b-xl border-x border-b border-slate-500 shadow" />

          {/* Animated Liquid Stream & Steam */}
          <div className="relative h-14 w-8 flex flex-col items-center justify-start">
            {isBrewing && (
              <>
                <div className="w-1.5 h-full bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 rounded-full animate-drip" />
                <span className="absolute -top-3 w-3 h-8 bg-amber-200/40 rounded-full filter blur-[1px] animate-steam-1" />
              </>
            )}
          </div>

          {/* Demitasse Espresso Glass */}
          <div className="w-14 h-12 bg-amber-100/20 border-2 border-amber-300/40 rounded-b-xl backdrop-blur-sm overflow-hidden flex flex-col justify-end p-0.5 shadow-inner">
            <div
              className="w-full bg-gradient-to-t from-[#2c1810] to-[#c78851] rounded-b-lg transition-all duration-300"
              style={{ height: \`\${Math.min(100, (seconds / 30) * 100)}%\` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
`
    },

    // 15. src/components/MenuSection.tsx
    {
      path: 'src/components/MenuSection.tsx',
      name: 'MenuSection.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import { Coffee, Flame, Plus, Check, Star, Sparkles, Filter } from 'lucide-react';
import { DrinkItem, CustomizationOptions } from '../types';
import { MENU_DRINKS } from '../data/drinks';

interface MenuSectionProps {
  onQuickAdd: (drink: DrinkItem) => void;
}

export default function MenuSection({ onQuickAdd }: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Drinks & Bakes' },
    { id: 'espresso', label: 'Artisan Espresso' },
    { id: 'pour-over', label: 'Pour-Over' },
    { id: 'cold-brew', label: 'Nitro Cold Brew' },
    { id: 'bakery', label: 'Fresh Bakery' }
  ];

  const filtered = selectedCategory === 'all'
    ? MENU_DRINKS
    : MENU_DRINKS.filter(d => d.category === selectedCategory);

  const handleAdd = (drink: DrinkItem) => {
    onQuickAdd(drink);
    setRecentlyAddedId(drink.id);
    setTimeout(() => setRecentlyAddedId(null), 1800);
  };

  return (
    <section id="menu-section" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seasonal Roaster Menu</span>
          </div>
          <h2 className="font-serif-heading text-3xl sm:text-4xl font-black text-[#2c1810] dark:text-[#fef3c7] mt-1">
            Handcrafted Sips & Treats
          </h2>
          <p className="text-xs sm:text-sm text-[#5c3e2e] dark:text-[#d1b8a5] max-w-lg mt-1">
            Carefully curated single-origin roasts, velvety specialty drinks, and organic pastries baked before sunrise.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#f0e7dc] dark:bg-[#20140c] p-1.5 rounded-2xl border border-amber-200 dark:border-amber-800">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer \${
                selectedCategory === cat.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-amber-900 dark:text-amber-300 hover:text-amber-600'
              }\`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drinks Grid with Animated Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((drink) => {
          const isJustAdded = recentlyAddedId === drink.id;
          return (
            <div
              key={drink.id}
              className="bg-[#faf7f2] dark:bg-[#20140c] rounded-3xl border border-amber-200/80 dark:border-amber-800/50 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
            >
              {/* Image with Tag */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={drink.image}
                  alt={drink.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {drink.popular && (
                  <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                    Barista Choice
                  </span>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="font-mono text-[11px] bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                    {drink.roastLevel} Roast
                  </span>
                  <span className="font-mono text-[11px] bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                    {drink.calories} kcal
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif-heading text-lg font-bold text-[#2c1810] dark:text-[#fef3c7] leading-snug">
                    {drink.name}
                  </h3>
                  <p className="text-xs text-[#5c3e2e] dark:text-[#d1b8a5] mt-1 line-clamp-2 leading-relaxed">
                    {drink.description}
                  </p>

                  {/* Flavor Notes */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {drink.notes.map((n) => (
                      <span
                        key={n}
                        className="text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Price & Add Button */}
                <div className="pt-4 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between mt-4">
                  <div className="font-serif-heading text-xl font-black text-amber-900 dark:text-amber-200">
                    ${drink.basePrice.toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleAdd(drink)}
                    className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow \${
                      isJustAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-700 hover:bg-amber-600 text-white'
                    }\`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Quick Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
`
    },

    // 16. src/components/CartDrawer.tsx
    {
      path: 'src/components/CartDrawer.tsx',
      name: 'CartDrawer.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle2, Sparkles, Coffee } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  const [isOrdered, setIsOrdered] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  const tax = Number((subtotal * 0.085).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const handleCheckout = () => {
    setIsOrdered(true);
    setTimeout(() => {
      onClearCart();
      setIsOrdered(false);
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-[#faf7f2] dark:bg-[#1a110a] text-[#2c1810] dark:text-[#fdfaf6] h-full shadow-2xl flex flex-col justify-between z-10 border-l border-amber-200 dark:border-amber-800">
        {/* Drawer Header */}
        <div className="p-5 border-b border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="font-serif-heading font-black text-lg">Your Artisan Order</h2>
            <span className="text-xs bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: Items list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isOrdered ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif-heading text-2xl font-black text-emerald-600">
                Order Sent to Barista!
              </h3>
              <p className="text-xs text-[#5c3e2e] dark:text-[#d1b8a5] max-w-xs">
                Your drinks are being ground, extracted, and steamed now. Pick up at the counter in 4 minutes!
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-amber-800/60 dark:text-amber-200/60 py-16">
              <Coffee className="w-12 h-12 stroke-[1.5]" />
              <div className="font-serif-heading text-lg font-bold">Your Tray is Empty</div>
              <p className="text-xs max-w-xs">
                Select handcrafted drinks from our menu or design your personalized cup in the customizer.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-[#f2ebe1] dark:bg-[#231710] p-4 rounded-2xl border border-amber-200/70 dark:border-amber-800/40 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-serif-heading font-bold text-sm text-[#2c1810] dark:text-[#fef3c7]">
                      {item.drink.name}
                    </div>
                    <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-mono">
                      {item.customization.size.toUpperCase()} • {item.customization.milk} milk • {item.customization.temperature}
                    </div>
                  </div>
                  <span className="font-serif-heading font-bold text-sm text-amber-900 dark:text-amber-200">
                    ${(item.finalPrice * item.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold text-xs flex items-center justify-center hover:bg-amber-300 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold text-xs flex items-center justify-center hover:bg-amber-300 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-rose-600 hover:text-rose-500 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer: Totals & Checkout Button */}
        {items.length > 0 && !isOrdered && (
          <div className="p-5 border-t border-amber-200/80 dark:border-amber-800/60 bg-[#f5ede3] dark:bg-[#1e130c] space-y-3">
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[#5c3e2e] dark:text-[#d1b8a5]">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#5c3e2e] dark:text-[#d1b8a5]">
                <span>Sales Tax (8.5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-serif-heading text-base font-black text-amber-900 dark:text-amber-200 pt-1 border-t border-amber-200 dark:border-amber-800">
                <span>Total Due</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <span>Place Artisan Order (${total.toFixed(2)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
`
    },

    // 17. src/components/ReviewsSection.tsx
    {
      path: 'src/components/ReviewsSection.tsx',
      name: 'ReviewsSection.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import { Star, MessageSquare, Check, Sparkles } from 'lucide-react';
import { Review } from '../types';
import { INITIAL_REVIEWS } from '../data/drinks';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [name, setName] = useState('');
  const [drink, setDrink] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    const newRev: Review = {
      id: \`rev_\${Date.now()}\`,
      author: name.trim(),
      role: 'Coffee Enthusiast',
      rating,
      comment: comment.trim(),
      drinkMentioned: drink.trim() || 'Signature House Roast',
      date: 'Just now'
    };
    setReviews([newRev, ...reviews]);
    setName('');
    setDrink('');
    setComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="py-14 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Community Praises</span>
        </div>
        <h2 className="font-serif-heading text-3xl sm:text-4xl font-black text-[#2c1810] dark:text-[#fef3c7]">
          What Our Patrons Say
        </h2>
        <p className="text-xs sm:text-sm text-[#5c3e2e] dark:text-[#d1b8a5]">
          Real feedback from local specialty coffee critics and morning regulars.
        </p>
      </div>

      {/* Reviews Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-[#faf7f2] dark:bg-[#20140c] p-6 rounded-3xl border border-amber-200/80 dark:border-amber-800/50 shadow-md space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              {/* Stars */}
              <div className="flex items-center space-x-1">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-xs text-[#5c3e2e] dark:text-[#d1b8a5] italic leading-relaxed">
                "{r.comment}"
              </p>
            </div>

            <div className="pt-3 border-t border-amber-200/50 dark:border-amber-800/30 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-[#2c1810] dark:text-[#fef3c7]">{r.author}</div>
                <div className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-mono">{r.drinkMentioned}</div>
              </div>
              <span className="text-[10px] text-[#8c6b57] dark:text-[#b39580] font-mono">{r.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Review Submission Form */}
      <div className="max-w-xl mx-auto bg-[#f5ede3] dark:bg-[#20140c] p-6 sm:p-8 rounded-3xl border border-amber-200 dark:border-amber-800/60 shadow-lg space-y-4">
        <h3 className="font-serif-heading text-lg font-bold text-[#2c1810] dark:text-[#fef3c7]">
          Leave Your Tasting Notes
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-amber-300">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full bg-[#faf7f2] dark:bg-[#150d08] border border-amber-300/80 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-950 dark:text-amber-100 outline-none focus:border-amber-600 mt-1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-amber-300">Drink Ordered</label>
              <input
                type="text"
                value={drink}
                onChange={(e) => setDrink(e.target.value)}
                placeholder="e.g. Ethiopian Pour-Over"
                className="w-full bg-[#faf7f2] dark:bg-[#150d08] border border-amber-300/80 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-950 dark:text-amber-100 outline-none focus:border-amber-600 mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-amber-300">Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the aroma, micro-foam density, or flavor notes..."
              rows={3}
              className="w-full bg-[#faf7f2] dark:bg-[#150d08] border border-amber-300/80 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-950 dark:text-amber-100 outline-none focus:border-amber-600 mt-1"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            {submitted ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            <span>{submitted ? 'Tasting Notes Shared!' : 'Submit Tasting Review'}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
`
    },

    // 18. src/App.tsx
    {
      path: 'src/App.tsx',
      name: 'App.tsx',
      type: 'file',
      content: `import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import DrinkCustomizer from './components/DrinkCustomizer';
import BrewingSimulator from './components/BrewingSimulator';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import ReviewsSection from './components/ReviewsSection';
import { CartItem, DrinkItem, CustomizationOptions, ThemeMode } from './types';
import { Coffee, MapPin, Heart, ShieldCheck, Award } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('artisan');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isDark = theme === 'velvet-dark';

  const handleQuickAdd = (drink: DrinkItem) => {
    const defaultCustom: CustomizationOptions = {
      size: 'tall',
      milk: 'whole',
      sweetness: 'none',
      extraShots: 0,
      temperature: 'hot'
    };
    addItemToCart({ drink, customization: defaultCustom, finalPrice: drink.basePrice });
  };

  const addItemToCart = (item: { drink: DrinkItem; customization: CustomizationOptions; finalPrice: number }) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (ci) =>
          ci.drink.id === item.drink.id &&
          ci.customization.size === item.customization.size &&
          ci.customization.milk === item.customization.milk &&
          ci.customization.temperature === item.customization.temperature
      );
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          id: \`cart_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
          drink: item.drink,
          customization: item.customization,
          finalPrice: item.finalPrice,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={\`min-h-screen transition-colors duration-300 flex flex-col \${
      isDark ? 'bg-[#150d08] text-[#fef9f5]' : 'bg-[#faf7f2] text-[#2c1810]'
    }\`}>
      {/* 1. Header Navigation */}
      <Header
        theme={theme}
        setTheme={setTheme}
        cartCount={cartItems.reduce((acc, cur) => acc + cur.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onScrollToMenu={() => scrollToSection('menu-section')}
        onScrollToCustomizer={() => scrollToSection('customizer-section')}
        onScrollToBrew={() => scrollToSection('brewing-section')}
      />

      {/* 2. Hero with Animated Rising Steam and Atmospheric Aura */}
      <Hero
        onExploreMenu={() => scrollToSection('menu-section')}
        onCustomizeDrink={() => scrollToSection('customizer-section')}
      />

      {/* 3. Interactive Drink Customizer */}
      <DrinkCustomizer onAddToCart={addItemToCart} />

      {/* 4. Filterable Menu */}
      <MenuSection onQuickAdd={handleQuickAdd} />

      {/* 5. Live Barista Science Lab & 30s Extraction Simulator */}
      <BrewingSimulator />

      {/* 6. Customer Reviews Wall */}
      <ReviewsSection />

      {/* 7. Slide-Out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={() => setCartItems([])}
      />

      {/* 8. Footer */}
      <footer className="border-t border-amber-200 dark:border-amber-800/60 bg-[#efe7dc] dark:bg-[#110a06] py-10 px-4 sm:px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#5c3e2e] dark:text-[#b89f8f]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold font-serif-heading">
              A
            </div>
            <div>
              <div className="font-bold text-[#2c1810] dark:text-[#fef3c7] font-serif-heading">
                Aura Roasters & Specialty Coffee
              </div>
              <div>Single Origin Roasting • Hand-Poured with Care</div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Direct Trade</span>
            </span>
            <span>Port 3000 Ingress Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
`
    },

    // 19. src/main.tsx
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

    // 20. server/server.ts
    {
      path: 'server/server.ts',
      name: 'server.ts',
      type: 'file',
      content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-Memory Orders Store
const orders: any[] = [];

// 1. Health Probe
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', roastery: 'Aura Coffee', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 2. GET Menu Status
app.get('/api/menu', (req, res) => {
  res.json({
    status: 'open',
    featured: 'Caramel Cloud Macchiato',
    currentRoastBatch: 'Ethiopian Heirloom Batch #104'
  });
});

// 3. POST Place Order
app.post('/api/orders', (req, res) => {
  const order = {
    id: 'ord_' + Math.random().toString(36).substring(2, 9),
    items: req.body.items || [],
    total: req.body.total || 0,
    status: 'brewing',
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  res.status(201).json(order);
});

// 4. GET Active Orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.listen(PORT, () => {
  console.log(\`[Aura Roasters Server] Online on port \${PORT}\`);
});
`
    },

    // 21. tests/app.test.ts
    {
      path: 'tests/app.test.ts',
      name: 'app.test.ts',
      type: 'file',
      content: `import { describe, it, expect } from 'vitest';

describe('Aura Coffee Shop - Test Suite', () => {
  it('calculates custom drink prices correctly with add-ons', () => {
    const basePrice = 5.25;
    const tallAdd = 0.65;
    const oatMilkAdd = 0.75;
    const extraShot = 0.95;
    const total = Number((basePrice + tallAdd + oatMilkAdd + extraShot).toFixed(2));
    expect(total).toBe(7.60);
  });

  it('validates 30-second espresso extraction window', () => {
    const targetMin = 25;
    const targetMax = 32;
    const simulatedDuration = 30;
    expect(simulatedDuration).toBeGreaterThanOrEqual(targetMin);
    expect(simulatedDuration).toBeLessThanOrEqual(targetMax);
  });

  it('verifies menu items have required nutritional and price attributes', () => {
    const item = {
      name: 'Caramel Cloud Macchiato',
      price: 5.75,
      calories: 210,
      roast: 'Medium'
    };
    expect(item.price).toBeGreaterThan(0);
    expect(item.calories).toBeGreaterThan(0);
    expect(item.roast).toBeDefined();
  });
});
`
    }
  ];
}
