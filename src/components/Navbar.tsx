import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Terminal,
  CreditCard,
  LayoutDashboard,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  User,
  LogOut,
  LogIn,
  ShieldCheck,
  Cpu,
  Layers,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface NavbarProps {
  creditsRemaining: number;
  creditsTotal: number;
  planName: string;
}

export default function Navbar({ creditsRemaining, creditsTotal, planName }: NavbarProps) {
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/', label: 'Builder', icon: Sparkles },
    { path: '/features', label: 'Features', icon: Cpu },
    { path: '/templates', label: 'Templates', icon: Layers },
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { path: '/docs', label: 'Docs', icon: BookOpen },
    { path: '/pricing', label: 'Pricing', icon: CreditCard },
    { path: '/projects', label: 'Projects', icon: LayoutDashboard },
    { path: '/admin', label: 'SRE Admin', icon: ShieldAlert },
  ];

  const actualCredits = profile ? profile.creditsRemaining : creditsRemaining;
  const actualTotal = profile ? profile.creditsTotal : creditsTotal;
  const actualPlan = profile ? profile.planName : planName;
  const creditPercentage = Math.round((actualCredits / actualTotal) * 100);

  return (
    <>
      <nav className="border-b border-[#222222] bg-[#050505]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3" id="main-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" id="nav-logo">
            <div className="border border-[#222222] bg-[#111111] p-2 text-violet-400 group-hover:scale-105 transition-transform duration-300">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="massive-type text-2xl tracking-normal text-white">
                DevForge<span className="text-violet-500">.</span>AI
              </span>
              <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                Autonomous Swarm VM
              </span>
            </div>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center space-x-1" id="nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 border transition duration-200 text-xs font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-white/5 border-[#222222] text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/3'
                  }`}
                  id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Balance Capsule & Firebase Auth */}
          <div className="flex items-center space-x-4" id="nav-balance">
            <div className="hidden lg:flex flex-col text-right">
              <span className="label text-[9px] text-slate-500">Credits Remaining</span>
              <span className="text-xs font-mono font-bold text-violet-400">
                {actualCredits.toLocaleString()} / {actualTotal.toLocaleString()}
              </span>
            </div>

            <div className="relative w-12 h-1 bg-[#222222] overflow-hidden hidden lg:block">
              <div
                className={`h-full bg-violet-500 transition-all duration-500`}
                style={{ width: `${creditPercentage}%` }}
              ></div>
            </div>

            <div className="bg-[#111111] border border-[#222222] px-3 py-1.5 flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                {actualPlan}
              </span>
            </div>

            {/* Auth Button or User Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-[#141414] border border-[#262626] hover:border-violet-500/50 p-1.5 transition"
                  id="user-profile-btn"
                >
                  <img
                    src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                    alt="User"
                    className="w-6 h-6 object-cover border border-[#222222]"
                  />
                  <span className="text-xs font-mono text-slate-200 hidden sm:inline-block max-w-[100px] truncate">
                    {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#111111] border border-[#262626] shadow-2xl p-2 z-50 font-mono text-xs">
                    <div className="p-2 border-b border-[#222222] mb-1">
                      <div className="font-bold text-white truncate">{profile?.displayName || user.displayName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                      <div className="text-[9px] text-emerald-400 flex items-center gap-1 mt-1 font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Firestore Synced</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left flex items-center space-x-2 p-2 hover:bg-rose-950/40 text-rose-400 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition shadow"
                id="btn-login-signup"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

