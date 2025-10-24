import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Database } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PopulateFY550ButtonProps {
  yachtModelCode: string;
  onSuccess?: () => void;
}

export function PopulateFY550Button({ yachtModelCode, onSuccess }: PopulateFY550ButtonProps) {
  const [isPopulating, setIsPopulating] = useState(false);

  // Só mostra o botão se for o modelo FY550
  if (yachtModelCode !== 'FY550') {
    return null;
  }

  const handlePopulate = async () => {
    setIsPopulating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-fy550-memorial', {
        body: {}
      });

      if (error) throw error;

      const itemsCreated = data?.itemsCreated || 0;
      
      toast.success(
        `Memorial do FY550 populado com sucesso!`,
        { description: `${itemsCreated} itens criados no memorial descritivo.` }
      );

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao popular memorial:', error);
      toast.error(
        'Erro ao popular memorial',
        { description: error instanceof Error ? error.message : 'Erro desconhecido' }
      );
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isPopulating}>
          {isPopulating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Populando...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Popular Memorial Base FY550
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Popular Memorial Descritivo do FY550?</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-2">
              <p>
                Esta ação irá <strong>deletar os 43 itens antigos</strong> e inserir <strong>~329 novos itens</strong> no memorial descritivo base do FY550, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>~300 itens do memorial padrão organizados em 22 categorias</li>
                <li>Deck, salão, cozinha, comando, flybridge</li>
                <li>Cabines (master, VIP, hóspedes, marinheiro)</li>
                <li>Casa de máquinas, sistemas elétricos e de navegação</li>
                <li>29 opcionais sugeridos (TVs, estabilizador, upgrades)</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Atenção:</strong> Todos os itens antigos com categorias legacy serão substituídos permanentemente.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handlePopulate}>
            Confirmar e Popular
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
