'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, PlusCircle, LogOut, LogIn, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { Button } from './ui/button';
import { AuthModal } from './auth-modal';

interface NavbarProps {
  onOpenCreateGroup?: () => void;
}

export function Navbar({ onOpenCreateGroup }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              SkillNest
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Explore Groups
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {onOpenCreateGroup && (
                  <Button
                    size="sm"
                    onClick={onOpenCreateGroup}
                    className="hidden sm:inline-flex"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Host Group
                  </Button>
                )}

                <div className="flex items-center pl-2 space-x-3 border-l border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {user?.name}
                  </span>
                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={openLogin}>
                  Sign In
                </Button>
                <Button size="sm" onClick={openRegister}>
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
