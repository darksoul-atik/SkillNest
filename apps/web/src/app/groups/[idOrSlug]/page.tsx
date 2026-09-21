'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroup, useJoinGroup, useLeaveGroup, useDeleteGroup } from '../../../hooks/use-groups';
import { useAuth } from '../../../hooks/use-auth';
import { Navbar } from '../../../components/navbar';
import { CommentSection } from '../../../components/comment-section';
import { AuthModal } from '../../../components/auth-modal';
import { Button } from '../../../components/ui/button';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.idOrSlug as string;

  const { user, isAuthenticated } = useAuth();
  const { data: group, isLoading, error } = useGroup(idOrSlug);
  const deleteGroupMutation = useDeleteGroup();

  const joinMutation = useJoinGroup(group?.id || '');
  const leaveMutation = useLeaveGroup(group?.id || '');

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleJoinLeave = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (group?.isMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    if (confirm('Are you sure you want to cancel this group? This action cannot be undone.')) {
      await deleteGroupMutation.mutateAsync(group.id);
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 w-full space-y-6 animate-pulse">
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Group Not Found
          </h2>
          <p className="text-sm text-slate-500">
            This group session may have been cancelled or the URL has changed.
          </p>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Return to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = group.memberCount >= group.maxMembers;
  const isHost = isAuthenticated && (user?.id === group.hostId || group.isHost);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full flex-1 space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to All Groups
        </Link>

        {/* Hero Cover Banner */}
        {group.coverUrl && (
          <div className="h-64 sm:h-80 w-full rounded-3xl overflow-hidden shadow-lg relative bg-slate-100 dark:bg-slate-900">
            <img
              src={`http://localhost:3000${group.coverUrl}`}
              alt={group.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-md">
                {group.category}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:scale-105 transition"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Group Header Info & Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              {!group.coverUrl && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
                  {group.category}
                </span>
              )}
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {group.name}
              </h1>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>Created by</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {group.host.name}
                </span>
                {isHost && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    You are Host
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 self-start">
              {isHost ? (
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleDelete}
                  isLoading={deleteGroupMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Cancel Group
                </Button>
              ) : group.isMember ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleJoinLeave}
                  isLoading={leaveMutation.isPending}
                  className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-rose-50 hover:text-rose-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Joined (Click to Leave)
                </Button>
              ) : (
                <Button
                  size="md"
                  onClick={handleJoinLeave}
                  isLoading={joinMutation.isPending}
                  disabled={isFull}
                >
                  {isFull ? 'Session Full' : 'Join Community'}
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[11px] font-medium text-slate-400">Date & Time</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(group.startDate).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[11px] font-medium text-slate-400">Location</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                  {group.location}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <Users className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[11px] font-medium text-slate-400">Capacity</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {group.memberCount} of {group.maxMembers} attending
                </p>
              </div>
            </div>
          </div>

          {/* Overview text */}
          <div className="pt-2">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Session Details
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {group.description}
            </p>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
          <CommentSection
            groupId={group.id}
            isHost={!!isHost}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        </div>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
