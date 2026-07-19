import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

// Hooks cho Shop by Room (FE-5, BE-7) — xem client.js mục ROOM/STYLE/ROOM SCENE.
export const useRoomBySlug = (slug) =>
  useQuery({ queryKey: ['room', slug], queryFn: () => api.getRoomBySlug(slug), enabled: !!slug, retry: false });

export const useRoomScenes = (slug) =>
  useQuery({ queryKey: ['roomScenes', slug], queryFn: () => api.getRoomScenes(slug), enabled: !!slug });

export const useRoomSceneDetail = (id) =>
  useQuery({ queryKey: ['roomScene', id], queryFn: () => api.getRoomSceneDetail(id), enabled: !!id, retry: false });
