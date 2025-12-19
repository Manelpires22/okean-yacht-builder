import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
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
import { Upload, X, Loader2, Link2, Check, Star, GripVertical, Trash2 } from "lucide-react";
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
  const [foundImages, setFoundImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  
  // Get current values from form
  const currentImageUrl = form.watch("image_url") || "";
  const currentGalleryImages = form.watch("gallery_images") || [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, 'models');
    if (url) {
      // If no primary image, set as primary
      if (!currentImageUrl) {
        form.setValue("image_url", url);
      } else {
        // Add to gallery
        form.setValue("gallery_images", [...currentGalleryImages, url]);
      }
    }
  };

  const handleImageUrlSet = () => {
    if (imageUrlInput.trim()) {
      const url = imageUrlInput.trim();
      if (!currentImageUrl) {
        form.setValue("image_url", url);
      } else {
        form.setValue("gallery_images", [...currentGalleryImages, url]);
      }
      setImageUrlInput("");
    }
  };

  // Toggle image selection (add/remove from gallery or set as primary)
  const handleToggleImage = (url: string) => {
    const isPrimary = currentImageUrl === url;
    const inGallery = currentGalleryImages.includes(url);

    if (isPrimary) {
      // If primary, move to gallery first image and remove from primary
      if (currentGalleryImages.length > 0) {
        form.setValue("image_url", currentGalleryImages[0]);
        form.setValue("gallery_images", currentGalleryImages.slice(1));
      } else {
        form.setValue("image_url", "");
      }
    } else if (inGallery) {
      // Remove from gallery
      form.setValue("gallery_images", currentGalleryImages.filter(img => img !== url));
    } else {
      // Add to selection
      if (!currentImageUrl) {
        // No primary yet, set as primary
        form.setValue("image_url", url);
      } else {
        // Add to gallery
        form.setValue("gallery_images", [...currentGalleryImages, url]);
      }
    }
  };

  // Set as primary image
  const handleSetAsPrimary = (url: string) => {
    const oldPrimary = currentImageUrl;
    const newGallery = currentGalleryImages.filter(img => img !== url);
    
    // If there was an old primary, add it to gallery
    if (oldPrimary && oldPrimary !== url) {
      newGallery.unshift(oldPrimary);
    }
    
    form.setValue("image_url", url);
    form.setValue("gallery_images", newGallery);
  };

  // Remove from gallery
  const handleRemoveFromGallery = (url: string) => {
    form.setValue("gallery_images", currentGalleryImages.filter(img => img !== url));
  };

  // Remove primary image
  const handleRemovePrimary = () => {
    if (currentGalleryImages.length > 0) {
      form.setValue("image_url", currentGalleryImages[0]);
      form.setValue("gallery_images", currentGalleryImages.slice(1));
    } else {
      form.setValue("image_url", "");
    }
  };

  const handleDataExtracted = (data: any) => {
    if (data.brand) form.setValue("brand", data.brand);
    if (data.model) form.setValue("model", data.model);
    if (data.description) form.setValue("description", data.description);
    
    const brand = data.brand || form.getValues("brand");
    const model = data.model || form.getValues("model");
    if (brand && model) {
      form.setValue("name", `${brand} ${model}`);
    }

    if (data.specifications && onSpecsExtracted) {
      onSpecsExtracted(data.specifications);
    }
  };

  const handleImagesFound = (images: string[]) => {
    setFoundImages(images);
    // Auto-select first image if no image is set
    if (images.length > 0 && !currentImageUrl) {
      form.setValue("image_url", images[0]);
    }
  };

  const handleBrandModelChange = () => {
    const brand = form.getValues("brand");
    const model = form.getValues("model");
    if (brand && model) {
      form.setValue("name", `${brand} ${model}`);
    }
  };

  // Check if image is selected (primary or gallery)
  const isImageSelected = (url: string) => {
    return currentImageUrl === url || currentGalleryImages.includes(url);
  };

  // Count selected images
  const selectedCount = (currentImageUrl ? 1 : 0) + currentGalleryImages.length;

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

      {/* Imagem Principal */}
      <div className="space-y-4">
        <Label>Imagem Principal</Label>
        
        {currentImageUrl ? (
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="Imagem principal"
              className="w-full h-48 object-cover rounded-lg border-2 border-primary"
            />
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              Principal
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemovePrimary}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma imagem principal selecionada
            </p>
          </div>
        )}
      </div>

      {/* Grid de imagens encontradas pela IA */}
      {foundImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Imagens encontradas via IA</Label>
            <span className="text-xs text-muted-foreground">
              {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''} • Clique para selecionar • ★ para definir como principal
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {foundImages.slice(0, 12).map((img, index) => {
              const isPrimary = currentImageUrl === img;
              const isSelected = isImageSelected(img);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all group",
                    isPrimary 
                      ? "border-primary ring-2 ring-primary/30" 
                      : isSelected 
                        ? "border-primary/70 ring-1 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleImage(img)}
                    className="w-full h-full"
                  >
                    <img
                      src={img}
                      alt={`Opção ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    
                    {/* Selection overlay */}
                    {isSelected && (
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        isPrimary ? "bg-primary/30" : "bg-primary/20"
                      )}>
                        <Check className={cn(
                          "h-6 w-6",
                          isPrimary ? "text-primary-foreground" : "text-primary"
                        )} />
                      </div>
                    )}
                  </button>
                  
                  {/* Star button to set as primary */}
                  {isSelected && !isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetAsPrimary(img);
                      }}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
                      title="Definir como principal"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  
                  {/* Primary badge */}
                  {isPrimary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Galeria de Imagens Selecionadas */}
      {currentGalleryImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Galeria de Imagens ({currentGalleryImages.length})</Label>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {currentGalleryImages.map((img, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg overflow-hidden border group"
              >
                <img
                  src={img}
                  alt={`Galeria ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetAsPrimary(img)}
                    className="p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    title="Definir como principal"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromGallery(img)}
                    className="p-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                    title="Remover da galeria"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Opções de upload */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm text-muted-foreground">Adicionar imagem</Label>
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