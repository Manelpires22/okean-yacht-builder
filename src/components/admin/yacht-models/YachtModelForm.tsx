import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
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
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export const yachtModelSchema = z.object({
  code: z.string()
    .min(1, "Código é obrigatório")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9-]+$/, "Código deve conter apenas letras maiúsculas, números e hífens"),
  
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  
  description: z.string().optional(),
  
  image_url: z.string().optional(),
  
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
  const { uploadImage, uploading } = useImageUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(form.getValues("image_url") || null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, 'models');
    if (url) {
      form.setValue("image_url", url);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    form.setValue("image_url", "");
    setPreviewUrl(null);
  };

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

      <div className="space-y-2">
        <Label>Imagem do Modelo</Label>
        <div className="flex flex-col gap-4">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Clique para fazer upload de uma imagem
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WEBP (máx. 5MB)
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              className="flex-1"
            />
            {uploading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

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
