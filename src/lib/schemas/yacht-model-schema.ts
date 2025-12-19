import { z } from "zod";

// Schema para Dados Básicos
export const yachtModelBasicSchema = z.object({
  code: z.string()
    .min(1, "Código é obrigatório")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9-]+$/, "Código deve conter apenas letras maiúsculas, números e hífens"),
  
  brand: z.string()
    .min(1, "Marca é obrigatória")
    .max(100, "Marca deve ter no máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  
  model: z.string()
    .min(1, "Modelo é obrigatório")
    .max(100, "Modelo deve ter no máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  
  description: z.string().optional(),
  
  image_url: z.string().optional(),
  
  base_price: z.string().optional(),
  
  is_active: z.boolean().default(true),
});

// Schema para Especificações Técnicas
export const yachtModelSpecsSchema = z.object({
  // Dimensões
  length_overall: z.string().optional(),
  hull_length: z.string().optional(),
  beam: z.string().optional(),
  draft: z.string().optional(),
  height_from_waterline: z.string().optional(),
  
  // Pesos e Deslocamento
  dry_weight: z.string().optional(),
  displacement_light: z.string().optional(),
  displacement_loaded: z.string().optional(),
  
  // Capacidades
  fuel_capacity: z.string().optional(),
  water_capacity: z.string().optional(),
  passengers_capacity: z.string().optional(),
  cabins: z.string().optional(),
  bathrooms: z.string().optional(),
  
  // Motorização
  engines: z.string().optional(),
  hull_color: z.string().optional(),
  
  // Performance
  max_speed: z.string().optional(),
  cruise_speed: z.string().optional(),
  range_nautical_miles: z.string().optional(),
});

// Schema completo (união dos dois)
export const yachtModelFullSchema = yachtModelBasicSchema.merge(yachtModelSpecsSchema);

export type YachtModelBasicValues = z.infer<typeof yachtModelBasicSchema>;
export type YachtModelSpecsValues = z.infer<typeof yachtModelSpecsSchema>;
export type YachtModelFullValues = z.infer<typeof yachtModelFullSchema>;
