import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInternalUser, DepartmentType } from "@/hooks/useInternalUsers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const internalUserSchema = z.object({
  user_id: z.string().uuid("Selecione um usuário"),
  department: z.enum(['commercial', 'engineering', 'supply', 'planning', 'backoffice']),
  role_specialty: z.string().min(1, "Especialidade é obrigatória"),
});

type InternalUserFormValues = z.infer<typeof internalUserSchema>;

interface CreateInternalUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEPARTMENTS: { value: DepartmentType; label: string }[] = [
  { value: 'commercial', label: 'Comercial' },
  { value: 'engineering', label: 'Engenharia' },
  { value: 'supply', label: 'Supply' },
  { value: 'planning', label: 'Planejamento' },
  { value: 'backoffice', label: 'Back Office' },
];

const ROLE_SPECIALTIES: Record<DepartmentType, { value: string; label: string }[]> = {
  commercial: [
    { value: 'director', label: 'Diretor' },
    { value: 'manager', label: 'Gerente' },
  ],
  engineering: [
    { value: 'pm', label: 'Project Manager (PM)' },
    { value: 'engineer', label: 'Engenheiro' },
  ],
  supply: [
    { value: 'buyer', label: 'Comprador' },
    { value: 'manager', label: 'Gerente' },
  ],
  planning: [
    { value: 'planner', label: 'Planejador' },
    { value: 'manager', label: 'Gerente' },
  ],
  backoffice: [
    { value: 'assistant', label: 'Assistente' },
    { value: 'manager', label: 'Gerente' },
  ],
};

export function CreateInternalUserDialog({ open, onOpenChange }: CreateInternalUserDialogProps) {
  const { mutate: createInternalUser, isPending } = useCreateInternalUser();

  const form = useForm<InternalUserFormValues>({
    resolver: zodResolver(internalUserSchema),
    defaultValues: {
      user_id: "",
      department: "engineering",
      role_specialty: "",
    },
  });

  const selectedDepartment = form.watch("department");

  // Buscar usuários que ainda não são internos
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users-for-internal'],
    queryFn: async () => {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('is_active', true);

      const { data: internalUsers } = await supabase
        .from('internal_users' as any)
        .select('user_id');

      const internalUserIds = new Set((internalUsers as any)?.map((iu: any) => iu.user_id) || []);
      
      return allUsers?.filter(user => !internalUserIds.has(user.id)) || [];
    }
  });

  const onSubmit = (data: InternalUserFormValues) => {
    createInternalUser({
      user_id: data.user_id,
      department: data.department,
      role_specialty: data.role_specialty,
    }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Usuário Interno</DialogTitle>
          <DialogDescription>
            Adicionar um usuário existente como usuário interno de departamento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Apenas usuários que ainda não são internos
                  </FormDescription>
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
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("role_specialty", ""); // Reset specialty
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma especialidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_SPECIALTIES[selectedDepartment]?.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Especialidade dentro do departamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Criando..." : "Criar Usuário Interno"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
