-- ================================================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: hull_numbers
-- ================================================================
--
-- IMPORTANTE: Este arquivo contém apenas o schema e instruções.
-- Para obter todos os 76 registros de hull_numbers, use a Edge Function:
--
-- URL de Download:
-- https://qqxhkaowexieednyazwq.supabase.co/functions/v1/generate-hull-numbers-sql
--
-- ================================================================

-- Schema da tabela hull_numbers para SQL Server
CREATE TABLE [dbo].[hull_numbers] (
    [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [hull_number] NVARCHAR(50) NOT NULL,
    [brand] NVARCHAR(100) NOT NULL DEFAULT 'FERRETTI',
    [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT 'available',
    [hull_entry_date] DATE NOT NULL,
    [estimated_delivery_date] DATE NOT NULL,
    [job_stop_1_date] DATE NULL,
    [job_stop_2_date] DATE NULL,
    [job_stop_3_date] DATE NULL,
    [job_stop_4_date] DATE NULL,
    [barco_aberto_date] DATE NULL,
    [barco_fechado_date] DATE NULL,
    [fechamento_convesdeck_date] DATE NULL,
    [teste_piscina_date] DATE NULL,
    [teste_mar_date] DATE NULL,
    [entrega_comercial_date] DATE NULL,
    [contract_id] UNIQUEIDENTIFIER NULL,
    [created_at] DATETIME2 NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2 NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_hull_numbers] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_hull_numbers_hull_number] UNIQUE ([hull_number]),
    CONSTRAINT [FK_hull_numbers_yacht_model] FOREIGN KEY ([yacht_model_id]) 
        REFERENCES [dbo].[yacht_models]([id]),
    CONSTRAINT [FK_hull_numbers_contract] FOREIGN KEY ([contract_id]) 
        REFERENCES [dbo].[contracts]([id]),
    CONSTRAINT [CK_hull_numbers_status] CHECK ([status] IN ('available', 'reserved', 'contracted', 'delivered'))
);
GO

-- Índices para performance
CREATE INDEX [IX_hull_numbers_yacht_model_id] ON [dbo].[hull_numbers]([yacht_model_id]);
CREATE INDEX [IX_hull_numbers_status] ON [dbo].[hull_numbers]([status]);
CREATE INDEX [IX_hull_numbers_contract_id] ON [dbo].[hull_numbers]([contract_id]) WHERE [contract_id] IS NOT NULL;
GO

-- ================================================================
-- INSTRUÇÕES PARA MIGRAÇÃO COMPLETA:
--
-- 1. Execute o schema acima primeiro (após yacht_models e contracts)
--
-- 2. Baixe o arquivo SQL completo com todos os dados:
--    https://qqxhkaowexieednyazwq.supabase.co/functions/v1/generate-hull-numbers-sql
--
-- 3. Execute o arquivo baixado para inserir todos os 76 registros
--
-- ================================================================

-- Amostra de 3 registros (apenas para referência):
/*
INSERT INTO [dbo].[hull_numbers] (
    [id], [hull_number], [brand], [yacht_model_id], [status],
    [hull_entry_date], [estimated_delivery_date],
    [job_stop_1_date], [job_stop_2_date], [job_stop_3_date], [job_stop_4_date],
    [barco_aberto_date], [barco_fechado_date], [fechamento_convesdeck_date],
    [teste_piscina_date], [teste_mar_date], [entrega_comercial_date],
    [contract_id], [created_at], [updated_at]
)
VALUES
(
    N'5bd3bda8-3bfe-48e5-b6e1-ff4a7701db41',
    N'F100001',
    N'FERRETTI',
    N'a0a5c97f-c1c2-48e6-a153-6a55ac416beb',
    N'contracted',
    '2024-03-25',
    '2025-10-30',
    '2023-09-27', '2023-11-26', '2023-12-26', '2024-05-27',
    '2024-07-26', '2024-08-15', '2024-07-29',
    '2025-05-26', '2025-06-05', '2025-10-30',
    NULL,
    '2026-01-12 19:34:20.669',
    '2026-01-12 19:34:20.669'
);
*/
