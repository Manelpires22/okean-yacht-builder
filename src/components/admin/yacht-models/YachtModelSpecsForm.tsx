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
import { 
  MeterInput, 
  KilogramInput, 
  LiterInput, 
  KnotInput, 
  NauticalMileInput,
  NumericInput 
} from "@/components/ui/numeric-input";
import { SpecsUrlExtractor } from "./SpecsUrlExtractor";
import { toast } from "sonner";

interface YachtModelSpecsFormProps {
  form: UseFormReturn<YachtModelFullValues>;
}

export function YachtModelSpecsForm({ form }: YachtModelSpecsFormProps) {
  const handleSpecsExtracted = (data: { specifications: Record<string, number | string> }) => {
    const specs = data.specifications;
    if (!specs || Object.keys(specs).length === 0) {
      toast.info("Nenhuma especificação técnica encontrada na URL");
      return;
    }

    let fieldsUpdated = 0;

    // Dimensões
    if (specs.length_overall) {
      form.setValue("length_overall", String(specs.length_overall));
      fieldsUpdated++;
    }
    if (specs.hull_length) {
      form.setValue("hull_length", String(specs.hull_length));
      fieldsUpdated++;
    }
    if (specs.beam) {
      form.setValue("beam", String(specs.beam));
      fieldsUpdated++;
    }
    if (specs.draft) {
      form.setValue("draft", String(specs.draft));
      fieldsUpdated++;
    }
    if (specs.height_from_waterline) {
      form.setValue("height_from_waterline", String(specs.height_from_waterline));
      fieldsUpdated++;
    }

    // Pesos
    if (specs.displacement_light) {
      form.setValue("displacement_light", String(specs.displacement_light));
      fieldsUpdated++;
    }
    if (specs.displacement_loaded) {
      form.setValue("displacement_loaded", String(specs.displacement_loaded));
      fieldsUpdated++;
    }
    if (specs.dry_weight) {
      form.setValue("dry_weight", String(specs.dry_weight));
      fieldsUpdated++;
    }

    // Capacidades
    if (specs.fuel_capacity) {
      form.setValue("fuel_capacity", String(specs.fuel_capacity));
      fieldsUpdated++;
    }
    if (specs.water_capacity) {
      form.setValue("water_capacity", String(specs.water_capacity));
      fieldsUpdated++;
    }
    if (specs.passengers_capacity) {
      form.setValue("passengers_capacity", String(specs.passengers_capacity));
      fieldsUpdated++;
    }
    if (specs.cabins) {
      form.setValue("cabins", String(specs.cabins));
      fieldsUpdated++;
    }
    if (specs.bathrooms) {
      form.setValue("bathrooms", String(specs.bathrooms));
      fieldsUpdated++;
    }

    // Performance
    if (specs.max_speed) {
      form.setValue("max_speed", String(specs.max_speed));
      fieldsUpdated++;
    }
    if (specs.cruise_speed) {
      form.setValue("cruise_speed", String(specs.cruise_speed));
      fieldsUpdated++;
    }
    if (specs.range_nautical_miles) {
      form.setValue("range_nautical_miles", String(specs.range_nautical_miles));
      fieldsUpdated++;
    }

    if (fieldsUpdated > 0) {
      toast.success(`${fieldsUpdated} campo(s) de especificações preenchido(s)`);
    } else {
      toast.info("Nenhum campo de especificação foi atualizado");
    }
  };

  return (
    <div className="space-y-6">
      {/* Extrator de specs */}
      <SpecsUrlExtractor 
        onDataExtracted={handleSpecsExtracted}
        className="mb-4"
      />

      <Accordion type="multiple" defaultValue={["dimensions"]} className="w-full">
        {/* DIMENSÕES */}
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
                      <MeterInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Comprimento total da embarcação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hull_length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comprimento do Casco (m)</FormLabel>
                    <FormControl>
                      <MeterInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Comprimento apenas do casco
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boca Máxima / Largura (m)</FormLabel>
                    <FormControl>
                      <MeterInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Largura máxima da embarcação
                    </FormDescription>
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
                      <MeterInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Profundidade submersa
                    </FormDescription>
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
                      <MeterInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Altura acima da linha d'água
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PESOS E DESLOCAMENTO */}
        <AccordionItem value="weights">
          <AccordionTrigger className="text-lg font-semibold">
            ⚖️ Pesos e Deslocamento
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormField
                control={form.control}
                name="displacement_light"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deslocamento Descarregado (kg)</FormLabel>
                    <FormControl>
                      <KilogramInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Deslocamento sem carga
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displacement_loaded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deslocamento Carregado (kg)</FormLabel>
                    <FormControl>
                      <KilogramInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Deslocamento com carga máxima
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CAPACIDADES */}
        <AccordionItem value="capacities">
          <AccordionTrigger className="text-lg font-semibold">
            🏊 Capacidades
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormField
                control={form.control}
                name="fuel_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível (L)</FormLabel>
                    <FormControl>
                      <LiterInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Capacidade do tanque de combustível
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="water_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Água (L)</FormLabel>
                    <FormControl>
                      <LiterInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Capacidade do tanque de água
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoas a Bordo</FormLabel>
                    <FormControl>
                      <NumericInput 
                        suffix="pessoas"
                        decimals={0}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Capacidade máxima de passageiros
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cabins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cabines</FormLabel>
                    <FormControl>
                      <NumericInput 
                        decimals={0}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Número de cabines
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banheiros</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 3+1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Número de banheiros (pode ser 3+1 para suítes + lavabo)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PERFORMANCE */}
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
                      <KnotInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Velocidade máxima em nós
                    </FormDescription>
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
                      <KnotInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Velocidade ideal de cruzeiro
                    </FormDescription>
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
                      <NauticalMileInput {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Alcance em milhas náuticas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <FormDescription className="text-center text-sm">
        Todos os campos de especificações técnicas são opcionais.
      </FormDescription>
    </div>
  );
}
