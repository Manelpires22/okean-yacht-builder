import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Upload, X, AlertCircle } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "sonner";

const MIN_ITEM_NAME_CHARS = 5;
const MIN_FREE_CUSTOMIZATION_CHARS = 100;

interface FreeCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    item_name: string;
    notes: string;
    image_url?: string;
  }) => void;
}

export function FreeCustomizationDialog({
  open,
  onOpenChange,
  onSave,
}: FreeCustomizationDialogProps) {
  const [itemName, setItemName] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const { uploadImage } = useImageUpload();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file, "customizations");
      if (url) {
        setImageUrl(url);
        toast.success("Imagem enviada com sucesso");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
  };

  const handleSave = () => {
    const trimmedName = itemName.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName || !trimmedNotes) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (trimmedName.length < MIN_ITEM_NAME_CHARS) {
      toast.error(`O nome deve ter no mínimo ${MIN_ITEM_NAME_CHARS} caracteres`);
      return;
    }

    if (trimmedNotes.length < MIN_FREE_CUSTOMIZATION_CHARS) {
      toast.error(`A descrição deve ter no mínimo ${MIN_FREE_CUSTOMIZATION_CHARS} caracteres para análise do PM`);
      return;
    }

    onSave({
      item_name: trimmedName,
      notes: trimmedNotes,
      image_url: imageUrl,
    });

    // Reset form
    setItemName("");
    setNotes("");
    setImageUrl(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setItemName("");
    setNotes("");
    setImageUrl(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Customização</DialogTitle>
          <DialogDescription>
            Descreva uma customização não prevista que você gostaria de adicionar ao iate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Esta customização será analisada pela equipe técnica</strong>, que fornecerá orçamento e prazo adicionais. A cotação ficará pendente de validação técnica.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="item-name">
              Nome da Customização <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item-name"
              placeholder="Ex: Banheira de hidromassagem no flybridge"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              maxLength={200}
            />
            <div className="flex items-center justify-between text-xs">
              <div className={itemName.trim().length < MIN_ITEM_NAME_CHARS ? "text-destructive flex items-center gap-1" : "text-muted-foreground"}>
                {itemName.trim().length < MIN_ITEM_NAME_CHARS && (
                  <AlertCircle className="h-3 w-3" />
                )}
                Mínimo: {MIN_ITEM_NAME_CHARS} caracteres
              </div>
              <span className="text-muted-foreground">
                {itemName.length}/200 caracteres
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição Detalhada <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva em detalhes o que você gostaria de adicionar ou modificar no iate..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              maxLength={2000}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs">
              <div className={notes.trim().length < MIN_FREE_CUSTOMIZATION_CHARS ? "text-destructive flex items-center gap-1" : "text-muted-foreground"}>
                {notes.trim().length < MIN_FREE_CUSTOMIZATION_CHARS && (
                  <AlertCircle className="h-3 w-3" />
                )}
                Mínimo: {MIN_FREE_CUSTOMIZATION_CHARS} caracteres
              </div>
              <span className="text-muted-foreground">
                {notes.length}/2000 caracteres
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Foto de Referência (opcional)</Label>
            
            {!imageUrl ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? "Enviando..." : "Clique para fazer upload de uma imagem"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG até 5MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview da customização"
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={
              !itemName.trim() || 
              !notes.trim() || 
              itemName.trim().length < MIN_ITEM_NAME_CHARS ||
              notes.trim().length < MIN_FREE_CUSTOMIZATION_CHARS ||
              isUploading
            }
          >
            Adicionar Customização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}