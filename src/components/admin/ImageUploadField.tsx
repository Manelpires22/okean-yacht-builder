import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Search, Trash2, Loader2, Check, ImageIcon } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  productName?: string;
  brand?: string;
  model?: string;
  folder: 'options' | 'models' | 'customizations';
  label?: string;
}

export function ImageUploadField({
  value,
  onChange,
  productName,
  brand,
  model,
  folder,
  label = "Imagem do Produto"
}: ImageUploadFieldProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [foundImages, setFoundImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, folder);
    if (url) {
      onChange(url);
      setFoundImages([]);
      setSelectedImage(null);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const buildSearchQuery = () => {
    const parts = [brand, model, productName, 'yacht marine equipment'].filter(Boolean);
    return parts.join(' ');
  };

  const handleSearchImages = async (customQuery?: string) => {
    const queryToUse = customQuery || buildSearchQuery();
    
    if (!queryToUse?.trim()) {
      toast({
        title: "Query necessária",
        description: "Preencha o nome do produto antes de buscar imagens",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setFoundImages([]);
    setSelectedImage(null);
    setSearchQuery(queryToUse);

    try {
      const { data, error } = await supabase.functions.invoke('search-product-images', {
        body: { productName, brand, model, customQuery: customQuery || undefined }
      });

      if (error) throw error;

      if (data?.images?.length > 0) {
        setFoundImages(data.images);
        setSelectedImage(data.images[0]);
        setShowQueryEditor(true);
        toast({
          title: "Imagens encontradas",
          description: `${data.images.length} imagens encontradas via Google`,
        });
      } else {
        setShowQueryEditor(true);
        toast({
          title: "Nenhuma imagem encontrada",
          description: "Tente editar a busca ou faça upload manual",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setShowQueryEditor(true);
      toast({
        title: "Erro na busca",
        description: error.message || "Erro ao buscar imagens",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseSelectedImage = () => {
    if (selectedImage) {
      onChange(selectedImage);
      setFoundImages([]);
      setSelectedImage(null);
    }
  };

  const handleRemoveImage = () => {
    onChange(undefined);
    setFoundImages([]);
    setSelectedImage(null);
    setShowQueryEditor(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Preview atual */}
      <div className="border rounded-lg p-4 bg-muted/30">
        {value ? (
          <div className="flex items-center justify-center">
            <img
              src={value}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-md border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            <ImageIcon className="h-8 w-8 mr-2" />
            <span className="text-sm">Nenhuma imagem selecionada</span>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Upload
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleSearchImages()}
          disabled={isSearching || !productName?.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Buscar com IA
        </Button>

        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      {/* Query Editor e Grid de imagens encontradas */}
      {showQueryEditor && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Imagens encontradas via Google</p>
            <span className="text-xs text-muted-foreground">{foundImages.length} resultados</span>
          </div>

          {/* Editable search query */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Edite a busca..."
              className="flex-1 h-9 px-3 text-sm border rounded-md bg-background"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSearchImages(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Regenerar
            </Button>
          </div>
          
          {foundImages.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {foundImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2 transition-all bg-muted",
                      selectedImage === img
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                  >
                    <img
                      src={img}
                      alt={`Resultado ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.crossOrigin) {
                          target.crossOrigin = '';
                          target.src = img;
                        }
                      }}
                    />
                    {selectedImage === img && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleUseSelectedImage}
                disabled={!selectedImage}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Usar Imagem Selecionada
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
