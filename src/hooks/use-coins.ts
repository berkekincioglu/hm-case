import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";

export function useCoins() {
  return useQuery({
    queryKey: ["coins"],
    queryFn: api.coins.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes (coins list rarely changes)
  });
}
