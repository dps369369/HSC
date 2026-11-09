import React, { useState } from 'react';
import type { ActiveTab } from '../types';
import { useAcademic } from '../context/AcademicContext';
import {
  LayoutDashboard,
  BookOpen,
  Target,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  LogOut,
  User,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isOwner, login, logout, authLoading } = useAcademic();
  const [signingIn, setSigningIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await login();
    } catch (err) {
      console.error(err);
    } finally {
      setSigningIn(false);
    }
  };

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'book' as ActiveTab, label: 'BOOK', icon: BookOpen },
    { id: 'potential' as ActiveTab, label: 'POTENTIAL MARK', icon: Target },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-lg tracking-tight shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  HSC
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Academic Tracker
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Syllabus Mastery, Board Importance & Potential Mark Management
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User / Access Control */}
          <div className="hidden md:flex items-center gap-3">
            {authLoading ? (
              <div className="w-24 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ) : isOwner ? (
              <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Owner Mode</span>
                </div>
                <div className="h-4 w-px bg-emerald-300 dark:bg-emerald-700" />
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 max-w-[120px] truncate" title={user?.email || ''}>
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Visitor (Read-Only)</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>Public Visitor</span>
                </span>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{signingIn ? 'Signing In...' : 'Owner Login'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-bold gap-1 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {isOwner ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Owner Mode ({user?.email})
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border rounded-md"
                >
                  Sign Out
                </button>
              </div>
            ) : user ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
                <span>Visitor (Read-Only)</span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border rounded-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Public Visitor (View Only)</span>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                >
                  Owner Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
