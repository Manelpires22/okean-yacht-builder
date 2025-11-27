# 🚀 Guia de Início Rápido - OKEAN Yachts CPQ

Guia prático para novos desenvolvedores começarem a contribuir com o projeto em menos de 10 minutos.

## Índice

1. [Visão Geral](#visão-geral)
2. [Setup Rápido](#setup-rápido)
3. [Scripts Disponíveis](#scripts-disponíveis)
4. [Estrutura de Branches](#estrutura-de-branches)
5. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
6. [Convenções Essenciais](#convenções-essenciais)
7. [Onde Encontrar o Quê](#onde-encontrar-o-quê)
8. [Documentação Relacionada](#documentação-relacionada)
9. [FAQ](#faq)
10. [Contato](#contato)

---

## Visão Geral

**OKEAN Yachts CPQ** é um sistema de configuração, precificação e cotação (CPQ) para construção de iates personalizados.

**Stack Principal:**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **UI**: shadcn/ui + TailwindCSS
- **State**: React Query (@tanstack/react-query)

---

## Setup Rápido

### Pré-requisitos

- **Node.js 18+** (recomendado: usar [nvm](https://github.com/nvm-sh/nvm))
- **npm** ou **bun**
- **Acesso ao Supabase** (solicitar credenciais ao admin)

### Instalação (< 5 minutos)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd okean-yacht-builder

# 2. Instale as dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Acesse no navegador
# http://localhost:8080
```

### Configuração do `.env`

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (porta 8080) |
| `npm run build` | Build de produção (valida TypeScript) |
| `npm run preview` | Preview do build de produção |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run lint` | Verifica código com ESLint |

---

## Estrutura de Branches

| Branch | Propósito | Deploy |
|--------|-----------|--------|
| `main` | Produção estável | ✅ Automático |
| `develop` | Integração (base para PRs) | 🚧 Staging |
| `feature/*` | Novas funcionalidades | - |
| `fix/*` | Correções de bugs | - |
| `refactor/*` | Refatorações de código | - |
| `docs/*` | Atualizações de documentação | - |

**Exemplo:**
```bash
git checkout -b feature/adicionar-filtro-cotacoes
git checkout -b fix/corrigir-calculo-desconto
```

---

## Fluxo de Desenvolvimento

### 1. Criar Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
```

### 2. Desenvolver

- Siga os padrões definidos no [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- Consulte [`ARCHITECTURE.md`](./ARCHITECTURE.md) para entender a estrutura
- Use componentes do design system (`src/components/ui/`)

### 3. Testar

```bash
# Testes unitários
npm run test

# Build de produção (valida TypeScript)
npm run build

# Testes E2E (opcional, dependendo da mudança)
npm run test:e2e
```

### 4. Commit

Siga [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: adiciona filtro de status nas cotações"
```

### 5. Push e Pull Request

```bash
git push origin feature/nome-da-feature
```

Abra um Pull Request no GitHub para `develop` com:
- **Título descritivo**
- **Descrição** do que foi feito e por quê
- **Screenshots** (se houver mudanças visuais)
- **Checklist de validação**

---

## Convenções Essenciais

### Commits (Conventional Commits)

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| `feat` | Nova funcionalidade | `feat: adiciona hook useQuotationPricing` |
| `fix` | Correção de bug | `fix: corrige cálculo de desconto` |
| `refactor` | Mudança sem alterar comportamento | `refactor: divide hook em funções menores` |
| `docs` | Documentação | `docs: atualiza README de arquitetura` |
| `test` | Testes | `test: adiciona testes para useQuotationValidation` |
| `chore` | Manutenção | `chore: atualiza dependências` |
| `style` | Formatação | `style: corrige indentação` |
| `perf` | Performance | `perf: otimiza query de cotações` |

### Nomenclatura de Arquivos e Código

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Componentes React** | PascalCase | `QuotationCard.tsx` |
| **Hooks** | camelCase com `use` | `useQuotations.ts` |
| **Utilitários** | kebab-case | `quotation-utils.ts` |
| **Páginas** | PascalCase | `Quotations.tsx` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_DISCOUNT` |
| **Tipos/Interfaces** | PascalCase | `QuotationData` |

### Estrutura de Componente

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuotations } from "@/hooks/useQuotations";

interface QuotationCardProps {
  quotation: Quotation;
  onSelect?: (id: string) => void;
}

export function QuotationCard({ quotation, onSelect }: QuotationCardProps) {
  // Early returns
  if (!quotation) return null;

  // Hooks
  const { data } = useQuotations();

  // Event handlers
  const handleClick = () => {
    onSelect?.(quotation.id);
  };

  // Render
  return (
    <Card onClick={handleClick}>
      {/* JSX */}
    </Card>
  );
}
```

---

## Onde Encontrar o Quê

### Estrutura de Diretórios (Referência Rápida)

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui) - NÃO EDITAR
│   ├── quotations/     # Componentes de cotações
│   ├── contracts/      # Componentes de contratos
│   ├── configurator/   # Configurador de iates
│   └── admin/          # Painel administrativo
├── hooks/              # Custom hooks (48 hooks!)
│   ├── quotations/     # Hooks refatorados de cotações
│   └── use*.ts         # Hooks gerais
├── pages/              # Páginas da aplicação (27 páginas)
├── lib/                # Utilitários e helpers
├── integrations/       # Integrações (Supabase)
└── contexts/           # Contextos React (Auth)

supabase/
├── functions/          # Edge Functions (17 funções)
└── migrations/         # Migrations SQL
```

### Guia de Localização Rápida

| Preciso de... | Onde está |
|---------------|-----------|
| Componentes UI base (Button, Card, etc.) | `src/components/ui/` |
| Hooks de dados (queries) | `src/hooks/` |
| Páginas da aplicação | `src/pages/` |
| Configuração Supabase | `src/integrations/supabase/` |
| Tipos do banco (auto-gerados) | `src/integrations/supabase/types.ts` |
| Edge Functions (backend) | `supabase/functions/` |
| Migrations SQL | `supabase/migrations/` |
| Design system (tokens CSS) | `src/index.css` |
| Configuração Tailwind | `tailwind.config.ts` |

---

## Documentação Relacionada

| Documento | Descrição | Quando consultar |
|-----------|-----------|------------------|
| [**CONTRIBUTING.md**](../CONTRIBUTING.md) | Guia técnico completo (3000+ linhas) | Dúvidas sobre padrões detalhados |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Arquitetura do sistema | Entender estrutura e fluxos |
| [**DATABASE.md**](./DATABASE.md) | Schema do banco de dados | Trabalhar com queries/migrations |
| [**WORKFLOW_SIMPLIFICADO.md**](./WORKFLOW_SIMPLIFICADO.md) | Fluxos de aprovação | Feature de customizações/ATOs |
| [**TESTING_RESPONSIVENESS.md**](./TESTING_RESPONSIVENESS.md) | Testes de responsividade | Adicionar testes E2E |

---

## FAQ (Perguntas Frequentes)

### Como rodar testes?

```bash
# Testes unitários (Vitest)
npm run test

# Testes E2E (Playwright)
npm run test:e2e

# Testes com UI do Vitest
npm run test:ui
```

### Como acessar o Supabase?

Você precisa das credenciais do projeto. Solicite ao admin:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Adicione ao arquivo `.env` na raiz do projeto.

### Onde ficam os tipos do banco de dados?

Os tipos são **auto-gerados** pelo Supabase CLI:
- Arquivo: `src/integrations/supabase/types.ts`
- **NÃO EDITAR MANUALMENTE** (será sobrescrito)

Para atualizar os tipos após uma migration:
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Como criar uma nova página?

1. Criar arquivo em `src/pages/MinhaPage.tsx`
2. Adicionar rota em `src/App.tsx`:
   ```typescript
   <Route path="/minha-page" element={<MinhaPage />} />
   ```
3. Adicionar link na navegação (se aplicável)

### Como usar o design system?

**✅ SEMPRE usar tokens semânticos:**
```typescript
// Correto - usa tokens do design system
<Card className="bg-background text-foreground border-border">
  <Button variant="primary">Salvar</Button>
</Card>

// ❌ ERRADO - cores diretas
<Card className="bg-white text-black border-gray-200">
  <Button className="bg-blue-500">Salvar</Button>
</Card>
```

Tokens disponíveis em `src/index.css`:
- `--background`, `--foreground`
- `--primary`, `--secondary`, `--accent`
- `--border`, `--input`, `--ring`

### Como adicionar uma Edge Function?

1. Criar pasta em `supabase/functions/minha-funcao/`
2. Criar `index.ts` com a lógica
3. Adicionar em `supabase/config.toml`
4. Deploy automático no próximo push

Exemplo mínimo:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  return new Response(JSON.stringify({ message: "Hello" }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Onde encontrar exemplos de código?

- **Hooks refatorados**: `src/hooks/quotations/`
- **Componentes complexos**: `src/components/configurator/`
- **Testes unitários**: `src/hooks/quotations/tests/`
- **Testes E2E**: `e2e/`

---

## Contato e Suporte

### Dúvidas Técnicas

- **Issues**: Abra uma [issue no GitHub](https://github.com/seu-repo/issues) com label `question`
- **Discussões**: Use a aba [Discussions](https://github.com/seu-repo/discussions)

### Revisão de Código

- Marque os reviewers apropriados no PR
- Aguarde aprovação antes de fazer merge

### Reportar Bugs

Abra uma issue com:
- **Descrição clara** do problema
- **Passos para reproduzir**
- **Comportamento esperado vs atual**
- **Screenshots** (se aplicável)
- **Ambiente** (browser, versão, OS)

---

## Próximos Passos

Após concluir este guia, você está pronto para contribuir! 🎉

**Sugestões:**
1. Explore o código em `src/pages/Index.tsx` (dashboard principal)
2. Leia [`ARCHITECTURE.md`](./ARCHITECTURE.md) para entender os fluxos
3. Execute `npm run test` para ver os testes em ação
4. Escolha uma issue com label `good-first-issue`

**Boa sorte e boas contribuições!** 🚤

---

**Última atualização:** 2025-01-23  
**Versão:** 1.0.0
