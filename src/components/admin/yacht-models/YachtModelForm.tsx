import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const yachtModelSchema = z.object({
  code: z.string()
    .min(1, "Código é obrigatório")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9-]+$/, "Código deve conter apenas letras maiúsculas, números e hífens"),
  
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  
  description: z.string().optional(),
  
  image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  
  base_price: z.string().optional(),
  
  base_delivery_days: z.string().optional(),
  
  is_active: z.boolean().default(true),
  
  technical_specifications: z.string().optional(),
});

export type YachtModelFormValues = z.infer<typeof yachtModelSchema>;

interface YachtModelFormProps {
  form: UseFormReturn<YachtModelFormValues>;
}

export function YachtModelForm({ form }: YachtModelFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Código *</FormLabel>
            <FormControl>
              <Input placeholder="FY-550" {...field} />
            </FormControl>
            <FormDescription>
              Código único do modelo (apenas letras maiúsculas, números e hífens)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome *</FormLabel>
            <FormControl>
              <Input placeholder="Ferretti Yachts 550" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Descrição comercial do modelo..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="image_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL da Imagem</FormLabel>
            <FormControl>
              <Input 
                placeholder="https://exemplo.com/imagem.jpg" 
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="base_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Base (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  placeholder="A definir"
                  {...field}
                />
              </FormControl>
              <FormDescription>Opcional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="base_delivery_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo (dias)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  placeholder="A definir"
                  {...field}
                />
              </FormControl>
              <FormDescription>Opcional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="technical_specifications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Especificações Técnicas (JSON)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder='{"especificacoes_tecnicas": {...}, "memorial_descritivo": {...}}'
                className="min-h-[150px] font-mono text-xs"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Formato JSON com especificações técnicas e memorial descritivo
            </FormDescription>
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
              <FormLabel className="text-base">Status</FormLabel>
              <FormDescription>
                Modelo ativo e disponível para cotação
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
    </div>
  );
}
