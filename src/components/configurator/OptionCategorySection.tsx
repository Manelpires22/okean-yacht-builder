import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { OptionCard } from "./OptionCard";
import { useOptions } from "@/hooks/useOptions";
import { Skeleton } from "@/components/ui/skeleton";

interface OptionCategorySectionProps {
  categories: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  selectedOptionIds: string[];
  onToggleOption: (optionId: string, unitPrice: number, deliveryDaysImpact: number) => void;
  yachtModelId?: string;
}

export function OptionCategorySection({
  categories,
  selectedOptionIds,
  onToggleOption,
  yachtModelId,
}: OptionCategorySectionProps) {
  return (
    <Accordion type="multiple" className="w-full">
      {categories.map((category) => (
        <CategoryAccordionItem
          key={category.id}
          category={category}
          selectedOptionIds={selectedOptionIds}
          onToggleOption={onToggleOption}
          yachtModelId={yachtModelId}
        />
      ))}
    </Accordion>
  );
}

function CategoryAccordionItem({
  category,
  selectedOptionIds,
  onToggleOption,
  yachtModelId,
}: {
  category: { id: string; name: string; description?: string };
  selectedOptionIds: string[];
  onToggleOption: (optionId: string, unitPrice: number, deliveryDaysImpact: number) => void;
  yachtModelId?: string;
}) {
  const { data: options, isLoading } = useOptions(category.id, yachtModelId);

  const selectedCount = options?.filter((opt) =>
    selectedOptionIds.includes(opt.id)
  ).length || 0;

  return (
    <AccordionItem value={category.id}>
      <AccordionTrigger className="text-left hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div>
            <span className="font-semibold">{category.name}</span>
            {category.description && (
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
          {selectedCount > 0 && (
            <Badge variant="secondary">{selectedCount} selecionado(s)</Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : options && options.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={selectedOptionIds.includes(option.id)}
                onToggle={() =>
                  onToggleOption(
                    option.id,
                    Number(option.base_price),
                    option.delivery_days_impact || 0
                  )
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Nenhum opcional disponível nesta categoria
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
