import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MemorialDescritivoProps {
  specifications: any;
  modelName: string;
}

export function MemorialDescritivo({ specifications, modelName }: MemorialDescritivoProps) {
  if (!specifications || typeof specifications !== "object") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memorial Descritivo - {modelName}</CardTitle>
          <CardDescription>Especificações técnicas não disponíveis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sections = Object.entries(specifications);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memorial Descritivo - {modelName}</CardTitle>
        <CardDescription>
          Especificações técnicas e características do modelo base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {sections.map(([key, value], index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </AccordionTrigger>
              <AccordionContent>
                {typeof value === "object" && value !== null ? (
                  <ul className="space-y-1 text-sm">
                    {Object.entries(value).map(([subKey, subValue], subIndex) => (
                      <li key={subIndex}>
                        <span className="font-medium">
                          {subKey.replace(/_/g, " ")}:
                        </span>{" "}
                        {String(subValue)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">{String(value)}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
