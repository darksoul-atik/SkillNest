'use client';

import React, { useState } from 'react';
import { useComments, useCreateComment, useDeleteComment, useCreateReply, useDeleteReply } from '../hooks/use-comments';
import { useAuth } from '../hooks/use-auth';
import { Button } from './ui/button';
import { MessageSquare, CornerDownRight, Trash2, Send, ShieldCheck, User } from 'lucide-react';
import { CommentResponse, ReplyResponse } from '@skillnest/shared';

interface CommentSectionProps {
  groupId: string;
  isHost: boolean;
  onRequireAuth: () => void;
}

export function CommentSection({ groupId, isHost, onRequireAuth }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { data: commentsData, isLoading } = useComments(groupId);
  const createCommentMutation = useCreateComment(groupId);

  const [commentBody, setCommentBody] = useState('');

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!commentBody.trim()) return;

    await createCommentMutation.mutateAsync({ body: commentBody.trim() });
    setCommentBody('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-5 h-5 text-indigo-500" />
        <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
          Community Discussions & Inquiries
        </h3>
      </div>

      {/* New Comment Input */}
      <form onSubmit={handlePostComment} className="flex gap-2">
        <input
          type="text"
          placeholder={
            isAuthenticated
              ? 'Ask the host a question or start a discussion...'
              : 'Sign in to post questions or discussion topics'
          }
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          disabled={!isAuthenticated}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
        />
        <Button
          type="submit"
          size="md"
          isLoading={createCommentMutation.isPending}
          disabled={!commentBody.trim()}
        >
          <Send className="w-4 h-4 mr-1.5" />
          Ask
        </Button>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : commentsData?.data?.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
          No questions yet. Be the first to ask the host about workshop details!
        </div>
      ) : (
        <div className="space-y-4">
          {commentsData?.data?.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              groupId={groupId}
              isHost={isHost}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  groupId,
  isHost,
  currentUserId,
}: {
  comment: CommentResponse;
  groupId: string;
  isHost: boolean;
  currentUserId?: string;
}) {
  const deleteCommentMutation = useDeleteComment(groupId);
  const createReplyMutation = useCreateReply(groupId);
  const deleteReplyMutation = useDeleteReply(groupId);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await createReplyMutation.mutateAsync({
      commentId: comment.id,
      input: { body: replyText.trim() },
    });
    setReplyText('');
    setReplyOpen(false);
  };

  const isAuthor = currentUserId && comment.authorId === currentUserId;
  const canDelete = isAuthor || isHost;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
            {comment.author.name.charAt(0)}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              {comment.author.name}
            </span>
            <span className="ml-2 text-[10px] text-slate-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={() => deleteCommentMutation.mutate(comment.id)}
            disabled={deleteCommentMutation.isPending}
            className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
            title="Delete comment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 pl-9">
        {comment.body}
      </p>

      {/* Replies list */}
      {comment.repliesPreview && comment.repliesPreview.length > 0 && (
        <div className="pl-9 space-y-2.5 pt-2">
          {comment.repliesPreview.map((reply: ReplyResponse) => (
            <div
              key={reply.id}
              className="flex items-start justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-indigo-700 dark:text-indigo-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{reply.author.name} (Host)</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{reply.body}</p>
              </div>

              {(isHost || (currentUserId && reply.authorId === currentUserId)) && (
                <button
                  onClick={() => deleteReplyMutation.mutate({ replyId: reply.id, commentId: comment.id })}
                  className="text-slate-400 hover:text-rose-500 p-1 transition"
                  title="Delete reply"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Host Reply Toggle */}
      {isHost && (
        <div className="pl-9 pt-1">
          {!replyOpen ? (
            <button
              onClick={() => setReplyOpen(true)}
              className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <CornerDownRight className="w-3.5 h-3.5 mr-1" />
              Reply as Host
            </button>
          ) : (
            <form onSubmit={handleSendReply} className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Write an official host response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                autoFocus
              />
              <Button size="sm" type="submit" isLoading={createReplyMutation.isPending}>
                Reply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>
                Cancel
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
