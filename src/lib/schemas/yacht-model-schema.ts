import { z } from "zod";

// Schema para Dados Básicos
export const yachtModelBasicSchema = z.object({
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
  
  registration_number: z.string()
    .max(50, "Matrícula deve ter no máximo 50 caracteres")
    .optional(),
  
  delivery_date: z.string().optional(), // ISO date string (YYYY-MM-DD)
  
  is_active: z.boolean().default(true),
});

// Schema para Especificações Técnicas
export const yachtModelSpecsSchema = z.object({
  // Dimensões
  length_overall: z.string().optional(),
  beam: z.string().optional(),
  draft: z.string().optional(),
  height_from_waterline: z.string().optional(),
  
  // Pesos e Capacidades
  dry_weight: z.string().optional(),
  fuel_capacity: z.string().optional(),
  water_capacity: z.string().optional(),
  passengers_capacity: z.string().optional(),
  
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
