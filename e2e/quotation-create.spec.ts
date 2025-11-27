import { test, expect } from '@playwright/test';

test.describe('Criar Cotação', () => {
  // Configuração de autenticação antes de cada teste
  test.beforeEach(async ({ page }) => {
    // 1. Navegar para página de login
    await page.goto('/auth');
    
    // 2. Preencher credenciais (usando seletores #id, não [name])
    await page.fill('#email', 'commercial@okean.com');
    await page.fill('#password', 'test123');
    
    // 3. Submeter formulário
    await page.click('button[type="submit"]');
    
    // 4. Aguardar redirecionamento para /admin
    await page.waitForURL('/admin');
  });

  test('deve criar cotação completa com sucesso', async ({ page }) => {
    // 1. Ir para configurador
    await page.goto('/configurador');
    await page.waitForLoadState('networkidle');
    
    // 2. Selecionar modelo (primeiro disponível)
    // ModelSelector mostra cards com botão "Configurar este Modelo"
    const configureButton = page.locator('button:has-text("Configurar este Modelo")').first();
    await configureButton.waitFor({ state: 'visible' });
    await configureButton.click();
    
    // 3. Verificar que estamos na tela de configuração
    await expect(page.locator('text=Resumo da Configuração')).toBeVisible();
    
    // 4. Ir para aba de Opcionais
    await page.click('text=Opcionais');
    
    // 5. Expandir primeira categoria de opcionais (Accordion)
    const firstCategory = page.locator('[data-state="closed"]').first();
    if (await firstCategory.count() > 0) {
      await firstCategory.click();
    }
    
    // 6. Adicionar primeiro opcional disponível
    const addButton = page.locator('button:has-text("Adicionar")').first();
    await addButton.waitFor({ state: 'visible', timeout: 5000 });
    await addButton.click();
    
    // 7. Verificar que opcional foi selecionado (badge "Selecionado" aparece)
    await expect(page.locator('text=Selecionado').first()).toBeVisible();
    
    // 8. Aplicar desconto base (sidebar)
    const baseDiscountInput = page.locator('#base-discount');
    await baseDiscountInput.fill('5');
    
    // 9. Clicar em "Salvar Cotação" (abre dialog)
    const saveButton = page.locator('button:has-text("Salvar Cotação")');
    await saveButton.click();
    
    // 10. Preencher dados do cliente no dialog
    await expect(page.locator('text=Salvar Cotação').first()).toBeVisible();
    
    // Preencher nome (campo obrigatório)
    await page.locator('input[placeholder="João Silva"]').fill('Cliente Teste E2E');
    
    // Preencher email (opcional)
    await page.locator('input[placeholder="joao@exemplo.com"]').fill('teste@example.com');
    
    // Preencher telefone (opcional)
    await page.locator('input[placeholder*="99999"]').fill('+55 11 99999-9999');
    
    // 11. Submeter formulário de salvamento
    await page.locator('button:has-text("Salvar Cotação")').last().click();
    
    // 12. Verificar toast de sucesso
    await expect(page.locator('text=Cotação criada com sucesso')).toBeVisible({ timeout: 10000 });
    
    // 13. Verificar redirecionamento para lista de cotações
    await expect(page).toHaveURL(/\/cotacoes|\/quotations/);
    
    // 14. Verificar cotação na lista
    await expect(page.locator('text=Cliente Teste E2E')).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir mensagem de aprovação para descontos altos', async ({ page }) => {
    await page.goto('/configurador');
    await page.waitForLoadState('networkidle');
    
    // Selecionar modelo
    await page.click('button:has-text("Configurar este Modelo")');
    await page.waitForSelector('text=Resumo da Configuração');
    
    // Aplicar desconto alto (acima do limite sem aprovação)
    await page.locator('#base-discount').fill('15');
    
    // Verificar alerta de aprovação necessária
    await expect(page.locator('text=requer aprovação')).toBeVisible({ timeout: 3000 });
  });

  test('não deve permitir salvar sem preencher nome do cliente', async ({ page }) => {
    await page.goto('/configurador');
    await page.waitForLoadState('networkidle');
    
    // Selecionar modelo
    await page.click('button:has-text("Configurar este Modelo")');
    
    // Abrir dialog de salvamento
    await page.click('button:has-text("Salvar Cotação")');
    
    // Tentar salvar sem preencher nome
    await page.locator('button:has-text("Salvar Cotação")').last().click();
    
    // Verificar mensagem de erro do campo obrigatório
    await expect(page.locator('text=Nome deve ter no mínimo 3 caracteres')).toBeVisible();
  });

  test('deve exibir preços corretamente no resumo', async ({ page }) => {
    await page.goto('/configurador');
    await page.waitForLoadState('networkidle');
    
    // Selecionar modelo
    await page.click('button:has-text("Configurar este Modelo")');
    
    // Verificar que preços são exibidos no resumo
    const summaryCard = page.locator('text=Resumo da Configuração').locator('..');
    await expect(summaryCard.locator('text=R$')).toBeVisible();
    
    // Verificar preço base
    await expect(page.locator('text=Preço Base')).toBeVisible();
    
    // Verificar total
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('deve navegar entre abas corretamente', async ({ page }) => {
    await page.goto('/configurador');
    await page.waitForLoadState('networkidle');
    
    // Selecionar modelo
    await page.click('button:has-text("Configurar este Modelo")');
    
    // Verificar tabs disponíveis
    await expect(page.locator('text=Modelo Base')).toBeVisible();
    await expect(page.locator('text=Opcionais')).toBeVisible();
    await expect(page.locator('text=Customizações')).toBeVisible();
    
    // Navegar para Opcionais
    await page.click('text=Opcionais');
    
    // Verificar que accordion de categorias é exibido ou mensagem vazia
    const hasCategories = await page.locator('[data-radix-accordion-item]').count() > 0;
    const hasEmptyMessage = await page.locator('text=Nenhuma categoria').count() > 0;
    expect(hasCategories || hasEmptyMessage).toBe(true);
    
    // Navegar para Customizações
    await page.click('text=Customizações');
    
    // Verificar conteúdo da aba
    await expect(page.locator('text=Customizações Personalizadas')).toBeVisible();
  });
});
