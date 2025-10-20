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
import { useCurrencies } from "@/hooks/use-currencies";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";

interface CurrencySelectorProps {
  selectedCurrencies: string[]; // Changed to array
  onCurrenciesChange: (currencies: string[]) => void; // Changed to array
}

export function CurrencySelector({
  selectedCurrencies,
  onCurrenciesChange,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: currenciesData } = useCurrencies();
  const currencies = currenciesData?.data || [];

  const handleSelect = (currencyCode: string) => {
    if (selectedCurrencies.includes(currencyCode)) {
      // Remove if already selected
      const updated = selectedCurrencies.filter((c) => c !== currencyCode);
      // Don't allow empty selection
      if (updated.length > 0) {
        onCurrenciesChange(updated);
      }
    } else {
      // Add to selection
      onCurrenciesChange([...selectedCurrencies, currencyCode]);
    }
  };

  // Display currency symbols + names (e.g., "$ USD, € EUR" or "$ USD, € EUR, ...")
  const displayText = (() => {
    if (selectedCurrencies.length === 0) return "Select currencies...";

    const first2 = selectedCurrencies.slice(0, 2).map((code) => {
      return `${getCurrencySymbol(code)} ${code.toUpperCase()}`;
    });

    if (selectedCurrencies.length > 2) {
      return `${first2.join(", ")}, ...`;
    }

    return first2.join(", ");
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-auto justify-between min-w-[120px]"
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  className="cursor-pointer"
                  onSelect={() => handleSelect(currency.code)}
                >
                  <span className="flex-1 flex items-center">
                    <span className="font-semibold mr-1.5">
                      {getCurrencySymbol(currency.code)}
                    </span>
                    {currency.code.toUpperCase()} - {currency.name}
                  </span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 flex-shrink-0",
                      selectedCurrencies.includes(currency.code)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
