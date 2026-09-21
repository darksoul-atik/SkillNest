'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useGroups } from '../../hooks/use-groups';
import { Navbar } from '../../components/navbar';
import { GroupCard } from '../../components/group-card';
import { CreateGroupModal } from '../../components/create-group-modal';
import { Button } from '../../components/ui/button';
import { PlusCircle, LayoutDashboard, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'hosted' | 'joined'>('all');

  const { data: groupsData, isLoading: groupsLoading } = useGroups();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 w-full animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 text-center space-y-4">
          <LayoutDashboard className="w-12 h-12 text-indigo-500 mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="text-sm text-slate-500">
            Please sign in to access your personal dashboard and manage groups.
          </p>
          <Link href="/">
            <Button size="sm">Explore Public Groups</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allUserGroups = groupsData?.data?.filter((g) => g.isMember || g.isHost) || [];
  const hostedGroups = allUserGroups.filter((g) => g.isHost);
  const joinedGroups = allUserGroups.filter((g) => g.isMember && !g.isHost);

  const displayedGroups =
    tab === 'hosted' ? hostedGroups : tab === 'joined' ? joinedGroups : allUserGroups;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar onOpenCreateGroup={() => setCreateModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* User Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/20">
              {user?.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">{user?.name}</h1>
              <p className="text-xs text-indigo-200 mt-0.5">{user?.email}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-indigo-300">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {hostedGroups.length} Hosted
                </span>
                <span className="flex items-center">
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  {joinedGroups.length} Joined
                </span>
              </div>
            </div>
          </div>

          <Button
            size="md"
            onClick={() => setCreateModalOpen(true)}
            className="bg-white text-indigo-900 hover:bg-indigo-50 shadow-none border-0"
          >
            <PlusCircle className="w-4 h-4 mr-2 text-indigo-600" />
            Host New Group
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-xs font-semibold">
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                tab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All My Groups ({allUserGroups.length})
            </button>
            <button
              onClick={() => setTab('hosted')}
              className={`px-4 py-2 rounded-lg transition-all ${
                tab === 'hosted'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hosting ({hostedGroups.length})
            </button>
            <button
              onClick={() => setTab('joined')}
              className={`px-4 py-2 rounded-lg transition-all ${
                tab === 'joined'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Joined ({joinedGroups.length})
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        {groupsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : displayedGroups.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900/40">
            <p className="text-sm text-slate-500">
              {tab === 'hosted'
                ? "You haven't hosted any skill groups yet."
                : tab === 'joined'
                ? "You haven't joined any groups yet."
                : 'No active group memberships.'}
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Discover Groups to Join
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedGroups.map((group) => (
              <GroupCard key={group.id} group={group} isAuthenticated={true} />
            ))}
          </div>
        )}
      </main>

      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
