import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { OptionCard } from "./OptionCard";
import { OptionCustomizationDialog } from "./OptionCustomizationDialog";
import { useOptions } from "@/hooks/useOptions";
import { Skeleton } from "@/components/ui/skeleton";

interface OptionCategorySectionProps {
  categories: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  selectedOptions: Array<{
    option_id: string;
    customization_notes?: string;
  }>;
  onToggleOption: (optionId: string, unitPrice: number, deliveryDaysImpact: number) => void;
  onCustomizeOption: (optionId: string, notes: string) => void;
  yachtModelId?: string;
}

export function OptionCategorySection({
  categories,
  selectedOptions,
  onToggleOption,
  onCustomizeOption,
  yachtModelId,
}: OptionCategorySectionProps) {
  return (
    <Accordion type="multiple" className="w-full">
      {categories.map((category) => (
        <CategoryAccordionItem
          key={category.id}
          category={category}
          selectedOptions={selectedOptions}
          onToggleOption={onToggleOption}
          onCustomizeOption={onCustomizeOption}
          yachtModelId={yachtModelId}
        />
      ))}
    </Accordion>
  );
}

function CategoryAccordionItem({
  category,
  selectedOptions,
  onToggleOption,
  onCustomizeOption,
  yachtModelId,
}: {
  category: { id: string; name: string; description?: string };
  selectedOptions: Array<{
    option_id: string;
    customization_notes?: string;
  }>;
  onToggleOption: (optionId: string, unitPrice: number, deliveryDaysImpact: number) => void;
  onCustomizeOption: (optionId: string, notes: string) => void;
  yachtModelId?: string;
}) {
  const [customizingOption, setCustomizingOption] = useState<{ id: string; name: string } | null>(null);
  const { data: options, isLoading } = useOptions(category.id, yachtModelId);

  const selectedCount = options?.filter((opt) =>
    selectedOptions.some(s => s.option_id === opt.id)
  ).length || 0;

  return (
    <AccordionItem value={category.id}>
      <AccordionTrigger className="text-left hover:no-underline">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-4 gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-sm sm:text-base break-words">{category.name}</span>
            {category.description && (
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                {category.description}
              </p>
            )}
          </div>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="shrink-0 text-xs">{selectedCount} selecionado(s)</Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {isLoading ? (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : options && options.length > 0 ? (
          <>
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {options.map((option) => {
                const selectedOption = selectedOptions.find(s => s.option_id === option.id);
                return (
                  <OptionCard
                    key={option.id}
                    option={option}
                    isSelected={!!selectedOption}
                    customizationNotes={selectedOption?.customization_notes}
                    onToggle={() =>
                      onToggleOption(
                        option.id,
                        Number(option.base_price),
                        option.delivery_days_impact || 0
                      )
                    }
                    onCustomize={() => setCustomizingOption({ id: option.id, name: option.name })}
                  />
                );
              })}
            </div>

            {customizingOption && (
              <OptionCustomizationDialog
                open={!!customizingOption}
                onOpenChange={(open) => !open && setCustomizingOption(null)}
                optionName={customizingOption.name}
                existingNotes={selectedOptions.find(s => s.option_id === customizingOption.id)?.customization_notes}
                onSave={(notes) => {
                  onCustomizeOption(customizingOption.id, notes);
                  setCustomizingOption(null);
                }}
              />
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Nenhum opcional disponível nesta categoria
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
