import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  department: z.string().min(2, "Departamento deve ter no mínimo 2 caracteres").max(50, "Departamento muito longo"),
  email: z.string().email("Email inválido").optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
