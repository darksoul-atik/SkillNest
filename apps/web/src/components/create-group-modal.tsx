'use client';

import React, { useState } from 'react';
import { Modal } from './ui/modal';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useCreateGroup } from '../hooks/use-groups';
import { useUploadMedia } from '../hooks/use-media';
import { GROUP_CATEGORIES, GroupCategory, MediaPurpose } from '@skillnest/shared';
import { Upload, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const router = useRouter();
  const createGroupMutation = useCreateGroup();
  const uploadMediaMutation = useUploadMedia();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>(GroupCategory.TECH_CODING);
  const [location, setLocation] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      let coverMediaId: string | null = null;
      if (coverFile) {
        const uploaded = await uploadMediaMutation.mutateAsync({
          file: coverFile,
          purpose: MediaPurpose.GROUP_COVER,
        });
        coverMediaId = uploaded.id;
      }

      const isoDate = new Date(startDate).toISOString();
      const newGroup = await createGroupMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        maxMembers: Number(maxMembers),
        startDate: isoDate,
        coverMediaId,
      });

      onClose();
      router.push(`/groups/${newGroup.slug}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create group';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Host a New Skill Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Input
          label="Group Title"
          type="text"
          placeholder="e.g. San Francisco Rust & Systems Meetup"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GroupCategory)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {GROUP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Detailed Overview
          </label>
          <textarea
            rows={3}
            placeholder="Describe session goals, skill prerequisites, and schedule..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Location"
            type="text"
            placeholder="Venue or Address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <Input
            label="Max Attendees"
            type="number"
            min={2}
            max={1000}
            value={maxMembers}
            onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
            required
          />
        </div>

        <Input
          label="Event Date & Time"
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Cover Banner Image (Optional)
          </label>
          <div className="flex items-center space-x-3">
            <label className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 cursor-pointer bg-slate-50 dark:bg-slate-900/50 transition">
              <Upload className="w-4 h-4 mr-2 text-indigo-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                {coverFile ? coverFile.name : 'Upload JPEG, PNG, or WebP'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={createGroupMutation.isPending || uploadMediaMutation.isPending}
        >
          Publish Group
        </Button>
      </form>
    </Modal>
  );
}
