import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { needsApproval, getDiscountApprovalMessage } from "@/lib/approval-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const saveQuotationSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  client_email: z.string().email("Email inválido").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  notes: z.string().optional(),
  base_discount_percentage: z.number().min(0).max(100).optional(),
  options_discount_percentage: z.number().min(0).max(100).optional(),
});

type SaveQuotationFormValues = z.infer<typeof saveQuotationSchema>;

interface SaveQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SaveQuotationFormValues) => Promise<void>;
  isLoading?: boolean;
  baseDiscountPercentage?: number;
  optionsDiscountPercentage?: number;
  customizationsCount?: number;
}

export function SaveQuotationDialog({
  open,
  onOpenChange,
  onSave,
  isLoading,
  baseDiscountPercentage = 0,
  optionsDiscountPercentage = 0,
  customizationsCount = 0,
}: SaveQuotationDialogProps) {
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [useExistingClient, setUseExistingClient] = useState(false);
  
  const { data: clients = [] } = useClients();
  
  const requiresApproval = needsApproval(baseDiscountPercentage, optionsDiscountPercentage);
  const approvalMessage = getDiscountApprovalMessage(baseDiscountPercentage, optionsDiscountPercentage);
  
  const form = useForm<SaveQuotationFormValues>({
    resolver: zodResolver(saveQuotationSchema),
    defaultValues: {
      client_id: "",
      client_name: "",
      client_email: "",
      client_phone: "",
      notes: "",
      base_discount_percentage: baseDiscountPercentage,
      options_discount_percentage: optionsDiscountPercentage,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        client_id: "",
        client_name: "",
        client_email: "",
        client_phone: "",
        notes: "",
        base_discount_percentage: baseDiscountPercentage,
        options_discount_percentage: optionsDiscountPercentage,
      });
      setUseExistingClient(false);
    }
  }, [open, form, baseDiscountPercentage, optionsDiscountPercentage]);

  // When client is selected, populate fields
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      form.setValue('client_id', client.id);
      form.setValue('client_name', client.name);
      form.setValue('client_email', client.email || '');
      form.setValue('client_phone', client.phone || '');
      setUseExistingClient(true);
    }
  };

  const handleSubmit = async (data: SaveQuotationFormValues) => {
    await onSave(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salvar Cotação</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente para salvar esta configuração como cotação
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {requiresApproval && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aprovação Necessária</AlertTitle>
                <AlertDescription>
                  {approvalMessage}. A cotação será enviada para aprovação após salvar.
                </AlertDescription>
              </Alert>
            )}
            {customizationsCount > 0 && (
              <Alert variant="default" className="bg-warning/10 border-warning">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertTitle>Itens Customizados</AlertTitle>
                <AlertDescription>
                  Esta cotação possui {customizationsCount} {customizationsCount === 1 ? 'item customizado que precisa' : 'itens customizados que precisam'} de validação técnica antes da aprovação final.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Cliente</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseExistingClient(!useExistingClient);
                    if (!useExistingClient) {
                      form.setValue('client_id', '');
                      form.setValue('client_name', '');
                      form.setValue('client_email', '');
                      form.setValue('client_phone', '');
                    }
                  }}
                >
                  {useExistingClient ? 'Novo Cliente' : 'Cliente Existente'}
                </Button>
              </div>

              {useExistingClient ? (
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientSearchOpen}
                      className="w-full justify-between"
                    >
                      {form.watch('client_id')
                        ? clients.find((c) => c.id === form.watch('client_id'))?.name
                        : "Selecione um cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              handleClientSelect(client.id);
                              setClientSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.watch('client_id') === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{client.name}</div>
                              {client.email && (
                                <div className="text-sm text-muted-foreground">{client.email}</div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>

            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="João Silva" 
                      {...field}
                      disabled={useExistingClient}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="joao@exemplo.com"
                      {...field}
                      disabled={useExistingClient}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+55 11 99999-9999" 
                      {...field}
                      disabled={useExistingClient}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a cotação..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Cotação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
