import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

// Hooks cho AI Chat (chatbot nổi) — xem client.js mục AI CHAT.
export const useAiChatMessages = (sessionId) =>
  useQuery({ queryKey: ['aiChatMessages', sessionId], queryFn: () => api.getAiChatMessages(sessionId), enabled: !!sessionId, retry: 1 });

/*
 * Danh sách phiên chat của TÔI (GET /ai-chat/sessions, mảng phẳng, mới nhất trước) — để xem lại lịch sử.
 * queryKey gắn userId: cache của tài khoản A không bao giờ bị tài khoản B đọc nhầm khi đổi tài khoản.
 */
export const useMyAiChatSessions = (enabled = true) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: ['aiChatSessions', userId], queryFn: api.getMyAiChatSessions, enabled: enabled && !!userId, retry: 1 });
};

export const useCreateAiChatSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAiChatSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aiChatSessions'] }),
  });
};

// sendAiChatMessage CHỈ trả tin nhắn assistant — invalidate để refetch lịch sử đầy đủ (cả tin user vừa gửi)
export const useSendAiChatMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sendAiChatMessage,
    // onSettled (không chỉ onSuccess): khi timeout/502, BE có thể ĐÃ lưu tin → refetch để lịch sử luôn đúng
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['aiChatMessages', vars.sessionId] });
      qc.invalidateQueries({ queryKey: ['aiChatSessions'] }); // tên + thứ tự phiên đổi sau tin nhắn đầu
    },
    // Log body request + response dạng chuỗi (không để "Object") để biết BE/AI báo gì khi 502
    onError: (err, vars) => import.meta.env.DEV && console.error(
      '[AI chat] gửi tin lỗi:', err?.code, err?.response?.status,
      '\nresponse:', JSON.stringify(err?.response?.data ?? err?.message),
      '\nrequest body:', JSON.stringify({ content: vars?.content, lat: vars?.lat, lng: vars?.lng }),
    ),
  });
};
