import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, X } from "lucide-react";
import { useMemorialSearch } from "@/hooks/useMemorialSearch";
import type { MemorialOkeanItem } from "@/hooks/useMemorialOkean";

interface MemorialSearchBarProps {
  items: MemorialOkeanItem[];
  onItemSelect: (item: MemorialOkeanItem) => void;
}

export function MemorialSearchBar({ items, onItemSelect }: MemorialSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const { filteredItems, hasSearch } = useMemorialSearch(items, searchTerm);

  return (
    <div className="relative">
      <Popover open={open && hasSearch} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar item por descrição, marca, categoria..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpen(true);
              }}
              className="pl-10 pr-10"
            />
            {hasSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => {
                  setSearchTerm("");
                  setOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
              <CommandGroup heading={`${filteredItems.length} resultados`}>
                {filteredItems.slice(0, 10).map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      onItemSelect(item);
                      setSearchTerm("");
                      setOpen(false);
                    }}
                    className="flex flex-col items-start gap-2 p-3"
                  >
                    <div className="font-medium">{item.descricao_item}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{item.categoria}</Badge>
                      <span>•</span>
                      <span>Modelo: {item.modelo}</span>
                      {item.marca && (
                        <>
                          <span>•</span>
                          <span>Marca: {item.marca}</span>
                        </>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
