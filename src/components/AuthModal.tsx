import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Lock, Mail, User, Sparkles, Shield, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      const code = err.code;
      if (code === 'auth/popup-blocked') {
        setError('Google login popup was blocked by your browser. Please allow popups or use Email & Password.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing authentication.');
      } else if (code === 'auth/unauthorized-domain') {
        setError('This domain is not in Firebase Console > Auth > Authorized Domains. Use Email & Password or add the domain in Firebase.');
      } else {
        setError(err.message?.replace('Firebase: ', '') || 'Google authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0e0e0e] border border-[#222222] p-8 shadow-2xl relative"
        id="auth-modal"
      >
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-[#161616] border border-[#262626] text-violet-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              {isSignUp ? 'Create DevForge Account' : 'Authenticate Session'}
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Firebase Firestore Database & Authentication
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Full Name / Handle
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aria Architect"
                  className="w-full bg-[#141414] border border-[#262626] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 outline-none font-mono"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@domain.com"
                className="w-full bg-[#141414] border border-[#262626] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141414] border border-[#262626] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-wider text-xs py-2.5 transition duration-200 flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Workspace' : 'Sign In'}</span>
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#222222]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-[#0e0e0e] px-2 text-slate-500">Or Continue With</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-[#151515] hover:bg-[#1f1f1f] border border-[#282828] text-slate-200 text-xs font-bold uppercase tracking-wider py-2.5 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs font-mono text-slate-400">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account yet?"}</span>{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-violet-400 hover:text-violet-300 font-bold uppercase underline ml-1"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 text-xs font-mono p-1"
        >
          ✕
        </button>
      </motion.div>
    </div>
  );
}
