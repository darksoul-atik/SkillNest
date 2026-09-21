'use client';

import React from 'react';
import Link from 'next/link';
import { GroupResponse } from '@skillnest/shared';
import { useJoinGroup, useLeaveGroup } from '../hooks/use-groups';
import { Users, Calendar, MapPin, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

interface GroupCardProps {
  group: GroupResponse;
  isAuthenticated: boolean;
  onRequireAuth?: () => void;
}

export function GroupCard({ group, isAuthenticated, onRequireAuth }: GroupCardProps) {
  const joinMutation = useJoinGroup(group.id);
  const leaveMutation = useLeaveGroup(group.id);

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    if (group.isMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  const isFull = group.memberCount >= group.maxMembers;
  const isActionLoading = joinMutation.isPending || leaveMutation.isPending;

  return (
    <div className="group rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 flex flex-col justify-between">
      {/* Cover / Header section */}
      <div>
        {group.coverThumbUrl ? (
          <div className="h-44 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
            <img
              src={`http://localhost:3000${group.coverThumbUrl}`}
              alt={group.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-sm">
                {group.category}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-5 pb-0 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {group.category}
            </span>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="flex items-center font-medium">
              <Users className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              {group.memberCount} / {group.maxMembers} Members
            </span>
            {isFull && !group.isMember && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                Full
              </span>
            )}
          </div>

          <Link href={`/groups/${group.slug}`}>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {group.name}
            </h3>
          </Link>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {group.description}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span className="truncate">{group.location}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span>
                {new Date(group.startDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 text-[10px] font-bold flex items-center justify-center">
            {group.host.name.charAt(0)}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[110px]">
            {group.host.name}
          </span>
        </div>

        {group.isHost ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Host
          </span>
        ) : group.isMember ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAction}
            isLoading={isActionLoading}
            className="text-xs h-8 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-rose-50 hover:text-rose-600"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Joined
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleAction}
            isLoading={isActionLoading}
            disabled={isFull}
            className="text-xs h-8"
          >
            {isFull ? 'At Capacity' : 'Join'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
