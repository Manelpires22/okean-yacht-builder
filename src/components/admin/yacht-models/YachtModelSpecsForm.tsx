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
import { Textarea } from "@/components/ui/textarea";
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

interface YachtModelSpecsFormProps {
  form: UseFormReturn<YachtModelFullValues>;
}

export function YachtModelSpecsForm({ form }: YachtModelSpecsFormProps) {
  return (
    <div className="space-y-6">
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
                      Comprimento total da embarcação (converte automaticamente para pés)
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
                      Comprimento apenas do casco (converte automaticamente para pés)
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
                      Largura máxima da embarcação (converte automaticamente para pés)
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
                      Profundidade submersa (converte automaticamente para pés)
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
                      Altura acima da linha d'água (converte automaticamente para pés)
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

        {/* MOTORIZAÇÃO */}

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
        Todos os campos de especificações técnicas são opcionais e podem ser preenchidos conforme disponibilidade dos dados do fabricante.
      </FormDescription>
    </div>
  );
}
