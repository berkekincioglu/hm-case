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
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: currenciesData } = useCurrencies();
  const currencies = currenciesData?.data || [];

  const selectedCurrencyName =
    currencies.find((c) => c.code === selectedCurrency)?.name ||
    selectedCurrency.toUpperCase();

  const selectedCurrencySymbol = getCurrencySymbol(selectedCurrency);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[140px] justify-between"
        >
          <span className="flex items-center gap-1.5">
            <span className="font-semibold">{selectedCurrencySymbol}</span>
            <span>{selectedCurrencyName}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={() => {
                    onCurrencyChange(currency.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCurrency === currency.code
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="font-semibold mr-1.5">
                    {getCurrencySymbol(currency.code)}
                  </span>
                  {currency.code.toUpperCase()} - {currency.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
