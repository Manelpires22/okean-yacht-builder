import { AdminLayout } from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, ArrowUpDown } from "lucide-react";
import { YachtModelOrderDialog } from "@/components/admin/yacht-models/YachtModelOrderDialog";
import { useState } from "react";

const AdminYachtModels = () => {
  const navigate = useNavigate();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const { data: models, isLoading } = useQuery({
    queryKey: ['admin-yacht-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yacht_models')
        .select('*')
        .order('display_order')
        .order('code');
      
      if (error) throw error;
      return data;
    }
  });


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Modelos de Iates</h1>
            <p className="text-muted-foreground">Gerir modelos de iates disponíveis</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOrderDialogOpen(true)}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Ordenar Modelos
            </Button>
            <Button onClick={() => navigate('/admin/yacht-models/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Modelo
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead>Prazo (dias)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                models?.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-mono text-xs">{model.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {model.image_url && (
                          <img 
                            src={model.image_url} 
                            alt={model.name}
                            className="h-10 w-16 object-cover rounded"
                          />
                        )}
                        <span className="font-medium">{model.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {model.base_price ? `R$${model.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "A definir"}
                    </TableCell>
                    <TableCell>
                      {model.base_delivery_days ? `${model.base_delivery_days}d` : "A definir"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={model.is_active ? "default" : "secondary"}>
                        {model.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {model.technical_specifications ? "Com specs" : "Sem specs"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/yacht-models/${model.id}/edit`)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar Modelo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <YachtModelOrderDialog 
        open={orderDialogOpen} 
        onOpenChange={setOrderDialogOpen} 
      />
    </AdminLayout>
  );
};

export default AdminYachtModels;
