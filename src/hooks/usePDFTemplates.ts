import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PDFTemplate, PDFTemplateJSON, DocumentType, TemplateStatus } from "@/types/pdf-builder";

// Helper to cast Supabase response to our types
function mapTemplate(row: Record<string, unknown>): PDFTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    document_type: row.document_type as DocumentType,
    branding: row.branding as string,
    description: row.description as string | null,
    template_json: row.template_json as PDFTemplateJSON,
    version: row.version as number,
    status: row.status as TemplateStatus,
    is_default: row.is_default as boolean,
    created_by: row.created_by as string | null,
    updated_by: row.updated_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function usePDFTemplates() {
  return useQuery({
    queryKey: ["pdf-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_templates")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapTemplate);
    },
  });
}

export function usePDFTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["pdf-template", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("pdf_templates")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapTemplate(data) : null;
    },
    enabled: !!id,
  });
}

interface CreateTemplateInput {
  name: string;
  document_type: DocumentType;
  description?: string;
  branding?: string;
}

export function useCreatePDFTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      const defaultBlocks = getDefaultBlocksForType(input.document_type);
      
      const { data, error } = await supabase
        .from("pdf_templates")
        .insert({
          name: input.name,
          document_type: input.document_type,
          description: input.description || null,
          branding: input.branding || "OKEAN",
          template_json: {
            blocks: defaultBlocks,
            settings: {
              margins: { top: 20, right: 15, bottom: 20, left: 15 },
              showPageNumbers: true,
              showConfidentialityNote: true,
              language: "pt-BR",
            },
          },
          created_by: user.user?.id,
          updated_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Erro ao criar template");
    },
  });
}

interface UpdateTemplateInput {
  id: string;
  name?: string;
  description?: string;
  status?: TemplateStatus;
  is_default?: boolean;
  template_json?: PDFTemplateJSON;
}

export function useUpdatePDFTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, template_json, ...updates }: UpdateTemplateInput) => {
      const { data: user } = await supabase.auth.getUser();

      const updatePayload: Record<string, unknown> = {
        ...updates,
        updated_by: user.user?.id,
        updated_at: new Date().toISOString(),
      };

      // Cast template_json to Json type for Supabase
      if (template_json) {
        updatePayload.template_json = template_json as unknown;
      }

      const { data, error } = await supabase
        .from("pdf_templates")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapTemplate(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      queryClient.invalidateQueries({ queryKey: ["pdf-template", data.id] });
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Erro ao atualizar template");
    },
  });
}

export function useDeletePDFTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pdf_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      toast.success("Template excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Erro ao excluir template");
    },
  });
}

export function useDuplicatePDFTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch original template
      const { data: original, error: fetchError } = await supabase
        .from("pdf_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data: user } = await supabase.auth.getUser();

      // Create copy
      const { data, error } = await supabase
        .from("pdf_templates")
        .insert({
          name: `${original.name} (Cópia)`,
          document_type: original.document_type,
          description: original.description,
          branding: original.branding,
          template_json: original.template_json,
          status: "draft",
          is_default: false,
          created_by: user.user?.id,
          updated_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      toast.success("Template duplicado com sucesso!");
    },
    onError: (error) => {
      console.error("Error duplicating template:", error);
      toast.error("Erro ao duplicar template");
    },
  });
}

// Helper to generate default blocks based on document type
function getDefaultBlocksForType(documentType: DocumentType) {
  const baseBlocks = [
    { id: crypto.randomUUID(), type: "header", label: "Cabeçalho", order: 0, visible: true, config: { showLogo: true, showCNPJ: true } },
    { id: crypto.randomUUID(), type: "buyer", label: "Comprador", order: 1, visible: true, config: {} },
    { id: crypto.randomUUID(), type: "boat", label: "Barco", order: 2, visible: true, config: {} },
  ];

  switch (documentType) {
    case "quotation":
      return [
        ...baseBlocks,
        { id: crypto.randomUUID(), type: "technical_panel", label: "Painel Técnico", order: 3, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "memorial", label: "Memorial Descritivo", order: 4, visible: true, config: { columns: 2 } },
        { id: crypto.randomUUID(), type: "upgrades", label: "Upgrades", order: 5, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "options", label: "Opcionais", order: 6, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "customizations", label: "Customizações", order: 7, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "financial_summary", label: "Resumo Financeiro", order: 8, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "signatures", label: "Assinaturas", order: 9, visible: true, config: {} },
      ];
    case "ato":
      return [
        ...baseBlocks,
        { id: crypto.randomUUID(), type: "upgrades", label: "Upgrades", order: 3, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "options", label: "Opcionais", order: 4, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "customizations", label: "Customizações", order: 5, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "financial_summary", label: "Resumo Financeiro", order: 6, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "signatures", label: "Assinaturas", order: 7, visible: true, config: {} },
      ];
    case "consolidated":
      return [
        ...baseBlocks,
        { id: crypto.randomUUID(), type: "technical_panel", label: "Painel Técnico", order: 3, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "memorial", label: "Memorial Descritivo", order: 4, visible: true, config: { columns: 2 } },
        { id: crypto.randomUUID(), type: "upgrades", label: "Upgrades", order: 5, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "options", label: "Opcionais", order: 6, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "customizations", label: "Customizações", order: 7, visible: true, config: { showPrices: true } },
        { id: crypto.randomUUID(), type: "notes", label: "ATOs Incorporados", order: 8, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "financial_summary", label: "Resumo Financeiro", order: 9, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "signatures", label: "Assinaturas", order: 10, visible: true, config: {} },
      ];
    case "memorial":
      return [
        { id: crypto.randomUUID(), type: "header", label: "Cabeçalho", order: 0, visible: true, config: { showLogo: true } },
        { id: crypto.randomUUID(), type: "boat", label: "Barco", order: 1, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "technical_panel", label: "Painel Técnico", order: 2, visible: true, config: {} },
        { id: crypto.randomUUID(), type: "memorial", label: "Memorial Descritivo", order: 3, visible: true, config: { columns: 2, showPrices: false } },
        { id: crypto.randomUUID(), type: "notes", label: "Observações", order: 4, visible: true, config: {} },
      ];
    default:
      return baseBlocks;
  }
}
