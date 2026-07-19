import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

// Hooks cho AI Chat (chatbot nổi) — xem client.js mục AI CHAT.
export const useAiChatMessages = (sessionId) =>
  useQuery({ queryKey: ['aiChatMessages', sessionId], queryFn: () => api.getAiChatMessages(sessionId), enabled: !!sessionId });

export const useCreateAiChatSession = () => useMutation({ mutationFn: api.createAiChatSession });

// sendAiChatMessage CHỈ trả tin nhắn assistant — invalidate để refetch lịch sử đầy đủ (cả tin user vừa gửi)
export const useSendAiChatMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sendAiChatMessage,
    onSuccess: (_assistantMsg, vars) => qc.invalidateQueries({ queryKey: ['aiChatMessages', vars.sessionId] }),
  });
};
