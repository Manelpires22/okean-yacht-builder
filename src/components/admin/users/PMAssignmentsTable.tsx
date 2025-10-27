import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, UserPlus } from "lucide-react";
import { useUnassignPMFromModel, type PMAssignment } from "@/hooks/usePMAssignments";
import { AssignPMDialog } from "./AssignPMDialog";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PMAssignmentsTableProps {
  assignments: PMAssignment[];
}

export function PMAssignmentsTable({ assignments }: PMAssignmentsTableProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const { mutate: unassign } = useUnassignPMFromModel();

  const handleUnassign = (yacht_model_id: string) => {
    if (confirm("Tem certeza que deseja remover esta atribuição?")) {
      unassign(yacht_model_id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAssignDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Atribuir PM a Modelo
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma atribuição de PM configurada
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo de Iate</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>PM Responsável</TableHead>
              <TableHead>Email do PM</TableHead>
              <TableHead>Atribuído em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium">
                  {assignment.yacht_model?.name || "N/A"}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {assignment.yacht_model?.code || "N/A"}
                  </code>
                </TableCell>
                <TableCell>{assignment.pm_user?.full_name || "N/A"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {assignment.pm_user?.email || "N/A"}
                </TableCell>
                <TableCell>
                  {format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(assignment.yacht_model_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AssignPMDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} />
    </div>
  );
}
