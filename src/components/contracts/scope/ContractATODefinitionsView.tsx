import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit3,
  Plus,
  Wrench,
  Palette,
  FileText,
} from "lucide-react";

interface ATOConfiguration {
  id: string;
  ato_id: string;
  item_type: string;
  item_id: string;
  notes: string | null;
  configuration_details: any;
  sub_items: any;
  ato?: {
    ato_number: string;
    title: string;
  };
}

interface ContractATODefinitionsViewProps {
  configurations: ATOConfiguration[];
}

export function ContractATODefinitionsView({
  configurations,
}: ContractATODefinitionsViewProps) {
  const getTypeIcon = (itemType: string) => {
    switch (itemType) {
      case "edit_existing":
        return <Edit3 className="h-4 w-4" />;
      case "add_optional":
        return <Plus className="h-4 w-4" />;
      case "new_customization":
        return <Wrench className="h-4 w-4" />;
      case "define_finishing":
        return <Palette className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (itemType: string) => {
    const labels: Record<string, string> = {
      edit_existing: "Edição de Item Existente",
      add_optional: "Adicionar Opcional",
      new_customization: "Nova Customização",
      define_finishing: "Definir Acabamento",
    };
    return labels[itemType] || itemType;
  };

  const getTypeColor = (itemType: string) => {
    const colors: Record<string, string> = {
      edit_existing: "bg-blue-500/10 text-blue-700 border-blue-200",
      add_optional: "bg-green-500/10 text-green-700 border-green-200",
      new_customization: "bg-purple-500/10 text-purple-700 border-purple-200",
      define_finishing: "bg-orange-500/10 text-orange-700 border-orange-200",
    };
    return colors[itemType] || "bg-muted";
  };

  // Agrupar por ATO
  const groupedByATO = configurations.reduce((acc, config) => {
    const atoNumber = config.ato?.ato_number || "Sem ATO";
    if (!acc[atoNumber]) {
      acc[atoNumber] = {
        title: config.ato?.title || "",
        configs: [],
      };
    }
    acc[atoNumber].configs.push(config);
    return acc;
  }, {} as Record<string, { title: string; configs: ATOConfiguration[] }>);

  if (configurations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma definição via ATO registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Definições via ATOs</h3>
        <Badge variant="outline">{configurations.length} definições</Badge>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByATO).map(([atoNumber, { title, configs }]) => (
          <Card key={atoNumber}>
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {atoNumber}
                {title && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {title}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {configs.map((config) => (
                  <Card
                    key={config.id}
                    className={`border ${getTypeColor(config.item_type)}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(config.item_type)}
                            <span className="font-medium">
                              {getTypeLabel(config.item_type)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {config.item_type}
                          </Badge>
                        </div>

                        {config.notes && (
                          <p className="text-sm text-muted-foreground">
                            {config.notes}
                          </p>
                        )}

                        {config.configuration_details &&
                          Object.keys(config.configuration_details).length >
                            0 && (
                            <div className="text-xs bg-background/50 p-2 rounded border">
                              <strong>Detalhes de Configuração:</strong>
                              <pre className="mt-1 whitespace-pre-wrap">
                                {JSON.stringify(
                                  config.configuration_details,
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          )}

                        {config.sub_items &&
                          Array.isArray(config.sub_items) &&
                          config.sub_items.length > 0 && (
                            <div className="text-xs">
                              <strong>Sub-itens definidos:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {config.sub_items.map(
                                  (subItem: any, idx: number) => (
                                    <li key={idx}>
                                      {subItem.name}: {subItem.value}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
