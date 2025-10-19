"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";

interface CoinMetadata {
  coinId: string;
  name: string;
  symbol: string;
  description: string | null;
  imageUrl: string | null;
  homepageUrl: string | null;
}

interface CoinTooltipProps {
  coinId: string;
  children: React.ReactNode;
}

async function fetchCoinMetadata(coinId: string): Promise<CoinMetadata> {
  const response = await fetch(`/api/coins/${coinId}/metadata`);
  if (!response.ok) {
    throw new Error("Failed to fetch coin metadata");
  }
  const data = await response.json();
  return data.data;
}

export function CoinTooltip({ coinId, children }: CoinTooltipProps) {
  const { data: metadata, isLoading } = useQuery({
    queryKey: ["coin-metadata", coinId],
    queryFn: () => fetchCoinMetadata(coinId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - metadata doesn't change often
  });

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : metadata ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {metadata.imageUrl && (
                <Image
                  src={metadata.imageUrl}
                  alt={metadata.name}
                  width={48}
                  height={48}
                  className="rounded-full w-12 h-12 object-cover"
                />
              )}
              <div>
                <h4 className="font-semibold text-sm">{metadata.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {metadata.symbol.toUpperCase()}
                </p>
              </div>
            </div>
            {metadata.description && (
              <p className="text-xs text-muted-foreground line-clamp-4">
                {metadata.description.replace(/<[^>]*>/g, "")}
              </p>
            )}
            {metadata.homepageUrl && (
              <a
                href={metadata.homepageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Visit Website →
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No metadata available</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
