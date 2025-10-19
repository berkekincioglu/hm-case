"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoins } from "@/hooks/use-coins";

interface CoinMetadata {
  coinId: string;
  name: string;
  symbol: string;
  description: string | null;
  imageUrl: string | null;
  homepageUrl: string | null;
}

async function fetchCoinMetadata(coinId: string): Promise<CoinMetadata> {
  const response = await fetch(`/api/coins/${coinId}/metadata`);
  if (!response.ok) {
    throw new Error("Failed to fetch coin metadata");
  }
  const data = await response.json();
  return data.data;
}

interface SelectedCoinCardsProps {
  selectedCoins: string[];
  onRemoveCoin: (coinId: string) => void;
}

export function SelectedCoinCards({
  selectedCoins,
  onRemoveCoin,
}: SelectedCoinCardsProps) {
  const { data: coinsData } = useCoins();
  const coins = coinsData?.data || [];

  if (selectedCoins.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedCoins.map((coinId) => {
        const coin = coins.find((c) => c.id === coinId);
        if (!coin) return null;

        return (
          <CoinCard
            key={coinId}
            coinId={coinId}
            coinName={coin.name}
            coinSymbol={coin.symbol}
            onRemove={() => onRemoveCoin(coinId)}
          />
        );
      })}
    </div>
  );
}

interface CoinCardProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  onRemove: () => void;
}

function CoinCard({ coinId, coinName, coinSymbol, onRemove }: CoinCardProps) {
  const { data: metadata, isLoading } = useQuery({
    queryKey: ["coin-metadata", coinId],
    queryFn: () => fetchCoinMetadata(coinId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Badge
          variant="secondary"
          className="h-9 px-2.5 gap-2 hover:bg-secondary/80 transition-colors"
        >
          {metadata?.imageUrl && !isLoading ? (
            <Image
              src={metadata.imageUrl}
              alt={coinName}
              width={20}
              height={20}
              className="rounded-full w-5 h-5 object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
          )}
          <span className="font-medium">{coinSymbol.toUpperCase()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 hover:text-destructive transition-colors"
            aria-label={`Remove ${coinName}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="bottom">
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
