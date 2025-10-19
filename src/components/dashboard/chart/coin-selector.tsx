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

  const selectedCoinsDisplay =
    selectedCoins.length === 0
      ? "Select coins..."
      : `${selectedCoins.length} coin${
          selectedCoins.length === 1 ? "" : "s"
        } selected`;

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
          className="w-[180px] justify-between"
        >
          {selectedCoinsDisplay}
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
