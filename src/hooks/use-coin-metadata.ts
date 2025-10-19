import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";

export function useCoinMetadata(coinId: string, enabled = true) {
  // Only fetch metadata when coinId is provided and hook is enabled
  const shouldFetchMetadata = enabled && !!coinId;

  return useQuery({
    queryKey: ["coin-metadata", coinId],
    queryFn: () => api.coins.getMetadata({ coinId }),
    enabled: shouldFetchMetadata,
    staleTime: 10 * 60 * 1000, // 10 minutes (metadata rarely changes)
  });
}
