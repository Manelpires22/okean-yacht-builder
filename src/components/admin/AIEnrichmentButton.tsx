import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AIEnrichmentModal } from "./AIEnrichmentModal";

export interface EnrichmentData {
  description?: string;
  brand?: string;
  model?: string;
  image_url?: string;
}

interface AIEnrichmentButtonProps {
  itemName: string;
  itemType: 'optional' | 'upgrade' | 'memorial';
  currentBrand?: string;
  currentModel?: string;
  onAccept: (data: EnrichmentData) => void;
  disabled?: boolean;
  size?: "sm" | "default" | "icon";
}

export function AIEnrichmentButton({
  itemName,
  itemType,
  currentBrand,
  currentModel,
  onAccept,
  disabled,
  size = "icon",
}: AIEnrichmentButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    if (!itemName?.trim()) {
      return;
    }
    setModalOpen(true);
  };

  const handleAccept = (data: EnrichmentData) => {
    onAccept(data);
    setModalOpen(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size}
            onClick={handleClick}
            disabled={disabled || !itemName?.trim()}
            className="shrink-0"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            {size !== "icon" && <span className="ml-2">Enriquecer com IA</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {itemName?.trim() 
            ? "Gerar descrição e imagens com IA"
            : "Digite o nome do item primeiro"
          }
        </TooltipContent>
      </Tooltip>

      <AIEnrichmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        itemName={itemName}
        itemType={itemType}
        currentBrand={currentBrand}
        currentModel={currentModel}
        onAccept={handleAccept}
      />
    </>
  );
}
