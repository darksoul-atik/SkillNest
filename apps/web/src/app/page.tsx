'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useGroups } from '../hooks/use-groups';
import { GROUP_CATEGORIES, GroupCategory } from '@skillnest/shared';
import { Navbar } from '../components/navbar';
import { GroupCard } from '../components/group-card';
import { AuthModal } from '../components/auth-modal';
import { CreateGroupModal } from '../components/create-group-modal';
import { Sparkles, Search, PlusCircle, Compass, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory | undefined>();
  const [search, setSearch] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: groupsData, isLoading } = useGroups({
    category: selectedCategory,
    search: search || undefined,
  });

  const handleOpenCreateGroup = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar onOpenCreateGroup={handleOpenCreateGroup} />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 border border-indigo-200/50 dark:border-indigo-800/50">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Real-World Skill Communities</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-[1.15]">
            Master new passions with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              local experts
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Join small-cohort hands-on workshops in robotics, specialty cooking, landscape photography, game development, and more.
          </p>

          {/* Search bar & Quick CTA */}
          <div className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by topic, keyword, or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm"
              />
            </div>
            <Button size="lg" onClick={handleOpenCreateGroup} className="h-11">
              <PlusCircle className="w-4 h-4 mr-2" />
              Host a Group
            </Button>
          </div>

          {/* Quick Value Points */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
              Direct Host Discussions
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
              Strict Attendee Limits
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
              In-Person Skill Sharing
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === undefined
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
          >
            All Categories
          </button>
          {GROUP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {selectedCategory ? `${selectedCategory} Workshops` : 'Upcoming Community Sessions'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Showing {groupsData?.data?.length ?? 0} available groups
            </p>
          </div>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-850 animate-pulse" />
            ))}
          </div>
        ) : groupsData?.data?.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-4">
            <Compass className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-heading font-bold text-lg text-slate-800 dark:text-slate-200">
              No matching groups found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the pioneer! Start your own skill group in this category and bring local enthusiasts together.
            </p>
            <Button size="sm" onClick={handleOpenCreateGroup}>
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create Group Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupsData?.data?.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isAuthenticated={isAuthenticated}
                onRequireAuth={() => setAuthModalOpen(true)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 SkillNest Inc. Enterprise-grade pnpm monorepo platform.</p>
          <div className="flex items-center space-x-6">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-indigo-600 transition">
              Back to Top
            </button>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CreateGroupModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}
