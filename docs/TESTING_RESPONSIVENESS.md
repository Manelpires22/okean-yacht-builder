# Testes de Responsividade

Este documento descreve como executar e manter os testes automatizados de responsividade usando Playwright.

## Viewports Testados

Os testes cobrem os seguintes tamanhos de tela:

- **Mobile Portrait**: 375px x 667px (iPhone SE)
- **Tablet Portrait**: 768px x 1024px (iPad)
- **Tablet Landscape**: 1024px x 768px (iPad rotacionado)
- **Desktop**: 1280px x 720px (Laptop padrão)
- **Desktop Wide**: 1920px x 1080px (Monitor Full HD)

## Como Executar os Testes

### Instalação Inicial

```bash
# Instalar dependências
npm install

# Instalar browsers do Playwright
npx playwright install
```

### Executar Todos os Testes

```bash
# Executar todos os testes em todos os viewports
npx playwright test

# Executar com UI (modo interativo)
npx playwright test --ui

# Executar apenas um viewport específico
npx playwright test --project="Mobile Portrait"
npx playwright test --project="Desktop"
```

### Executar Testes Específicos

```bash
# Executar apenas testes do Configurator
npx playwright test e2e/responsiveness.spec.ts -g "Configurator"

# Executar apenas testes de overflow
npx playwright test -g "horizontal overflow"

# Debug mode (abre browser)
npx playwright test --debug
```

### Ver Relatório

```bash
# Abrir relatório HTML
npx playwright show-report
```

## O Que é Testado

### 1. Overflow Horizontal
- ✅ Nenhuma página deve ter scroll horizontal
- ✅ Elementos não devem ultrapassar os limites do viewport

### 2. Componentes Responsivos
- ✅ Cards de modelos no Configurator
- ✅ Resumo de Configuração (sticky em telas grandes)
- ✅ Tabelas com scroll horizontal em mobile
- ✅ Grids de cards adaptáveis

### 3. Layout
- ✅ Sidebar visível apenas em telas grandes
- ✅ Botões e inputs com tamanho adequado em mobile
- ✅ Imagens não ultrapassam viewport

### 4. Touch Targets
- ✅ Botões têm tamanho mínimo de ~36-44px em mobile
- ✅ Espaçamento adequado entre elementos clicáveis

### 5. Texto
- ✅ Texto não ultrapassa containers (sem overflow)
- ✅ Fontes legíveis em todos os tamanhos

## Páginas Testadas

1. **Configurator** (`/configurador`)
   - Model selector
   - Configuration summary
   - Option cards

2. **Quotations** (`/quotations`)
   - Lista de cotações
   - Filtros
   - Tabela responsiva

3. **Quotation Detail** (`/quotations/:id`)
   - Layout com sidebar
   - Accordions

4. **Clients** (`/clients`)
   - Lista de clientes
   - Tabela responsiva

5. **Contracts** (`/contracts`)
   - Cards de contratos
   - Grid responsivo

6. **Approvals** (`/approvals`)
   - Lista de aprovações
   - Tabela responsiva

## Adicionar Novos Testes

### Estrutura de um Teste

```typescript
test.describe('Nome da Página', () => {
  test('should render without horizontal overflow', async ({ page }) => {
    await page.goto('/sua-rota');
    await page.waitForLoadState('networkidle');
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should display component properly', async ({ page, viewport }) => {
    await page.goto('/sua-rota');
    await page.waitForLoadState('networkidle');
    
    // Seu teste aqui
  });
});
```

### Testar Diferentes Viewports

```typescript
test('should adapt layout based on viewport', async ({ page, viewport }) => {
  await page.goto('/sua-rota');
  
  if (viewport && viewport.width < 768) {
    // Mobile: verificar layout mobile
    await expect(page.locator('.mobile-only')).toBeVisible();
  } else if (viewport && viewport.width >= 1024) {
    // Desktop: verificar layout desktop
    await expect(page.locator('.desktop-only')).toBeVisible();
  }
});
```

## CI/CD Integration

Os testes rodam automaticamente no GitHub Actions:

- ✅ Em push para `main` ou `develop`
- ✅ Em pull requests
- ✅ Relatórios salvos como artifacts

### Ver Resultados no GitHub

1. Ir em **Actions** no repositório
2. Selecionar o workflow **Playwright Tests**
3. Ver logs e baixar relatório HTML

## Troubleshooting

### Testes Falhando Localmente

```bash
# Limpar cache
npx playwright install --force

# Atualizar browsers
npx playwright install
```

### Timeout em Testes

```typescript
// Aumentar timeout para páginas lentas
test('slow page', async ({ page }) => {
  test.setTimeout(60000); // 60 segundos
  await page.goto('/rota-lenta');
});
```

### Debug de Screenshots

```typescript
// Tirar screenshot durante teste
await page.screenshot({ path: 'debug.png', fullPage: true });

// Screenshots automáticos em falha (já configurado)
// Verificar pasta: test-results/
```

## Boas Práticas

✅ **Sempre testar overflow horizontal** em novas páginas  
✅ **Verificar touch targets** em componentes interativos mobile  
✅ **Testar com dados reais** quando possível  
✅ **Adicionar data-testid** em componentes importantes:

```tsx
<div data-testid="model-card">
  {/* Conteúdo */}
</div>
```

✅ **Aguardar carregamento** antes de testar:

```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="model-card"]');
```

## Comandos Úteis

```bash
# Gerar código de teste (gravador)
npx playwright codegen http://localhost:8080

# Executar apenas testes que falharam
npx playwright test --last-failed

# Executar em modo headed (ver browser)
npx playwright test --headed

# Executar em projeto específico
npx playwright test --project="Mobile Portrait"

# Gerar trace para debug
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Manutenção

### Atualizar Playwright

```bash
npm install @playwright/test@latest
npx playwright install
```

### Adicionar Novo Viewport

Editar `playwright.config.ts`:

```typescript
projects: [
  // ... outros
  {
    name: 'Custom Viewport',
    use: { 
      viewport: { width: 1440, height: 900 }
    },
  },
]
```

## Recursos

- [Documentação Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
