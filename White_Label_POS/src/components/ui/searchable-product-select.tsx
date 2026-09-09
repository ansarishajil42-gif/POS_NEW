import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronsUpDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableProduct {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  unit?: string | null;
  [key: string]: any;
}

export interface SearchableProductSelectProps {
  products: SearchableProduct[];
  value: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeId?: string;
  displaySubtext?: "category" | "unit";
  className?: string;
}

export const SearchableProductSelect = React.memo(function SearchableProductSelect({
  products = [],
  value,
  onSelect,
  placeholder = "Search product...",
  disabled = false,
  excludeId,
  displaySubtext = "category",
  className,
}: SearchableProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === value);
  }, [products, value]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (excludeId) {
      list = list.filter((p) => p.id !== excludeId);
    }

    if (!searchQuery.trim()) {
      return list.slice(0, 50);
    }

    const q = searchQuery.toLowerCase().trim();
    const matches: SearchableProduct[] = [];

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
      const barcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
      const skuMatch = p.sku ? p.sku.toLowerCase().includes(q) : false;
      const catMatch = p.category ? p.category.toLowerCase().includes(q) : false;

      if (nameMatch || barcodeMatch || skuMatch || catMatch) {
        matches.push(p);
        if (matches.length >= 50) break;
      }
    }

    return matches;
  }, [products, excludeId, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-9 justify-between text-xs font-normal px-3 border-input bg-background min-w-0",
            className
          )}
        >
          <span className="truncate flex-1 text-left">
            {selectedProduct ? (
              <>
                <span className="font-medium text-ink">{selectedProduct.name}</span>
                <span className="text-muted-foreground ml-1.5 text-[11px]">
                  ({displaySubtext === "unit" ? (selectedProduct.unit || "pcs") : (selectedProduct.category || "General")})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] sm:min-w-[350px] p-2 z-50" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Type name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
            autoFocus
          />
        </div>
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {filteredProducts.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No products found.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSelected = value === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full text-left text-xs flex items-center justify-between py-1.5 px-2.5 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-primary/10 font-medium text-primary"
                  )}
                >
                  <div className="flex flex-col min-w-0 flex-1 mr-2">
                    <span className="truncate font-medium text-ink">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {displaySubtext === "unit" ? `Unit: ${p.unit || "pcs"}` : (p.category || "General")}
                      {p.barcode ? ` • Barcode: ${p.barcode}` : ""}
                      {p.sku ? ` • SKU: ${p.sku}` : ""}
                    </span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
