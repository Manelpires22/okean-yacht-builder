import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Search, User } from "lucide-react";
import { useClients, useCreateClient } from "@/hooks/useClients";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ClientSelectorProps {
  sellerName: string;
  onSelect: (client: { id: string; name: string }) => void;
  onBack: () => void;
}

export function ClientSelector({ sellerName, onSelect, onBack }: ClientSelectorProps) {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  
  const [search, setSearch] = useState("");
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const filteredClients = clients?.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.company?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const result = await createClient.mutateAsync({
        name: newClientName.trim(),
        email: newClientEmail.trim() || null,
        phone: newClientPhone.trim() || null,
      });
      
      setShowNewClientDialog(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      
      onSelect({ id: result.id, name: result.name });
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
            <span>Vendedor</span>
          </span>
          <span className="w-8 h-px bg-border" />
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
            <span className="font-medium text-foreground">Cliente</span>
          </span>
          <span className="w-8 h-px bg-border" />
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</span>
            <span>Modelo</span>
          </span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>Para qual cliente é esta simulação?</CardTitle>
                <CardDescription>
                  Vendedor: {sellerName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente por nome, email ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* New Client Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowNewClientDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Cadastrar Novo Cliente
            </Button>

            {/* Client List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando clientes...
                </div>
              ) : filteredClients?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </div>
              ) : (
                filteredClients?.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => onSelect({ id: client.id, name: client.name })}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border border-border",
                      "hover:bg-accent hover:border-primary/50 transition-colors text-left"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.company || client.email || "Sem informações adicionais"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente para esta simulação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateClient}
              disabled={!newClientName.trim() || createClient.isPending}
            >
              {createClient.isPending ? "Criando..." : "Criar e Selecionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
