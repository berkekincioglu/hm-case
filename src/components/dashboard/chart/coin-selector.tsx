"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCoins } from "@/hooks/use-coins";
import { cn } from "@/lib/utils";

interface CoinSelectorProps {
  selectedCoins: string[];
  onCoinsChange: (coins: string[]) => void;
}

export function CoinSelector({
  selectedCoins,
  onCoinsChange,
}: CoinSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: coinsData } = useCoins();
  const coins = coinsData?.data || [];

  // Display coin symbols + names (e.g., "BTC Bitcoin, ETH Ethereum" or "BTC, ETH, ...")
  const selectedCoinsDisplay = (() => {
    if (selectedCoins.length === 0) return "Select coins...";

    const firstTwoSelectedCoins = selectedCoins.slice(0, 2).map((coinId) => {
      const coin = coins.find((c) => c.id === coinId);
      return coin?.symbol.toUpperCase() || coinId.toUpperCase();
    });

    if (selectedCoins.length > 2) {
      return `${firstTwoSelectedCoins.join(", ")}, ...`;
    }

    return firstTwoSelectedCoins.join(", ");
  })();

  const toggleCoin = (coinId: string) => {
    if (selectedCoins.includes(coinId)) {
      onCoinsChange(selectedCoins.filter((id) => id !== coinId));
    } else {
      onCoinsChange([...selectedCoins, coinId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-auto justify-between min-w-[120px]"
        >
          <span className="truncate">{selectedCoinsDisplay}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search coins..." />
          <CommandList>
            <CommandEmpty>No coins found.</CommandEmpty>
            <CommandGroup>
              {coins.map((coin) => (
                <CommandItem
                  key={coin.id}
                  value={coin.id}
                  onSelect={() => toggleCoin(coin.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCoins.includes(coin.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {coin.symbol.toUpperCase()} - {coin.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
