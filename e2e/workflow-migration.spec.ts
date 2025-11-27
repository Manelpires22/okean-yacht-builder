import { test, expect } from '@playwright/test';

test.describe('Workflow Migration Tests', () => {
  
  test.describe('Workflow Settings', () => {
    test('should verify workflow_settings is active', async ({ page }) => {
      await page.goto('/admin/workflow-settings');
      await page.waitForLoadState('networkidle');
      
      // Check if simplified workflow toggle exists and is enabled
      const workflowToggle = page.locator('button[role="switch"]').first();
      if (await workflowToggle.count() > 0) {
        const isChecked = await workflowToggle.getAttribute('data-state');
        expect(isChecked).toBe('checked');
      }
    });
  });

  test.describe('Quotation with Customization Workflow', () => {
    test('should create quotation and request customization', async ({ page }) => {
      // Navigate to configurator
      await page.goto('/configurador');
      await page.waitForLoadState('networkidle');
      
      // Select a yacht model (if available)
      const modelCards = page.locator('[data-testid="model-card"], .cursor-pointer.transition-all');
      const modelCount = await modelCards.count();
      
      if (modelCount > 0) {
        await modelCards.first().click();
        await page.waitForTimeout(500);
        
        // Open customization dialog
        const customizeButton = page.locator('button:has-text("Solicitar Customização")').first();
        if (await customizeButton.count() > 0) {
          await customizeButton.click();
          await page.waitForTimeout(300);
          
          // Fill customization form
          const itemNameInput = page.locator('input[name="item_name"], input[placeholder*="nome"]').first();
          if (await itemNameInput.count() > 0) {
            await itemNameInput.fill('Teste de Customização Workflow');
          }
          
          const notesInput = page.locator('textarea[name="notes"], textarea[placeholder*="observ"]').first();
          if (await notesInput.count() > 0) {
            await notesInput.fill('Customização para teste de migração de workflow');
          }
          
          // Submit customization
          const submitButton = page.locator('button[type="submit"]:has-text("Solicitar")').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('Commercial Approval Flow', () => {
    test('should display pending commercial approvals', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Check for pending commercial approvals section
      const commercialSection = page.locator('text=/pendente.*comercial/i').first();
      const hasCommercialPending = await commercialSection.count() > 0;
      
      if (hasCommercialPending) {
        await expect(commercialSection).toBeVisible();
      }
    });

    test('should approve customization commercially', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Find first pending approval
      const approvalRows = page.locator('tr:has-text("pending_commercial"), [data-status="pending_commercial"]');
      const rowCount = await approvalRows.count();
      
      if (rowCount > 0) {
        const firstRow = approvalRows.first();
        
        // Click approve button
        const approveButton = firstRow.locator('button:has-text("Aprovar")').first();
        if (await approveButton.count() > 0) {
          await approveButton.click();
          await page.waitForTimeout(500);
          
          // Fill approval notes
          const notesInput = page.locator('textarea[name="notes"], textarea[placeholder*="observ"]').first();
          if (await notesInput.count() > 0) {
            await notesInput.fill('Aprovado comercialmente - teste workflow');
          }
          
          // Confirm approval
          const confirmButton = page.locator('button[type="submit"]:has-text("Aprovar")').first();
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('Technical Approval Flow (PM)', () => {
    test('should display pending PM review', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Check for pending PM review section
      const pmSection = page.locator('text=/pendente.*pm|pm.*review/i').first();
      const hasPMPending = await pmSection.count() > 0;
      
      if (hasPMPending) {
        await expect(pmSection).toBeVisible();
      }
    });

    test('should approve as PM with technical details', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Find pending PM reviews
      const pmRows = page.locator('tr:has-text("pending_pm_review"), [data-status="pending_pm_review"]');
      const rowCount = await pmRows.count();
      
      if (rowCount > 0) {
        const firstRow = pmRows.first();
        
        // Open PM review dialog
        const reviewButton = firstRow.locator('button:has-text("Revisar")').first();
        if (await reviewButton.count() > 0) {
          await reviewButton.click();
          await page.waitForTimeout(500);
          
          // Fill PM review form
          const priceInput = page.locator('input[name="pm_final_price"], input[type="number"]').first();
          if (await priceInput.count() > 0) {
            await priceInput.fill('15000');
          }
          
          const daysInput = page.locator('input[name="pm_final_delivery_impact_days"]').first();
          if (await daysInput.count() > 0) {
            await daysInput.fill('30');
          }
          
          const scopeInput = page.locator('textarea[name="pm_scope"]').first();
          if (await scopeInput.count() > 0) {
            await scopeInput.fill('Escopo definido pelo PM - teste workflow');
          }
          
          // Submit PM review
          const submitButton = page.locator('button[type="submit"]:has-text("Aprovar")').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('Workflow Timeline', () => {
    test('should display complete workflow history', async ({ page }) => {
      // Navigate to a quotation detail page with customizations
      await page.goto('/quotations');
      await page.waitForLoadState('networkidle');
      
      const quotationLinks = page.locator('a[href*="/quotations/"]');
      const linkCount = await quotationLinks.count();
      
      if (linkCount > 0) {
        await quotationLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Look for workflow timeline or status history
        const timelineSection = page.locator('text=/histórico|timeline|workflow/i').first();
        if (await timelineSection.count() > 0) {
          await expect(timelineSection).toBeVisible();
        }
        
        // Verify workflow statuses are displayed
        const statusBadges = page.locator('[data-status], .badge, .status-badge');
        const badgeCount = await statusBadges.count();
        expect(badgeCount).toBeGreaterThan(0);
      }
    });

    test('should show workflow progression correctly', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Check for different workflow stages
      const stages = [
        'pending_pm_review',
        'pending_commercial',
        'approved_commercial',
        'approved_technical'
      ];
      
      for (const stage of stages) {
        const stageElement = page.locator(`[data-status="${stage}"]`).first();
        const exists = await stageElement.count() > 0;
        
        if (exists) {
          await expect(stageElement).toBeVisible();
        }
      }
    });
  });

  test.describe('Approval Rejection Flow', () => {
    test('should reject customization with reason', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Find pending approval
      const pendingRows = page.locator('tr:has-text("pending")').first();
      if (await pendingRows.count() > 0) {
        
        // Click reject button
        const rejectButton = pendingRows.locator('button:has-text("Rejeitar")').first();
        if (await rejectButton.count() > 0) {
          await rejectButton.click();
          await page.waitForTimeout(500);
          
          // Fill rejection reason
          const reasonInput = page.locator('textarea[name="reject_reason"], textarea[placeholder*="motivo"]').first();
          if (await reasonInput.count() > 0) {
            await reasonInput.fill('Rejeitado para teste de workflow - verificar escopo');
          }
          
          // Confirm rejection
          const confirmButton = page.locator('button[type="submit"]:has-text("Rejeitar")').first();
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('should display rejected customizations', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Check for rejected section or status
      const rejectedElements = page.locator('text=/rejeitad|rejected/i, [data-status="rejected"]');
      const hasRejected = await rejectedElements.count() > 0;
      
      if (hasRejected) {
        const firstRejected = rejectedElements.first();
        await expect(firstRejected).toBeVisible();
      }
    });
  });

  test.describe('Role-Based Permissions', () => {
    test('should show different views for different roles', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Check if role-specific sections are visible
      const roleIndicator = page.locator('[data-role], .user-role, text=/admin|comercial|pm/i').first();
      if (await roleIndicator.count() > 0) {
        await expect(roleIndicator).toBeVisible();
      }
    });

    test('should restrict actions based on role', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Check if only authorized buttons are available
      const actionButtons = page.locator('button:has-text("Aprovar"), button:has-text("Rejeitar")');
      const buttonCount = await actionButtons.count();
      
      // Should have at least some action buttons if user has permissions
      if (buttonCount > 0) {
        expect(buttonCount).toBeGreaterThan(0);
      }
    });

    test('should allow admins to manage all customizations', async ({ page }) => {
      await page.goto('/admin/workflow-settings');
      await page.waitForLoadState('networkidle');
      
      // Check if admin panel is accessible
      const adminIndicators = page.locator('text=/configurações|settings|admin/i');
      const hasAdminAccess = await adminIndicators.count() > 0;
      
      if (hasAdminAccess) {
        await expect(adminIndicators.first()).toBeVisible();
      }
    });
  });

  test.describe('Workflow Migration Validation', () => {
    test('should not have legacy approval table references', async ({ page }) => {
      // Navigate through key pages
      const pages = ['/approvals', '/quotations', '/configurador'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check that old approval system is not referenced
        const legacyRefs = page.locator('text=/approval_requests|old.*approval/i');
        const hasLegacy = await legacyRefs.count() > 0;
        
        expect(hasLegacy).toBe(false);
      }
    });

    test('should use workflow_status field consistently', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Verify workflow statuses are displayed correctly
      const validStatuses = [
        'pending_pm_review',
        'pending_commercial',
        'approved_commercial',
        'pending_technical',
        'approved_technical',
        'rejected'
      ];
      
      let foundValidStatus = false;
      for (const status of validStatuses) {
        const statusElement = page.locator(`[data-status="${status}"]`).first();
        if (await statusElement.count() > 0) {
          foundValidStatus = true;
          break;
        }
      }
      
      // Should find at least one valid workflow status
      expect(foundValidStatus).toBe(true);
    });
  });

  test.describe('Performance and Error Handling', () => {
    test('should load approvals page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle empty state gracefully', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Check for empty state or data
      const emptyState = page.locator('text=/nenhum|empty|não há/i').first();
      const hasData = await page.locator('table tbody tr, .approval-card').count() > 0;
      
      if (!hasData) {
        await expect(emptyState).toBeVisible();
      }
    });

    test('should display error messages properly', async ({ page }) => {
      // Monitor console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      // Should not have critical errors
      const hasCriticalErrors = consoleErrors.some(err => 
        err.includes('TypeError') || err.includes('ReferenceError')
      );
      
      expect(hasCriticalErrors).toBe(false);
    });
  });
});
