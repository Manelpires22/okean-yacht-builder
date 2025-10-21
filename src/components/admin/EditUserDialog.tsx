import { useEffect, useState } from "react";
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
import { useUpdateUser } from "@/hooks/useUpdateUser";

const formSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  department: z.string().min(1, "Selecione um departamento"),
  roles: z.array(z.string()).min(1, "Selecione pelo menos uma role"),
  is_active: z.boolean(),
  change_password: z.boolean().default(false),
  new_password: z.string().optional(),
}).refine((data) => {
  if (data.change_password && (!data.new_password || data.new_password.length < 8)) {
    return false;
  }
  return true;
}, {
  message: "Password deve ter pelo menos 8 caracteres",
  path: ["new_password"],
});

type FormValues = z.infer<typeof formSchema>;

const ROLES = [
  { value: "administrador", label: "Administrador" },
  { value: "gerente_comercial", label: "Gerente Comercial" },
  { value: "comercial", label: "Comercial" },
  { value: "producao", label: "Produção" },
  { value: "financeiro", label: "Financeiro" },
];

const DEPARTMENTS = [
  "Comercial",
  "Produção",
  "Financeiro",
  "TI",
  "Direção",
];

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string;
    department: string;
    is_active: boolean;
    roles: string[];
  } | null;
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const { mutate: updateUser, isPending } = useUpdateUser();
  const [changePassword, setChangePassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      department: "",
      roles: [],
      is_active: true,
      change_password: false,
      new_password: "",
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        full_name: user.full_name,
        department: user.department,
        roles: user.roles,
        is_active: user.is_active,
        change_password: false,
        new_password: "",
      });
      setChangePassword(false);
    }
  }, [user, open, form]);

  const onSubmit = (data: FormValues) => {
    if (!user) return;

    updateUser({
      user_id: user.id,
      full_name: data.full_name,
      department: data.department,
      roles: data.roles,
      is_active: data.is_active,
      new_password: data.change_password ? data.new_password : undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Utilizador</DialogTitle>
          <DialogDescription>
            Atualizar dados de {user.email}
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="border-t pt-4">
              <FormField
                control={form.control}
                name="change_password"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setChangePassword(!!checked);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Alterar Password
                    </FormLabel>
                  </FormItem>
                )}
              />

              {changePassword && (
                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem className="mt-3">
                      <FormLabel>Nova Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function FormDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
