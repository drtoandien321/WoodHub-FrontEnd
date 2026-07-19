import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

// Hooks cho Quote & Custom Order (BE-8, FE-6) — xem client.js.
export const useMyQuotes = (params) => useQuery({ queryKey: ['myQuotes', params], queryFn: () => api.getMyQuotes(params) });
export const useIncomingQuotes = (params) => useQuery({ queryKey: ['incomingQuotes', params], queryFn: () => api.getIncomingQuotes(params) });
export const useQuoteDetail = (id) => useQuery({ queryKey: ['quote', id], queryFn: () => api.getQuoteDetail(id), enabled: !!id });

export const useCreateQuote = () => useMutation({ mutationFn: api.createQuote });

export const useCancelQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.cancelQuote,
    onSuccess: (quote) => { qc.setQueryData(['quote', quote.id], quote); qc.invalidateQueries({ queryKey: ['myQuotes'] }); },
  });
};

export const useCreateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createOffer,
    onSuccess: (_offer, vars) => { qc.invalidateQueries({ queryKey: ['quote', vars.quoteId] }); qc.invalidateQueries({ queryKey: ['myQuotes'] }); qc.invalidateQueries({ queryKey: ['incomingQuotes'] }); },
  });
};

export const useAcceptOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.acceptOffer,
    onSuccess: (_order, vars) => {
      qc.invalidateQueries({ queryKey: ['quote', vars.quoteId] });
      qc.invalidateQueries({ queryKey: ['myQuotes'] });
      qc.invalidateQueries({ queryKey: ['incomingQuotes'] });
      qc.invalidateQueries({ queryKey: ['myCustomOrders'] });
      qc.invalidateQueries({ queryKey: ['incomingCustomOrders'] });
    },
  });
};

export const useRejectOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.rejectOffer,
    onSuccess: (quote, vars) => { qc.setQueryData(['quote', vars.quoteId], quote); qc.invalidateQueries({ queryKey: ['myQuotes'] }); qc.invalidateQueries({ queryKey: ['incomingQuotes'] }); },
  });
};

export const useMyCustomOrders = (params) => useQuery({ queryKey: ['myCustomOrders', params], queryFn: () => api.getMyCustomOrders(params) });
export const useIncomingCustomOrders = (params) => useQuery({ queryKey: ['incomingCustomOrders', params], queryFn: () => api.getIncomingCustomOrders(params) });
export const useCustomOrderDetail = (id) => useQuery({ queryKey: ['customOrder', id], queryFn: () => api.getCustomOrderDetail(id), enabled: !!id });

export const useUpdateCustomOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateCustomOrderStatus,
    onSuccess: (order) => {
      qc.setQueryData(['customOrder', order.id], order);
      qc.invalidateQueries({ queryKey: ['myCustomOrders'] });
      qc.invalidateQueries({ queryKey: ['incomingCustomOrders'] });
    },
  });
};
