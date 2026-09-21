'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useGroups, useJoinGroup, useLeaveGroup } from '../hooks/use-groups';
import { GroupCategory, GroupResponse } from '@skillnest/shared';
import {
  Compass,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LogOut,
  LogIn,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoggingIn, login, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory | undefined>();
  const [search, setSearch] = useState('');

  const { data: groupsData, isLoading } = useGroups({
    category: selectedCategory,
    search: search || undefined,
  });

  const handleDemoLogin = async () => {
    try {
      await login({
        email: 'sarah.host@skillnest.dev',
        password: 'Password123!',
      });
    } catch {
      alert('Could not log in demo user. Please make sure the backend is running.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              SkillNest
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user?.name}
                </span>
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleDemoLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Demo Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Redesigned Modern Experience</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            Discover and Join Real-World{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Hobby Communities
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            From embedded hardware hacking and coffee roasting to landscape photography. Connect with verified hosts and fellow enthusiasts.
          </p>

          <div className="mt-8 max-w-md mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Search by topic, keyword, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Groups Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Upcoming Skill Groups
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {groupsData?.meta?.total ?? 0} active sessions available
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupsData?.data?.map((group) => (
              <GroupCard key={group.id} group={group} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400">
          © 2026 SkillNest. Built as a high-performance pnpm monorepo with Next.js & NestJS.
        </div>
      </footer>
    </div>
  );
}

function GroupCard({
  group,
  isAuthenticated,
}: {
  group: GroupResponse;
  isAuthenticated: boolean;
}) {
  const joinMutation = useJoinGroup(group.id);
  const leaveMutation = useLeaveGroup(group.id);

  const handleToggle = () => {
    if (!isAuthenticated) {
      alert('Please sign in to join groups.');
      return;
    }
    if (group.isMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  const isFull = group.memberCount >= group.maxMembers;

  return (
    <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            {group.category}
          </span>
          <span className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 mr-1" />
            {group.memberCount} / {group.maxMembers}
          </span>
        </div>

        <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 transition line-clamp-1">
          {group.name}
        </h3>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {group.description}
        </p>

        <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <span>{group.location}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <span>{new Date(group.startDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Hosted by <span className="font-medium text-slate-700 dark:text-slate-300">{group.host.name}</span>
        </div>

        {group.isHost ? (
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Host
          </span>
        ) : group.isMember ? (
          <button
            onClick={handleToggle}
            disabled={leaveMutation.isPending}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Joined
          </button>
        ) : (
          <button
            onClick={handleToggle}
            disabled={joinMutation.isPending || isFull}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isFull ? 'Full' : 'Join Group'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
