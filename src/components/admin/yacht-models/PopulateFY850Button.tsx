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

interface PopulateFY850ButtonProps {
  yachtModelCode: string;
  onSuccess?: () => void;
}

export function PopulateFY850Button({ yachtModelCode, onSuccess }: PopulateFY850ButtonProps) {
  const [isPopulating, setIsPopulating] = useState(false);

  // Só mostra o botão se for o modelo FY850
  if (yachtModelCode !== 'FY850') {
    return null;
  }

  const handlePopulate = async () => {
    setIsPopulating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-fy850-memorial', {
        body: {}
      });

      if (error) throw error;

      const itemsCreated = data?.itemsCreated || 0;
      
      toast.success(
        `Memorial do FY850 populado com sucesso!`,
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
              Popular Memorial Base FY850
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Popular Memorial Descritivo do FY850?</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-2">
              <p>
                Esta ação irá inserir <strong>~413 itens</strong> no memorial descritivo base do FY850, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Equipamentos de convés, salão, áreas internas</li>
                <li>Sistemas elétricos, hidráulicos e de navegação</li>
                <li>Acabamentos, conforto térmico e audiovisual</li>
                <li>Segurança, propulsão e tender</li>
                <li>Equipamentos adicionais padrão</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Nota:</strong> Certifique-se de que o memorial está vazio antes de executar esta ação
                para evitar duplicação de itens.
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
