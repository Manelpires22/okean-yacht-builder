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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { YachtModelFullValues } from "@/lib/schemas/yacht-model-schema";

interface YachtModelSpecsFormProps {
  form: UseFormReturn<YachtModelFullValues>;
}

export function YachtModelSpecsForm({ form }: YachtModelSpecsFormProps) {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={["dimensions"]} className="w-full">
        <AccordionItem value="dimensions">
          <AccordionTrigger className="text-lg font-semibold">
            📐 Dimensões
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormField
                control={form.control}
                name="length_overall"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comprimento Total (m)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 16.72" {...field} />
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
                      <Input placeholder="Ex: 4.95" {...field} />
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
                      <Input placeholder="Ex: 1.35" {...field} />
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
                      <Input placeholder="Ex: 4.20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="weights">
          <AccordionTrigger className="text-lg font-semibold">
            ⚖️ Pesos e Capacidades
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormField
                control={form.control}
                name="dry_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Seco (kg)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 28500" {...field} />
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
                      <Input placeholder="Ex: 1800" {...field} />
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
                      <Input placeholder="Ex: 450" {...field} />
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
                      <Input placeholder="Ex: 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="performance">
          <AccordionTrigger className="text-lg font-semibold">
            ⚡ Performance
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormField
                control={form.control}
                name="max_speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Velocidade Máxima (nós)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 32" {...field} />
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
                      <Input placeholder="Ex: 28" {...field} />
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
                      <Input placeholder="Ex: 360" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <FormDescription className="text-center">
        Todos os campos são opcionais e podem ser preenchidos posteriormente
      </FormDescription>
    </div>
  );
}
