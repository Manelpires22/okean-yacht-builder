import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Plus, Search, User, Ship, Settings, Users, Repeat } from "lucide-react";
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

export interface ClientData {
  id: string;
  name: string;
}

interface ClientStepProps {
  commissionName: string;
  onSelect: (client: ClientData) => void;
  onBack: () => void;
}

interface StepIndicatorProps {
  step: number;
  label: string;
  active?: boolean;
  completed?: boolean;
  icon: React.ReactNode;
}

function StepIndicator({ step, label, active, completed, icon }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
          active && "bg-primary text-primary-foreground",
          completed && "bg-primary/20 text-primary",
          !active && !completed && "bg-muted text-muted-foreground"
        )}
      >
        {completed ? "✓" : icon}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          active && "text-foreground",
          !active && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function ClientStep({ commissionName, onSelect, onBack }: ClientStepProps) {
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
    <div className="container mx-auto px-4 py-8 max-w-xl">
      {/* Botão Voltar */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        <StepIndicator step={1} label="Vendedor" completed icon={<User className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={2} label="Cliente" active icon={<Users className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={3} label="Trade-In" icon={<Repeat className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={4} label="Modelo" icon={<Ship className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <StepIndicator step={5} label="Config" icon={<Settings className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Para qual cliente?</CardTitle>
          <CardDescription>
            Vendedor: <span className="font-medium text-foreground">{commissionName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
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
          <div className="space-y-2 max-h-80 overflow-y-auto">
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

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente para esta cotação.
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
