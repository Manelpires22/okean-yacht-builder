import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YachtModelFullValues } from "@/lib/schemas/yacht-model-schema";

interface YachtModelSpecsFormProps {
  form: UseFormReturn<YachtModelFullValues>;
}

export function YachtModelSpecsForm({ form }: YachtModelSpecsFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📐</span>
            Dimensões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="length_overall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprimento Total (m)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 12.8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="beam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Largura (m)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 4.2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="draft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calado (m)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 1.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="height_from_waterline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura da Linha d'Água (m)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 3.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚖️</span>
            Pesos e Capacidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dry_weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso a Seco (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 8500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fuel_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidade de Combustível (L)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 1200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="water_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidade de Água (L)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="passengers_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidade de Passageiros</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚡</span>
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="max_speed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Velocidade Máxima (nós)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="Ex: 42" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cruise_speed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Velocidade de Cruzeiro (nós)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="Ex: 28" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="range_nautical_miles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autonomia (milhas náuticas)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 350" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <FormDescription className="text-sm text-muted-foreground">
        Todos os campos de especificações técnicas são opcionais e podem ser preenchidos conforme disponibilidade.
      </FormDescription>
    </div>
  );
}
