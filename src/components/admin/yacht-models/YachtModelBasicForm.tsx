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
import { Upload, X, Loader2, Link2, Check, Star, Trash2, Search, AlertTriangle, Ship, Armchair } from "lucide-react";
import { Label } from "@/components/ui/label";
import { YachtModelFullValues } from "@/lib/schemas/yacht-model-schema";
import { CurrencyInput } from "@/components/ui/numeric-input";
import { AIUrlExtractor } from "./AIUrlExtractor";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface YachtModelBasicFormProps {
  form: UseFormReturn<YachtModelFullValues>;
}

export function YachtModelBasicForm({ form }: YachtModelBasicFormProps) {
  const { uploadImage, uploading } = useImageUpload();
  const [searchingExterior, setSearchingExterior] = useState(false);
  const [searchingInterior, setSearchingInterior] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  
  // Get current values from form
  const currentImageUrl = form.watch("image_url") || "";
  const currentExteriorImages = form.watch("exterior_images") || [];
  const currentInteriorImages = form.watch("interior_images") || [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'exterior' | 'interior') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, 'models');
    if (url) {
      if (category === 'exterior') {
        form.setValue("exterior_images", [...currentExteriorImages, url]);
      } else {
        form.setValue("interior_images", [...currentInteriorImages, url]);
      }
    }
  };

  const handleDataExtracted = (data: {
    brand: string | null;
    model: string | null;
    description: string | null;
    exteriorImages: string[];
    interiorImages: string[];
  }) => {
    if (data.brand) form.setValue("brand", data.brand);
    if (data.model) form.setValue("model", data.model);
    if (data.description) form.setValue("description", data.description);
    
    const brand = data.brand || form.getValues("brand");
    const model = data.model || form.getValues("model");
    if (brand && model) {
      form.setValue("name", `${brand} ${model}`);
    }

    // Set categorized images
    if (data.exteriorImages?.length > 0) {
      form.setValue("exterior_images", data.exteriorImages);
      // Set first exterior image as primary if none set
      if (!currentImageUrl) {
        form.setValue("image_url", data.exteriorImages[0]);
      }
    }
    if (data.interiorImages?.length > 0) {
      form.setValue("interior_images", data.interiorImages);
    }
  };

  const handleSearchMoreImages = async (category: 'exterior' | 'interior') => {
    const brand = form.getValues("brand");
    const model = form.getValues("model");
    
    if (!brand || !model) {
      toast.error("Preencha a Marca e Modelo primeiro");
      return;
    }

    const setSearching = category === 'exterior' ? setSearchingExterior : setSearchingInterior;
    setSearching(true);

    try {
      const categoryTerms = category === 'exterior' 
        ? 'exterior hull deck yacht boat' 
        : 'interior cabin saloon galley bedroom yacht';
      
      const { data, error } = await supabase.functions.invoke('search-product-images', {
        body: { 
          brand, 
          model,
          customQuery: `${brand} ${model} ${categoryTerms}`
        }
      });

      if (error) throw error;

      if (data?.images?.length > 0) {
        const currentImages = category === 'exterior' ? currentExteriorImages : currentInteriorImages;
        const newImages = [...new Set([...currentImages, ...data.images])];
        
        if (category === 'exterior') {
          form.setValue("exterior_images", newImages);
        } else {
          form.setValue("interior_images", newImages);
        }
        
        toast.success(`${data.images.length} novas imagens encontradas`);
      } else {
        toast.info("Nenhuma imagem adicional encontrada");
      }
    } catch (error) {
      console.error('Error searching images:', error);
      toast.error("Erro ao buscar imagens");
    } finally {
      setSearching(false);
    }
  };

  const handleSetAsPrimary = (url: string) => {
    form.setValue("image_url", url);
  };

  const handleRemoveImage = (url: string, category: 'exterior' | 'interior') => {
    if (category === 'exterior') {
      form.setValue("exterior_images", currentExteriorImages.filter(img => img !== url));
    } else {
      form.setValue("interior_images", currentInteriorImages.filter(img => img !== url));
    }
    
    // If removed image was primary, clear it
    if (currentImageUrl === url) {
      form.setValue("image_url", "");
    }
  };

  const handleRemovePrimary = () => {
    form.setValue("image_url", "");
  };

  const handleBrandModelChange = () => {
    const brand = form.getValues("brand");
    const model = form.getValues("model");
    if (brand && model) {
      form.setValue("name", `${brand} ${model}`);
    }
  };

  const exteriorCount = currentExteriorImages.length;
  const interiorCount = currentInteriorImages.length;
  const hasMinExterior = exteriorCount >= 6;
  const hasMinInterior = interiorCount >= 6;
  const hasPrimary = !!currentImageUrl;

  return (
    <div className="space-y-6">
      {/* AI URL Extractor */}
      <AIUrlExtractor onDataExtracted={handleDataExtracted} />

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
      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary fill-primary" />
          <Label className="text-base font-semibold">Imagem Principal</Label>
        </div>
        
        {currentImageUrl ? (
          <div className="relative max-w-md">
            <img
              src={currentImageUrl}
              alt="Imagem principal"
              className="w-full h-48 object-cover rounded-lg border-2 border-primary"
            />
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
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Clique no ★ em uma das fotos abaixo para definir como principal
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* FOTOS EXTERNAS */}
      <div className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-blue-500" />
            <Label className="text-base font-semibold">Fotos Externas</Label>
            <span className={cn(
              "text-sm px-2 py-0.5 rounded-full",
              hasMinExterior ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
            )}>
              {exteriorCount} selecionada{exteriorCount !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSearchMoreImages('exterior')}
            disabled={searchingExterior}
          >
            {searchingExterior ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar mais fotos
          </Button>
        </div>

        {!hasMinExterior && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Recomendado: mínimo 6 fotos externas. Faltam {6 - exteriorCount}.
            </AlertDescription>
          </Alert>
        )}

        {currentExteriorImages.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {currentExteriorImages.map((img, index) => {
              const isPrimary = currentImageUrl === img;
              return (
                <div
                  key={index}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 group",
                    isPrimary ? "border-primary ring-2 ring-primary/30" : "border-border"
                  )}
                >
                  <img
                    src={img}
                    alt={`Exterior ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  
                  {isPrimary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetAsPrimary(img)}
                        className="p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        title="Definir como principal"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img, 'exterior')}
                      className="p-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                      title="Remover"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
            <Ship className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma foto externa. Use "Buscar mais fotos" ou faça upload.</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleImageUpload(e, 'exterior')}
            disabled={uploading}
            className="flex-1"
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>

      {/* FOTOS INTERNAS */}
      <div className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Armchair className="h-5 w-5 text-amber-500" />
            <Label className="text-base font-semibold">Fotos Internas</Label>
            <span className={cn(
              "text-sm px-2 py-0.5 rounded-full",
              hasMinInterior ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
            )}>
              {interiorCount} selecionada{interiorCount !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSearchMoreImages('interior')}
            disabled={searchingInterior}
          >
            {searchingInterior ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar mais fotos
          </Button>
        </div>

        {!hasMinInterior && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Recomendado: mínimo 6 fotos internas. Faltam {6 - interiorCount}.
            </AlertDescription>
          </Alert>
        )}

        {currentInteriorImages.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {currentInteriorImages.map((img, index) => {
              const isPrimary = currentImageUrl === img;
              return (
                <div
                  key={index}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 group",
                    isPrimary ? "border-primary ring-2 ring-primary/30" : "border-border"
                  )}
                >
                  <img
                    src={img}
                    alt={`Interior ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  
                  {isPrimary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetAsPrimary(img)}
                        className="p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        title="Definir como principal"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img, 'interior')}
                      className="p-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                      title="Remover"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
            <Armchair className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma foto interna. Use "Buscar mais fotos" ou faça upload.</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleImageUpload(e, 'interior')}
            disabled={uploading}
            className="flex-1"
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
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
                Modelos inativos não aparecem no configurador
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
