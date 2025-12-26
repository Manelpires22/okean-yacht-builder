import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Pencil, Trash2, Copy, ChevronDown, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
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
import { QuotationStatusBadge } from "./QuotationStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { calculateCorrectFinalPrice } from "@/hooks/useQuotationVersionChain";

interface QuotationVersionRowProps {
  latestVersion: any;
  previousVersions: any[];
  totalVersions: number;
  hasMultipleVersions: boolean;
  hasContract: boolean;
  contractNumber: string | null;
  onNavigate: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function QuotationVersionRow({
  latestVersion,
  previousVersions,
  totalVersions,
  hasMultipleVersions,
  hasContract,
  contractNumber,
  onNavigate,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit,
  canDelete
}: QuotationVersionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isContracted = hasContract && 
    latestVersion.contracts && 
    Array.isArray(latestVersion.contracts) && 
    latestVersion.contracts.length > 0;

  return (
    <>
      {/* Linha principal (última versão) */}
      <TableRow className="group hover:bg-muted/50">
        <TableCell className="sticky left-0 bg-background group-hover:bg-muted/50 z-10">
          <div className="flex items-center gap-2">
            {hasMultipleVersions && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-180"
                  )} 
                />
              </Button>
            )}
            <div>
              <div className="font-medium flex items-center gap-2">
                {latestVersion.quotation_number}
                <Badge variant="outline" className="text-xs">
                  v{latestVersion.version || 1}
                </Badge>
                {hasMultipleVersions && (
                  <Badge variant="secondary" className="text-xs">
                    {totalVersions} versões
                  </Badge>
                )}
                {isContracted && (
                  <>
                    <Badge className="bg-emerald-500 text-white text-xs">
                      <FileCheck className="h-3 w-3 mr-1" />
                      Contratada
                    </Badge>
                    {contractNumber && (
                      <Badge variant="outline" className="text-xs">
                        {contractNumber}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          <div>
            <div className="font-medium">
              {latestVersion.clients?.name || latestVersion.client_name}
            </div>
            {latestVersion.clients?.company && (
              <div className="text-sm text-muted-foreground">
                {latestVersion.clients.company}
              </div>
            )}
          </div>
        </TableCell>
        
        <TableCell className="hidden md:table-cell">
          {latestVersion.yacht_models?.name || "N/A"}
        </TableCell>
        
        <TableCell>{formatCurrency(calculateCorrectFinalPrice(latestVersion))}</TableCell>
        
        <TableCell>
          <QuotationStatusBadge status={latestVersion.status} />
        </TableCell>
        
        <TableCell className="hidden lg:table-cell">
          {format(new Date(latestVersion.valid_until), "dd/MM/yyyy", { locale: ptBR })}
        </TableCell>
        
        <TableCell className="hidden xl:table-cell">
          {format(new Date(latestVersion.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </TableCell>
        
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(latestVersion.id)}
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {canEdit && !isContracted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(latestVersion.id)}
                title="Editar cotação"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            
            {canDelete && !isContracted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Deletar cotação"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a cotação {latestVersion.quotation_number}?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(latestVersion.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(latestVersion.id)}
              title="Duplicar cotação"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Linhas das versões anteriores (expandíveis) */}
      {isExpanded && previousVersions.map((version) => (
        <TableRow 
          key={version.id} 
          className="bg-muted/30 border-l-4 border-l-muted-foreground/20 hover:bg-muted/50"
        >
          <TableCell className="sticky left-0 bg-muted/30 hover:bg-muted/50 z-10 pl-12">
            <div className="font-medium text-sm flex items-center gap-2">
              {version.quotation_number}
              <Badge variant="outline" className="text-xs">
                v{version.version || 1}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Anterior
              </Badge>
            </div>
          </TableCell>
          
          <TableCell className="text-sm text-muted-foreground">
            {version.clients?.name || version.client_name}
          </TableCell>
          
          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
            {version.yacht_models?.name || "N/A"}
          </TableCell>
          
          <TableCell className="text-sm">{formatCurrency(calculateCorrectFinalPrice(version))}</TableCell>
          
          <TableCell>
            <QuotationStatusBadge status={version.status} />
          </TableCell>
          
          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
            {format(new Date(version.valid_until), "dd/MM/yyyy", { locale: ptBR })}
          </TableCell>
          
          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
            {format(new Date(version.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </TableCell>
          
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(version.id)}
                title="Ver versão anterior"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Deletar versão"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a versão {version.quotation_number}?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(version.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Deletar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
