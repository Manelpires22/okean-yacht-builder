import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { PDFTemplateList } from "@/components/pdf-builder/PDFTemplateList";
import { CreateTemplateDialog } from "@/components/pdf-builder/CreateTemplateDialog";

export default function AdminPDFTemplates() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileText className="h-8 w-8" />
              Templates PDF
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os templates para geração de documentos PDF
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        </div>

        <PDFTemplateList />

        <CreateTemplateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </AdminLayout>
  );
}
