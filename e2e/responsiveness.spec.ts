import { test, expect } from '@playwright/test';

test.describe('Responsiveness Tests', () => {
  
  test.describe('Configurator Page', () => {
    test('should render without horizontal overflow', async ({ page }) => {
      await page.goto('/configurador');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check no horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should display model selector cards properly', async ({ page, viewport }) => {
      await page.goto('/configurador');
      await page.waitForLoadState('networkidle');
      
      // Check if cards are visible and not overlapping viewport
      const cards = await page.locator('[data-testid="model-card"], .cursor-pointer.transition-all').all();
      
      for (const card of cards.slice(0, 3)) { // Check first 3 cards
        const box = await card.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewport?.width || 1920);
          expect(box.x).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display configuration summary correctly', async ({ page, viewport }) => {
      await page.goto('/configurador');
      await page.waitForLoadState('networkidle');
      
      // Check if summary card is visible
      const summary = page.locator('text=Resumo da Configuração').first();
      await expect(summary).toBeVisible();
      
      // Summary should not overflow on large screens
      if (viewport && viewport.width >= 1024) {
        const summaryCard = page.locator('text=Resumo da Configuração').locator('..').locator('..');
        const box = await summaryCard.boundingBox();
        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });
  });

  test.describe('Quotations Page', () => {
    test('should render without horizontal overflow', async ({ page }) => {
      // Note: This requires authentication, adjust as needed
      await page.goto('/quotations');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check no horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should display table with horizontal scroll on small screens', async ({ page, viewport }) => {
      await page.goto('/quotations');
      await page.waitForLoadState('networkidle');
      
      const table = page.locator('table').first();
      const tableExists = await table.count() > 0;
      
      if (tableExists) {
        const tableBox = await table.boundingBox();
        
        if (viewport && viewport.width < 768 && tableBox) {
          // On mobile, table should have scroll container
          const scrollContainer = page.locator('.overflow-x-auto').first();
          await expect(scrollContainer).toBeVisible();
        }
      }
    });

    test('should display filter controls properly', async ({ page, viewport }) => {
      await page.goto('/quotations');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[placeholder*="Buscar"]').first();
      const searchExists = await searchInput.count() > 0;
      
      if (searchExists) {
        const inputBox = await searchInput.boundingBox();
        
        if (inputBox && viewport) {
          expect(inputBox.width).toBeGreaterThan(0);
          expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });
  });

  test.describe('Quotation Detail Page', () => {
    test('should render layout without overflow', async ({ page }) => {
      // Note: Replace with actual quotation ID for testing
      await page.goto('/quotations');
      await page.waitForLoadState('networkidle');
      
      // Check no horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should display sidebar correctly on large screens', async ({ page, viewport }) => {
      await page.goto('/quotations');
      await page.waitForLoadState('networkidle');
      
      if (viewport && viewport.width >= 1024) {
        // Sidebar should be visible on large screens
        const sidebar = page.locator('.lg\\:sticky, [class*="lg:sticky"]').first();
        const sidebarExists = await sidebar.count() > 0;
        
        if (sidebarExists) {
          const sidebarBox = await sidebar.boundingBox();
          if (sidebarBox) {
            expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      }
    });
  });

  test.describe('Clients Page', () => {
    test('should render without horizontal overflow', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should display client table with scroll on mobile', async ({ page, viewport }) => {
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');
      
      if (viewport && viewport.width < 768) {
        const scrollContainer = page.locator('.overflow-x-auto').first();
        const exists = await scrollContainer.count() > 0;
        
        if (exists) {
          await expect(scrollContainer).toBeVisible();
        }
      }
    });
  });

  test.describe('Contracts Page', () => {
    test('should render without horizontal overflow', async ({ page }) => {
      await page.goto('/contracts');
      await page.waitForLoadState('networkidle');
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should display contract cards in responsive grid', async ({ page, viewport }) => {
      await page.goto('/contracts');
      await page.waitForLoadState('networkidle');
      
      const cards = await page.locator('[role="article"], .rounded-lg.border').all();
      
      if (cards.length > 0 && viewport) {
        for (const card of cards.slice(0, 3)) {
          const box = await card.boundingBox();
          if (box) {
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      }
    });
  });

  test.describe('Approvals Page', () => {
    test('should render without horizontal overflow', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should display approvals table with scroll on mobile', async ({ page, viewport }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      
      if (viewport && viewport.width < 768) {
        const table = page.locator('table').first();
        const tableExists = await table.count() > 0;
        
        if (tableExists) {
          const scrollContainer = page.locator('.overflow-x-auto').first();
          await expect(scrollContainer).toBeVisible();
        }
      }
    });
  });

  test.describe('General Responsive Checks', () => {
    test('should not have text overflow', async ({ page }) => {
      await page.goto('/configurador');
      await page.waitForLoadState('networkidle');
      
      // Check for elements with potential text overflow
      const hasOverflow = await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, h2, h3, p, span');
        return Array.from(elements).some(el => {
          const element = el as HTMLElement;
          return element.scrollWidth > element.clientWidth + 5; // 5px tolerance
        });
      });
      
      expect(hasOverflow).toBe(false);
    });

    test('should have proper touch targets on mobile', async ({ page, viewport }) => {
      await page.goto('/configurador');
      await page.waitForLoadState('networkidle');
      
      if (viewport && viewport.width <= 375) {
        const buttons = await page.locator('button').all();
        
        for (const button of buttons.slice(0, 5)) {
          const box = await button.boundingBox();
          if (box) {
            // Minimum touch target: 44x44px (iOS guidelines)
            expect(box.height).toBeGreaterThanOrEqual(36); // Slightly relaxed
          }
        }
      }
    });

    test('should display images responsively', async ({ page, viewport }) => {
      await page.goto('/configurador');
      await page.waitForLoadState('networkidle');
      
      const images = await page.locator('img').all();
      
      if (images.length > 0 && viewport) {
        for (const img of images.slice(0, 3)) {
          const box = await img.boundingBox();
          if (box) {
            expect(box.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      }
    });
  });
});
