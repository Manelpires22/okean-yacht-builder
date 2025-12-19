import { UseFormReturn } from "react-hook-form";
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
import { Upload, X, Loader2, Link2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { YachtModelFullValues } from "@/lib/schemas/yacht-model-schema";
import { CurrencyInput } from "@/components/ui/numeric-input";
import { AIUrlExtractor } from "./AIUrlExtractor";
import { cn } from "@/lib/utils";

interface YachtModelBasicFormProps {
  form: UseFormReturn<YachtModelFullValues>;
  onSpecsExtracted?: (specs: Record<string, any>) => void;
}

export function YachtModelBasicForm({ form, onSpecsExtracted }: YachtModelBasicFormProps) {
  const { uploadImage, uploading } = useImageUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(form.getValues("image_url") || null);
  const [foundImages, setFoundImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

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

  const handleImageUrlSet = () => {
    if (imageUrlInput.trim()) {
      form.setValue("image_url", imageUrlInput.trim());
      setPreviewUrl(imageUrlInput.trim());
      setImageUrlInput("");
    }
  };

  const handleSelectFoundImage = (url: string) => {
    form.setValue("image_url", url);
    setPreviewUrl(url);
  };

  const handleDataExtracted = (data: any) => {
    // Fill basic fields
    if (data.brand) form.setValue("brand", data.brand);
    if (data.model) form.setValue("model", data.model);
    if (data.description) form.setValue("description", data.description);
    
    // Auto-generate name from brand + model if both exist
    const brand = data.brand || form.getValues("brand");
    const model = data.model || form.getValues("model");
    if (brand && model) {
      form.setValue("name", `${brand} ${model}`);
    }

    // Pass specs to parent if callback provided
    if (data.specifications && onSpecsExtracted) {
      onSpecsExtracted(data.specifications);
    }
  };

  const handleImagesFound = (images: string[]) => {
    setFoundImages(images);
    // Auto-select first image if no image is set
    if (images.length > 0 && !previewUrl) {
      handleSelectFoundImage(images[0]);
    }
  };

  // Watch brand and model to auto-update name
  const watchBrand = form.watch("brand");
  const watchModel = form.watch("model");

  const handleBrandModelChange = () => {
    const brand = form.getValues("brand");
    const model = form.getValues("model");
    if (brand && model) {
      form.setValue("name", `${brand} ${model}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI URL Extractor */}
      <AIUrlExtractor
        onDataExtracted={handleDataExtracted}
        onImagesFound={handleImagesFound}
        includeSpecs={true}
      />

      {/* Código */}
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Código *</FormLabel>
            <FormControl>
              <Input placeholder="OKEAN57" {...field} />
            </FormControl>
            <FormDescription>
              Código único do modelo (apenas letras maiúsculas, números e hífens)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Marca e Modelo lado a lado */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input 
                  placeholder="OKEAN" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setTimeout(handleBrandModelChange, 0);
                  }}
                />
              </FormControl>
              <FormDescription>Nome do fabricante</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="57" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setTimeout(handleBrandModelChange, 0);
                  }}
                />
              </FormControl>
              <FormDescription>Nome/número do modelo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Nome (gerado automaticamente) */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Completo *</FormLabel>
            <FormControl>
              <Input placeholder="OKEAN 57" {...field} />
            </FormControl>
            <FormDescription>
              Nome completo do modelo (preenchido automaticamente a partir de Marca + Modelo)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Descrição */}
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

      {/* Imagem do Modelo */}
      <div className="space-y-4">
        <Label>Imagem do Modelo</Label>
        
        {/* Preview atual */}
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
              Faça upload, cole uma URL ou extraia com IA
            </p>
          </div>
        )}

        {/* Grid de imagens encontradas pela IA */}
        {foundImages.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Imagens encontradas via IA</Label>
            <div className="grid grid-cols-4 gap-2">
              {foundImages.slice(0, 8).map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectFoundImage(img)}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                    previewUrl === img 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <img
                    src={img}
                    alt={`Opção ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {previewUrl === img && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Opções de upload */}
        <div className="flex flex-col gap-2">
          {/* Upload de arquivo */}
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

          {/* URL direta */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cole uma URL de imagem..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleImageUrlSet();
                  }
                }}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleImageUrlSet}
              disabled={!imageUrlInput.trim()}
            >
              Usar URL
            </Button>
          </div>
        </div>
      </div>

      {/* Preço Base */}
      <FormField
        control={form.control}
        name="base_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço Base (R$)</FormLabel>
            <FormControl>
              <CurrencyInput {...field} />
            </FormControl>
            <FormDescription>Opcional - Digite da direita para esquerda</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Status */}
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
