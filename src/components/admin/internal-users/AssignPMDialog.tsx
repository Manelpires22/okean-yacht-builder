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
import { useAssignPMToModel, useInternalUsers } from "@/hooks/useInternalUsers";
import { useYachtModels } from "@/hooks/useYachtModels";

const assignmentSchema = z.object({
  pm_user_id: z.string().uuid("Selecione um PM"),
  yacht_model_id: z.string().uuid("Selecione um modelo"),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignPMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPMDialog({ open, onOpenChange }: AssignPMDialogProps) {
  const { mutate: assignPM, isPending } = useAssignPMToModel();
  const { data: internalUsers } = useInternalUsers();
  const { data: yachtModels } = useYachtModels();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      pm_user_id: "",
      yacht_model_id: "",
    },
  });

  // Filtrar apenas PMs
  const pms = internalUsers?.filter(
    u => u.role_specialty === 'pm' && u.department === 'engineering'
  );

  const onSubmit = (data: AssignmentFormValues) => {
    assignPM({
      pm_user_id: data.pm_user_id,
      yacht_model_id: data.yacht_model_id,
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
          <DialogTitle>Atribuir PM a Modelo</DialogTitle>
          <DialogDescription>
            Cada modelo de iate deve ter apenas um PM responsável
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pm_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Manager (PM)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um PM" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pms?.map((pm) => (
                        <SelectItem key={pm.user_id} value={pm.user_id}>
                          {pm.user?.full_name} ({pm.user?.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    PM de Engenharia responsável pelo modelo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yacht_model_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo de Iate</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {yachtModels?.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Modelo que será atribuído ao PM
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
                {isPending ? "Atribuindo..." : "Atribuir PM"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
