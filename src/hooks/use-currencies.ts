import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: api.currencies.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes (currencies list rarely changes)
  });
}
