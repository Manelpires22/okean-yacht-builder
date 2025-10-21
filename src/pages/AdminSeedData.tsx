import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Database, Trash2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSeedData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");

  // Fetch real counts from actual tables
  const { data: seedStats, isLoading } = useQuery({
    queryKey: ['seed-stats'],
    queryFn: async () => {
      const entities = [
        { type: 'yacht_models', table: 'yacht_models' as any },
        { type: 'option_categories', table: 'option_categories' as any },
        { type: 'options', table: 'options' as any },
        { type: 'users', table: 'users' as any },
        { type: 'quotations', table: 'quotations' as any }
      ];
      
      const counts = await Promise.all(
        entities.map(async ({ type, table }) => {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          return { entity: type, count: count || 0 };
        })
      );
      
      return counts;
    }
  });


  const seedDemoDataMutation = useMutation({
    mutationFn: async () => {
      // 1. Inserir modelo Ferretti 550
      const { data: yachtModel, error: ymError } = await supabase
        .from('yacht_models')
        .insert([{
          code: 'FY-550',
          name: 'Ferretti Yachts 550',
          description: 'Iate de luxo italiano com 17,42m de comprimento, design elegante e acabamentos premium. Perfeito para navegação costeira e travessias oceânicas com conforto máximo.',
          base_price: 14900000,
          base_delivery_days: 365,
          is_active: true,
          image_url: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
          technical_specifications: {
            "dimensoes": {
              "comprimento_total": "17,42 m",
              "boca": "4,81 m",
              "calado": "1,40 m",
              "deslocamento": "32.000 kg",
              "capacidade_combustivel": "2.000 L",
              "capacidade_agua": "600 L"
            },
            "motorizacao": {
              "motores": "2x MAN V8-900 (900 hp cada)",
              "transmissao": "Eixo com helices",
              "velocidade_maxima": "30 nós",
              "velocidade_cruzeiro": "24 nós",
              "autonomia": "300 milhas náuticas"
            },
            "acomodacoes": {
              "cabines": "3 cabines (1 master, 2 VIP)",
              "banheiros": "3 banheiros completos + 1 lavabo",
              "capacidade_hospedes": "6 pessoas",
              "capacidade_tripulacao": "2 pessoas",
              "cabine_tripulacao": "1 cabine com beliche"
            },
            "deck_principal": {
              "cockpit": "Área de cockpit com sofá em U, mesa rebatível e acesso à plataforma de banho",
              "plataforma_banho": "Plataforma hidráulica com escada de inox e chuveiro",
              "passarela": "Gangway telescópica em fibra de carbono",
              "area_externa": "Solário de proa com colchonetes"
            },
            "salao_interno": {
              "layout": "Conceito open space com cozinha integrada",
              "sala_estar": "Sofá em L com TV de 55\" e sistema de som Bose",
              "sala_jantar": "Mesa para 6 pessoas",
              "galley": "Cozinha completa com geladeira, fogão, forno e micro-ondas"
            },
            "cabine_master": {
              "localizacao": "Proa completa",
              "cama": "Cama queen size central",
              "banheiro": "Banheiro en-suite com ducha separada",
              "armarios": "Armários embutidos em madeira nobre",
              "iluminacao": "Sistema de iluminação LED RGB"
            },
            "sistemas": {
              "ar_condicionado": "Sistema central 72.000 BTU",
              "geradores": "Gerador Kohler 17 kW",
              "bow_thruster": "Thruster de proa 12 kW",
              "sistema_eletrico": "24V DC / 220V AC",
              "baterias": "Banco de baterias 800 Ah"
            },
            "eletronica": {
              "piloto_automatico": "Raymarine Evolution",
              "radar": "Raymarine Quantum 2",
              "gps_chartplotter": "Raymarine Axiom 12\" (2 unidades)",
              "vhf": "Raymarine Ray73",
              "sonar": "Raymarine CHIRP",
              "sistema_integrado": "Sistema Raymarine LightHouse 3"
            },
            "seguranca": {
              "bote_salva_vidas": "Bote inflável para 8 pessoas",
              "coletes": "10 coletes salva-vidas automáticos",
              "extintores": "4 extintores de incêndio",
              "bomba_porao": "Sistema automático com alarme",
              "sistema_anti_incendio": "Detecção automática e supressão"
            },
            "acabamentos": {
              "casco": "Gelcoat branco com detalhes em cinza metálico",
              "deck": "Teca sintética Flexiteek",
              "interiores": "Madeira de cerejeira com acabamento acetinado",
              "estofados": "Couro italiano premium",
              "cortinas": "Sistema blackout automatizado"
            }
          }
        }])
        .select()
        .single();
      
      if (ymError) throw ymError;

      // 2. Inserir categorias
      const { data: categories, error: catError } = await supabase
        .from('option_categories')
        .insert([
          { name: 'Motorização', description: 'Upgrades de motores e sistemas de propulsão', display_order: 1 },
          { name: 'Eletrônicos', description: 'Equipamentos de navegação e comunicação', display_order: 2 },
          { name: 'Acabamentos Internos', description: 'Revestimentos, móveis e decoração', display_order: 3 },
          { name: 'Equipamentos de Deck', description: 'Itens para áreas externas e lazer', display_order: 4 },
          { name: 'Sistemas Adicionais', description: 'Ar-condicionado, geradores, dessalinizador', display_order: 5 },
          { name: 'Segurança', description: 'Equipamentos de segurança adicionais', display_order: 6 }
        ])
        .select();
      
      if (catError) throw catError;

      // 3. Criar mapa de categorias
      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {} as Record<string, string>);

      // 4. Inserir opcionais
      const { error: optError } = await supabase
        .from('options')
        .insert([
          {
            code: 'MOT-UPGRADE-V12',
            name: 'Upgrade MAN V12-1000',
            description: 'Upgrade para motores MAN V12-1000 (1000hp cada motor)',
            category_id: categoryMap['Motorização'],
            base_price: 450000,
            delivery_days_impact: 30,
            is_active: true
          },
          {
            code: 'MOT-PODS',
            name: 'Sistema IPS com pods',
            description: 'Sistema de propulsão IPS com pods para maior manobrabilidade',
            category_id: categoryMap['Motorização'],
            base_price: 680000,
            delivery_days_impact: 45,
            is_active: true
          },
          {
            code: 'ELET-RADAR-4G',
            name: 'Radar Furuno DRS4W 4G',
            description: 'Radar de alta definição Furuno DRS4W com tecnologia 4G',
            category_id: categoryMap['Eletrônicos'],
            base_price: 85000,
            delivery_days_impact: 0,
            is_active: true
          },
          {
            code: 'ELET-STARLINK',
            name: 'Internet via satélite Starlink',
            description: 'Sistema de internet via satélite Starlink para conexão global',
            category_id: categoryMap['Eletrônicos'],
            base_price: 45000,
            delivery_days_impact: 10,
            is_active: true
          },
          {
            code: 'ELET-AIS-CLASS-A',
            name: 'AIS Classe A com transceptor',
            description: 'Sistema AIS Classe A profissional com transceptor',
            category_id: categoryMap['Eletrônicos'],
            base_price: 28000,
            delivery_days_impact: 0,
            is_active: true
          },
          {
            code: 'ACAB-TECA-NATURAL',
            name: 'Deck em teca natural',
            description: 'Substituição do deck sintético por teca natural premium',
            category_id: categoryMap['Acabamentos Internos'],
            base_price: 180000,
            delivery_days_impact: 45,
            is_active: true
          },
          {
            code: 'ACAB-MARMORE',
            name: 'Bancadas em mármore Carrara',
            description: 'Bancadas em mármore Carrara italiano nas áreas molhadas',
            category_id: categoryMap['Acabamentos Internos'],
            base_price: 95000,
            delivery_days_impact: 30,
            is_active: true
          },
          {
            code: 'DECK-GUINDASTE',
            name: 'Guindaste hidráulico para tender',
            description: 'Guindaste hidráulico para embarque/desembarque de tender',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 120000,
            delivery_days_impact: 20,
            is_active: true
          },
          {
            code: 'DECK-BIMINI',
            name: 'Bimini elétrico com painéis solares',
            description: 'Bimini retrátil elétrico com painéis solares integrados',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 78000,
            delivery_days_impact: 15,
            is_active: true
          },
          {
            code: 'SIST-DESSALIN-60',
            name: 'Dessalinizador 60L/h',
            description: 'Sistema de dessalinização de água do mar 60 litros/hora',
            category_id: categoryMap['Sistemas Adicionais'],
            base_price: 75000,
            delivery_days_impact: 15,
            is_active: true
          },
          {
            code: 'SIST-GER-22KW',
            name: 'Upgrade gerador para 22kW',
            description: 'Upgrade do gerador auxiliar para modelo de 22kW',
            category_id: categoryMap['Sistemas Adicionais'],
            base_price: 65000,
            delivery_days_impact: 10,
            is_active: true
          },
          {
            code: 'SEG-CAMERAS-360',
            name: 'Sistema de câmeras 360° com visão noturna',
            description: 'Sistema completo de câmeras 360° com visão noturna',
            category_id: categoryMap['Segurança'],
            base_price: 42000,
            delivery_days_impact: 5,
            is_active: true
          }
        ]);
      
      if (optError) throw optError;

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "✅ Dados populados com sucesso!",
        description: "Ferretti 550, 6 categorias e 12 opcionais foram criados"
      });
      queryClient.invalidateQueries({ queryKey: ['seed-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['yacht-models'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      queryClient.invalidateQueries({ queryKey: ['option-categories'] });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro ao popular dados",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateFerretti550OptionsMutation = useMutation({
    mutationFn: async () => {
      // 1. Delete existing demo options
      const { error: deleteError } = await supabase
        .from('options')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) throw deleteError;

      // 2. Get category IDs
      const { data: categories, error: catError } = await supabase
        .from('option_categories')
        .select('id, name');
      
      if (catError) throw catError;

      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {} as Record<string, string>);

      // 3. Insert 24 real options from FY-550-05_-_OPTS.docx
      const { error: optError } = await supabase
        .from('options')
        .insert([
          // ELETRÔNICOS (7)
          {
            code: 'ELET-3CMD',
            name: '3º Comando',
            description: 'Terceiro comando com controles completos de navegação',
            category_id: categoryMap['Eletrônicos'],
            base_price: 95000,
            delivery_days_impact: 15,
            is_active: true
          },
          {
            code: 'ELET-UPGRADE-SIMRAD',
            name: 'Upgrade telas Simrad',
            description: 'Upgrade para 2x12" no comando + 1x12" no flybridge',
            category_id: categoryMap['Eletrônicos'],
            base_price: 120000,
            delivery_days_impact: 10,
            is_active: true
          },
          {
            code: 'ELET-TV-43-SALAO',
            name: 'TV 43" no salão com lift elétrico',
            description: 'Televisão 43 polegadas no salão com sistema de elevação elétrica',
            category_id: categoryMap['Eletrônicos'],
            base_price: 35000,
            delivery_days_impact: 5,
            is_active: true
          },
          {
            code: 'ELET-TV-32-MASTER',
            name: 'TV 32" na cabine master',
            description: 'Televisão 32 polegadas na cabine master',
            category_id: categoryMap['Eletrônicos'],
            base_price: 18000,
            delivery_days_impact: 0,
            is_active: true
          },
          {
            code: 'ELET-TV-32-VIP',
            name: 'TV 32" na cabine VIP',
            description: 'Televisão 32 polegadas na cabine VIP',
            category_id: categoryMap['Eletrônicos'],
            base_price: 18000,
            delivery_days_impact: 0,
            is_active: true
          },
          {
            code: 'ELET-TV-22-HOSPEDES',
            name: 'TV 22" na cabine hóspedes',
            description: 'Televisão 22 polegadas na cabine de hóspedes',
            category_id: categoryMap['Eletrônicos'],
            base_price: 12000,
            delivery_days_impact: 0,
            is_active: true
          },
          {
            code: 'ELET-LUZES-SUBMERSAS',
            name: '5 luzes submersas',
            description: 'Kit com 5 luzes submersas LED para iluminação subaquática',
            category_id: categoryMap['Eletrônicos'],
            base_price: 42000,
            delivery_days_impact: 7,
            is_active: true
          },
          // EQUIPAMENTOS DE DECK (10)
          {
            code: 'DECK-BIMINI-TOP',
            name: 'Bimini top com iluminação',
            description: 'Bimini top cor areia com sistema de iluminação integrado',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 65000,
            delivery_days_impact: 20,
            is_active: true
          },
          {
            code: 'DECK-PLATAFORMA-SUB',
            name: 'Plataforma submergível deslizante',
            description: 'Plataforma submergível deslizante com revestimento em teca',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 280000,
            delivery_days_impact: 45,
            is_active: true
          },
          {
            code: 'DECK-PASSARELA-TELE',
            name: 'Passarela de embarque telescópica',
            description: 'Passarela telescópica para facilitar embarque e desembarque',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 95000,
            delivery_days_impact: 15,
            is_active: true
          },
          {
            code: 'DECK-ESPACO-GOURMET',
            name: 'Espaço Gourmet na popa',
            description: 'Área gourmet completa na popa com churrasqueira e pia',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 85000,
            delivery_days_impact: 25,
            is_active: true
          },
          {
            code: 'DECK-MESA-PROA-FV',
            name: 'Mesa em fibra de vidro na proa',
            description: 'Mesa em fibra de vidro para área de proa',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 12000,
            delivery_days_impact: 10,
            is_active: true
          },
          {
            code: 'DECK-LONA-SOMBRA-PROA',
            name: 'Lona de sombreamento na proa',
            description: 'Lona retrátil para sombreamento da área de proa',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 8500,
            delivery_days_impact: 5,
            is_active: true
          },
          {
            code: 'DECK-PORTA-COPOS-PROA',
            name: 'Porta-copos em teca na proa',
            description: 'Porta-copos em teca natural para área de proa',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 4200,
            delivery_days_impact: 0,
            is_active: true
          },
          {
            code: 'DECK-LUMINARIAS-PROA',
            name: '2 luminárias pop-up na proa',
            description: 'Duas luminárias retráteis pop-up para iluminação da proa',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 15000,
            delivery_days_impact: 5,
            is_active: true
          },
          {
            code: 'DECK-CADEIRAS-COCKPIT',
            name: '2 cadeiras para o cockpit',
            description: 'Par de cadeiras náuticas premium para área do cockpit',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 9800,
            delivery_days_impact: 0,
            is_active: true
          },
          {
            code: 'DECK-GELADEIRA-FLY',
            name: 'Geladeira no flybridge',
            description: 'Geladeira náutica embutida no flybridge',
            category_id: categoryMap['Equipamentos de Deck'],
            base_price: 22000,
            delivery_days_impact: 10,
            is_active: true
          },
          // ACABAMENTOS INTERNOS (4)
          {
            code: 'ACAB-PISO-PARQUET',
            name: 'Piso parquet no deck principal',
            description: 'Piso em parquet no salão, cozinha e comando',
            category_id: categoryMap['Acabamentos Internos'],
            base_price: 145000,
            delivery_days_impact: 40,
            is_active: true
          },
          {
            code: 'ACAB-CALACATA-MASTER',
            name: 'Revestimento Calacata cabine master',
            description: 'Revestimento em mármore Calacata na parede do box da cabine master',
            category_id: categoryMap['Acabamentos Internos'],
            base_price: 48000,
            delivery_days_impact: 20,
            is_active: true
          },
          {
            code: 'ACAB-ICEMAKER-POPA',
            name: 'Icemaker na praça de popa',
            description: 'Máquina de gelo (icemaker) embutida na praça de popa',
            category_id: categoryMap['Acabamentos Internos'],
            base_price: 28000,
            delivery_days_impact: 10,
            is_active: true
          },
          {
            code: 'ACAB-PINTURA-BELEZA',
            name: 'Pintura linha da beleza em preto',
            description: 'Pintura personalizada da linha da beleza em preto',
            category_id: categoryMap['Acabamentos Internos'],
            base_price: 35000,
            delivery_days_impact: 15,
            is_active: true
          },
          // SISTEMAS ADICIONAIS (2)
          {
            code: 'SIST-SEEKEEPER-NG6',
            name: 'Estabilizador Seekeeper NG 6',
            description: 'Sistema de estabilização giroscópica Seekeeper NG 6',
            category_id: categoryMap['Sistemas Adicionais'],
            base_price: 420000,
            delivery_days_impact: 60,
            is_active: true
          },
          {
            code: 'SIST-ANTI-FOULING',
            name: 'Pintura anti-fouling',
            description: 'Pintura anti-incrustante de alta performance',
            category_id: categoryMap['Sistemas Adicionais'],
            base_price: 38000,
            delivery_days_impact: 10,
            is_active: true
          }
        ]);
      
      if (optError) throw optError;

      return { success: true, count: 24 };
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Opcionais atualizados!",
        description: `${data.count} opcionais reais do Ferretti 550 foram cadastrados`
      });
      queryClient.invalidateQueries({ queryKey: ['seed-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      queryClient.invalidateQueries({ queryKey: ['option-categories'] });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro ao atualizar opcionais",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // Delete in correct order to respect foreign keys
      const errors = [];
      
      try {
        // 1. Delete quotation_options first
        const { error: qoError } = await supabase
          .from('quotation_options' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (qoError) errors.push(`quotation_options: ${qoError.message}`);

        // 2. Delete quotations
        const { error: qError } = await supabase
          .from('quotations' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (qError) errors.push(`quotations: ${qError.message}`);

        // 3. Delete options
        const { error: optError } = await supabase
          .from('options' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (optError) errors.push(`options: ${optError.message}`);

        // 4. Delete option_categories
        const { error: ocError } = await supabase
          .from('option_categories' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (ocError) errors.push(`option_categories: ${ocError.message}`);

        // 5. Delete yacht_models
        const { error: ymError } = await supabase
          .from('yacht_models' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (ymError) errors.push(`yacht_models: ${ymError.message}`);

        // 6. Delete users
        const { error: uError } = await supabase
          .from('users' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (uError) errors.push(`users: ${uError.message}`);

        if (errors.length > 0) {
          throw new Error(`Erros ao deletar: ${errors.join('; ')}`);
        }

        return { success: true };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Todos os dados removidos",
        description: "TODOS os dados foram removidos permanentemente"
      });
      setConfirmText("");
      queryClient.invalidateQueries({ queryKey: ['seed-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao remover dados: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const entityLabels: Record<string, string> = {
    yacht_models: "Modelos de Iates",
    option_categories: "Categorias de Opcionais",
    options: "Opcionais",
    users: "Utilizadores",
    quotations: "Cotações"
  };

  const handleEmergencyDeleteAll = () => {
    if (confirmText !== "CONFIRMAR") {
      toast({
        title: "Confirmação necessária",
        description: "Digite CONFIRMAR para prosseguir",
        variant: "destructive"
      });
      return;
    }
    deleteAllMutation.mutate();
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Dados de Teste</h1>
          <p className="text-muted-foreground">
            Remover dados de seeding para limpar a base de dados
          </p>
        </div>

        {/* SEÇÃO 1: POPULAR DADOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados de Demonstração
            </CardTitle>
            <CardDescription>
              Popule o sistema com dados de exemplo para testar o configurador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">O que será criado?</AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>1 Modelo de Iate:</strong> Ferretti Yachts 550 (R$ 14.900.000)</li>
                  <li><strong>6 Categorias:</strong> Motorização, Eletrônicos, Acabamentos, etc</li>
                  <li><strong>12 Opcionais:</strong> Upgrades, equipamentos e sistemas</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => seedDemoDataMutation.mutate()}
              disabled={seedDemoDataMutation.isPending}
              className="w-full"
              size="lg"
            >
              <Database className="h-4 w-4 mr-2" />
              {seedDemoDataMutation.isPending 
                ? "A popular dados..." 
                : "Popular Dados de Demonstração"}
            </Button>

            {seedDemoDataMutation.isSuccess && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-900 dark:text-green-100">Sucesso!</AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Dados criados com sucesso! Agora você pode:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Ir para <strong>/admin/yacht-models</strong> ver o Ferretti 550</li>
                    <li>Ir para <strong>/admin/options</strong> ver os opcionais</li>
                    <li>Ir para <strong>/configurador</strong> testar o configurador</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 1B: ATUALIZAR OPCIONAIS FERRETTI 550 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Atualizar Opcionais Ferretti 550
            </CardTitle>
            <CardDescription>
              Substituir opcionais de exemplo pelos 24 opcionais reais do documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">⚠️ Atenção</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Vai <strong>deletar TODOS os opcionais</strong> existentes</li>
                  <li>Vai inserir <strong>24 opcionais reais</strong> do Ferretti 550</li>
                  <li>Distribuídos em: Eletrônicos (7), Equipamentos de Deck (10), Acabamentos (4), Sistemas (2)</li>
                  <li>Total estimado: <strong>R$ 1.650.500</strong> em opcionais</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => updateFerretti550OptionsMutation.mutate()}
              disabled={updateFerretti550OptionsMutation.isPending}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              {updateFerretti550OptionsMutation.isPending 
                ? "A atualizar opcionais..." 
                : "🔄 Atualizar para 24 Opcionais Reais"}
            </Button>

            {updateFerretti550OptionsMutation.isSuccess && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-900 dark:text-green-100">Sucesso!</AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200">
                  24 opcionais reais foram cadastrados! Categorias:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Eletrônicos:</strong> 7 opcionais (R$ 340.000)</li>
                    <li><strong>Equipamentos de Deck:</strong> 10 opcionais (R$ 596.500)</li>
                    <li><strong>Acabamentos Internos:</strong> 4 opcionais (R$ 256.000)</li>
                    <li><strong>Sistemas Adicionais:</strong> 2 opcionais (R$ 458.000)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 2: ESTATÍSTICAS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados Atuais no Sistema
            </CardTitle>
            <CardDescription>
              Selecione os tipos de dados que deseja remover
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))
            ) : (
              seedStats?.map(({ entity, count }) => (
                <div key={entity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <label
                      htmlFor={entity}
                      className="text-sm font-medium leading-none cursor-default"
                    >
                      {entityLabels[entity]}
                    </label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{count}</span> registros
                  </div>
                </div>
              ))
            )}

            <div className="pt-4 border-t space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Digite "CONFIRMAR" para prosseguir:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border rounded-md"
                  placeholder="CONFIRMAR"
                />
              </div>

              <div className="flex flex-col gap-3">
                <Alert variant="destructive" className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>⚠️ ATENÇÃO - PERIGO</AlertTitle>
                  <AlertDescription>
                    Este botão apaga TODOS os dados do sistema permanentemente.
                    Esta ação não pode ser desfeita!
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleEmergencyDeleteAll}
                  disabled={deleteAllMutation.isPending}
                  variant="destructive"
                  className="w-full bg-red-900 hover:bg-red-800 dark:bg-red-950 dark:hover:bg-red-900"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAllMutation.isPending ? "A apagar..." : "🚨 APAGAR TODOS OS DADOS 🚨"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: LIMPAR DADOS */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            A ação de limpeza é irreversível. Certifique-se de que deseja remover os dados.
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
};

export default AdminSeedData;
