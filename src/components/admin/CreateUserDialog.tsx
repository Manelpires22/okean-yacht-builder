import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useCreateUser } from "@/hooks/useCreateUser";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { useYachtModels } from "@/hooks/useYachtModels";
import { Ship, Trash2 } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional(),
  password: z.string().optional(),
  department: z.string().min(1, "Selecione um departamento"),
  roles: z.array(z.string()).min(1, "Selecione pelo menos uma role"),
  pm_yacht_models: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  change_password: z.boolean().default(false),
  new_password: z.string().optional(),
}).refine((data) => {
  // Se está criando novo usuário, password é obrigatório
  if (!data.email) return true; // Modo edição
  if (!data.password || data.password.length < 8) {
    return false;
  }
  return true;
}, {
  message: "Password deve ter pelo menos 8 caracteres",
  path: ["password"],
}).refine((data) => {
  // Se marcou para alterar password, new_password é obrigatório
  if (data.change_password && (!data.new_password || data.new_password.length < 8)) {
    return false;
  }
  return true;
}, {
  message: "Nova password deve ter pelo menos 8 caracteres",
  path: ["new_password"],
});

type FormValues = z.infer<typeof formSchema>;

const ROLES = [
  { value: "administrador", label: "Administrador" },
  { value: "gerente_comercial", label: "Gerente Comercial" },
  { value: "comercial", label: "Comercial" },
  { value: "producao", label: "Produção" },
  { value: "financeiro", label: "Financeiro" },
  { value: "pm_engenharia", label: "PM Engenharia" },
  { value: "comprador", label: "Comprador (Supply)" },
  { value: "planejador", label: "Planejador (Planning)" },
  { value: "diretor_comercial", label: "Diretor Comercial" },
  { value: "broker", label: "Broker" },
  { value: "backoffice_comercial", label: "Backoffice Comercial" },
];

const DEPARTMENTS = [
  "Comercial",
  "Engenharia",
  "Supply",
  "Planning",
  "Financeiro",
  "Backoffice",
  "Produção",
];

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    full_name: string;
    email: string;
    department: string;
    is_active: boolean;
    roles: string[];
    pm_yacht_models?: string[];
  } | null;
}

export function CreateUserDialog({ open, onOpenChange, user }: CreateUserDialogProps) {
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { data: yachtModels } = useYachtModels();
  const [changePassword, setChangePassword] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const isEditMode = !!user;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      department: "",
      roles: [],
      pm_yacht_models: [],
      is_active: true,
      change_password: false,
      new_password: "",
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        full_name: user.full_name,
        email: user.email,
        password: "",
        department: user.department,
        roles: user.roles,
        pm_yacht_models: user.pm_yacht_models || [],
        is_active: user.is_active,
        change_password: false,
        new_password: "",
      });
      setChangePassword(false);
    } else if (!user && open) {
      form.reset({
        full_name: "",
        email: "",
        password: "",
        department: "",
        roles: [],
        pm_yacht_models: [],
        is_active: true,
        change_password: false,
        new_password: "",
      });
    }
  }, [user, open, form]);

  const selectedRoles = form.watch("roles");
  const isPMSelected = selectedRoles?.includes("pm_engenharia");

  const onSubmit = (data: FormValues) => {
    if (isEditMode && user) {
      // Modo edição
      updateUser({
        user_id: user.id,
        full_name: data.full_name,
        department: data.department,
        roles: data.roles,
        pm_yacht_models: data.pm_yacht_models || [],
        is_active: data.is_active,
        new_password: data.change_password ? data.new_password : undefined,
      }, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    } else {
      // Modo criação
      createUser({
        email: data.email!,
        password: data.password!,
        full_name: data.full_name,
        department: data.department,
        roles: data.roles,
        pm_yacht_models: data.pm_yacht_models || [],
        is_active: data.is_active,
      }, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = isCreating || isUpdating || isDeleting;

  const handleDeleteUser = () => {
    if (user) {
      deleteUser(user.id, {
        onSuccess: () => {
          setShowDeleteAlert(false);
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Utilizador" : "Criar Novo Utilizador"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Atualize os dados do utilizador" 
                : "Preencha os dados para criar um novo utilizador no sistema"}
            </DialogDescription>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="joao@exemplo.com" 
                        {...field} 
                        disabled={isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="roles"
              render={() => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((role) => (
                      <FormField
                        key={role.value}
                        control={form.control}
                        name="roles"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={role.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, role.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== role.value
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {role.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modelos de Iates (apenas se PM Engenharia estiver selecionado) */}
            {isPMSelected && (
              <FormField
                control={form.control}
                name="pm_yacht_models"
                render={() => (
                  <FormItem className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Ship className="h-5 w-5 text-primary" />
                      <FormLabel className="text-base font-semibold">
                        Modelos Atribuídos (PM)
                      </FormLabel>
                    </div>
                    <FormDescription className="text-sm text-muted-foreground mb-3">
                      Selecione os modelos de iates que este PM será responsável
                    </FormDescription>
                    <div className="grid grid-cols-2 gap-3">
                      {yachtModels?.map((model) => (
                        <FormField
                          key={model.id}
                          control={form.control}
                          name="pm_yacht_models"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={model.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(model.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), model.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== model.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {model.code} - {model.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Utilizador Ativo</FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
                      O utilizador poderá fazer login no sistema
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-3">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Utilizador
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending 
                    ? (isEditMode ? "A guardar..." : "A criar...") 
                    : (isEditMode ? "Guardar Alterações" : "Criar Utilizador")
                  }
                </Button>
              </div>
            </div>
          </form>
        </Form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Utilizador</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Tem certeza que deseja excluir permanentemente o utilizador:
              </p>
              <p className="font-medium text-foreground">
                👤 {user?.full_name} ({user?.email})
              </p>
              <p>
                Esta ação não pode ser desfeita. Serão removidos:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Todas as roles e permissões</li>
                <li>Configurações de MFA</li>
                <li>Atribuições de PM</li>
                <li>Acesso ao sistema</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "A excluir..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FormDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
