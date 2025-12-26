import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  CheckCircle2,
  Archive,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  usePDFTemplates,
  useDeletePDFTemplate,
  useDuplicatePDFTemplate,
  useUpdatePDFTemplate,
} from "@/hooks/usePDFTemplates";
import {
  DOCUMENT_TYPE_LABELS,
  TEMPLATE_STATUS_LABELS,
  type PDFTemplate,
  type TemplateStatus,
} from "@/types/pdf-builder";

export function PDFTemplateList() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = usePDFTemplates();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeletePDFTemplate();
  const { mutate: duplicateTemplate } = useDuplicatePDFTemplate();
  const { mutate: updateTemplate } = useUpdatePDFTemplate();

  const [templateToDelete, setTemplateToDelete] = useState<PDFTemplate | null>(null);

  const handleStatusChange = (template: PDFTemplate, newStatus: TemplateStatus) => {
    updateTemplate({ id: template.id, status: newStatus });
  };

  const getStatusBadgeVariant = (status: TemplateStatus) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!templates?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
        <p className="text-muted-foreground">
          Crie seu primeiro template para começar a gerar PDFs personalizados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow
                key={template.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/admin/pdf-templates/${template.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {template.name}
                    {template.is_default && (
                      <Badge variant="outline" className="text-xs">
                        Padrão
                      </Badge>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {template.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {DOCUMENT_TYPE_LABELS[template.document_type]}
                  </Badge>
                </TableCell>
                <TableCell>v{template.version}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(template.status)}>
                    {TEMPLATE_STATUS_LABELS[template.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(template.updated_at), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/pdf-templates/${template.id}`);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTemplate(template.id);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {template.status !== "active" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(template, "active");
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      )}
                      {template.status !== "archived" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(template, "archived");
                          }}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Arquivar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateToDelete(template);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (templateToDelete) {
                  deleteTemplate(templateToDelete.id);
                  setTemplateToDelete(null);
                }
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
