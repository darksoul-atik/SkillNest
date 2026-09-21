import { useMutation } from '@tanstack/react-query';
import { MediaResponse, MediaPurpose } from '@skillnest/shared';
import { apiClient } from '../lib/axios';

export function useUploadMedia() {
  return useMutation({
    mutationFn: async ({
      file,
      purpose = MediaPurpose.GROUP_COVER,
    }: {
      file: File;
      purpose?: MediaPurpose;
    }): Promise<MediaResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);

      const res = await apiClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.data;
    },
  });
}
