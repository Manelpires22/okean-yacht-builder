-- =====================================================
-- OKEAN CPQ - SQL Server Migration
-- Views, Functions, Stored Procedures e Triggers
-- Gerado em: 2026-01-16
-- Fonte: Supabase PostgreSQL
-- =====================================================
-- 
-- CONTEÚDO:
--   PARTE 1: Funções Escalares e Table-Valued
--   PARTE 2: Stored Procedures
--   PARTE 3: Views
--   PARTE 4: Triggers
--
-- NOTAS IMPORTANTES:
--   - auth.uid() foi substituído por @current_user_id (parâmetro)
--   - JSONB convertido para NVARCHAR(MAX)
--   - RLS não é suportado nativamente no SQL Server
--   - Algumas funções de trigger foram convertidas em triggers separados
--
-- =====================================================

SET NOCOUNT ON;
GO

PRINT '=== OKEAN CPQ - SQL Server Migration Objects ===';
PRINT 'Iniciando criação de objetos...';
PRINT '';
GO

-- =====================================================
-- PARTE 1: FUNÇÕES ESCALARES E TABLE-VALUED
-- =====================================================

PRINT '=== PARTE 1: FUNÇÕES ===';
GO

-- -----------------------------------------------------
-- 1.1 Função: fn_has_role
-- Verifica se um usuário possui uma role específica
-- Equivalente PostgreSQL: has_role(_user_id uuid, _role app_role)
-- -----------------------------------------------------
IF OBJECT_ID('dbo.fn_has_role', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_has_role;
GO

CREATE FUNCTION dbo.fn_has_role (
    @user_id UNIQUEIDENTIFIER,
    @role NVARCHAR(50)
)
RETURNS BIT
AS
BEGIN
    DECLARE @result BIT = 0;
    
    IF EXISTS (
        SELECT 1
        FROM dbo.user_roles
        WHERE user_id = @user_id
          AND role = @role
    )
    BEGIN
        SET @result = 1;
    END
    
    RETURN @result;
END;
GO

PRINT 'Função fn_has_role criada com sucesso';
GO

-- -----------------------------------------------------
-- 1.2 Função: fn_is_admin
-- Verifica se o usuário é administrador
-- Equivalente PostgreSQL: is_admin()
-- NOTA: Requer @user_id pois SQL Server não tem auth.uid()
-- -----------------------------------------------------
IF OBJECT_ID('dbo.fn_is_admin', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_is_admin;
GO

CREATE FUNCTION dbo.fn_is_admin (
    @user_id UNIQUEIDENTIFIER
)
RETURNS BIT
AS
BEGIN
    RETURN dbo.fn_has_role(@user_id, 'administrador');
END;
GO

PRINT 'Função fn_is_admin criada com sucesso';
GO

-- -----------------------------------------------------
-- 1.3 Função Table-Valued: fn_get_effective_permissions
-- Retorna todas as permissões efetivas de um usuário
-- Equivalente PostgreSQL: get_effective_permissions(_user_id uuid)
-- -----------------------------------------------------
IF OBJECT_ID('dbo.fn_get_effective_permissions', 'TF') IS NOT NULL
    DROP FUNCTION dbo.fn_get_effective_permissions;
GO

CREATE FUNCTION dbo.fn_get_effective_permissions (
    @user_id UNIQUEIDENTIFIER
)
RETURNS @permissions TABLE (
    permission NVARCHAR(100)
)
AS
BEGIN
    -- Permissões diretas das roles do usuário
    INSERT INTO @permissions (permission)
    SELECT DISTINCT p.permission
    FROM dbo.role_permissions_config p
    WHERE p.role IN (
        SELECT ur.role 
        FROM dbo.user_roles ur 
        WHERE ur.user_id = @user_id
    )
    AND p.is_granted = 1;
    
    -- Se tem admin:full_access, adicionar todas as permissões
    IF EXISTS (
        SELECT 1 
        FROM dbo.user_roles ur
        JOIN dbo.role_permissions_config admin_perm 
            ON admin_perm.role = ur.role
        WHERE ur.user_id = @user_id
            AND admin_perm.permission = 'admin:full_access'
            AND admin_perm.is_granted = 1
    )
    BEGIN
        INSERT INTO @permissions (permission)
        SELECT DISTINCT rpc.permission
        FROM dbo.role_permissions_config rpc
        WHERE rpc.permission NOT IN (SELECT permission FROM @permissions);
    END
    
    RETURN;
END;
GO

PRINT 'Função fn_get_effective_permissions criada com sucesso';
GO

-- -----------------------------------------------------
-- 1.4 Função: fn_get_yacht_model_id
-- Busca o ID de um modelo de iate pelo código/nome
-- Equivalente PostgreSQL: get_yacht_model_id(modelo_text text)
-- -----------------------------------------------------
IF OBJECT_ID('dbo.fn_get_yacht_model_id', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_get_yacht_model_id;
GO

CREATE FUNCTION dbo.fn_get_yacht_model_id (
    @modelo_text NVARCHAR(100)
)
RETURNS UNIQUEIDENTIFIER
AS
BEGIN
    DECLARE @model_id UNIQUEIDENTIFIER = NULL;
    DECLARE @normalized_input NVARCHAR(100) = UPPER(LTRIM(RTRIM(@modelo_text)));
    
    -- Busca exata pelo código
    SELECT TOP 1 @model_id = id
    FROM dbo.yacht_models
    WHERE UPPER(LTRIM(RTRIM(code))) = @normalized_input;
    
    -- Se não encontrou, busca sem espaços
    IF @model_id IS NULL
    BEGIN
        SELECT TOP 1 @model_id = id
        FROM dbo.yacht_models
        WHERE REPLACE(UPPER(code), ' ', '') = REPLACE(@normalized_input, ' ', '');
    END
    
    -- Se não encontrou, busca pelo nome
    IF @model_id IS NULL
    BEGIN
        SELECT TOP 1 @model_id = id
        FROM dbo.yacht_models
        WHERE UPPER(name) LIKE '%' + @normalized_input + '%';
    END
    
    RETURN @model_id;
END;
GO

PRINT 'Função fn_get_yacht_model_id criada com sucesso';
GO

-- -----------------------------------------------------
-- 1.5 Função: fn_normalize_memorial_category
-- Normaliza o nome de uma categoria do memorial
-- Equivalente PostgreSQL: normalize_memorial_category(okean_categoria text)
-- -----------------------------------------------------
IF OBJECT_ID('dbo.fn_normalize_memorial_category', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_normalize_memorial_category;
GO

CREATE FUNCTION dbo.fn_normalize_memorial_category (
    @okean_categoria NVARCHAR(255)
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @result NVARCHAR(100);
    DECLARE @input NVARCHAR(255) = UPPER(@okean_categoria);
    
    SET @result = CASE 
        WHEN @input LIKE '%DECK PRINCIPAL%' 
          OR @input LIKE '%DEQUE PRINCIPAL%' THEN 'deck_principal'
        WHEN @input LIKE '%CONVÉS PRINCIPAL%' THEN 'conves_principal'
        WHEN @input LIKE '%PLATAFORMA PRINCIPAL%' 
          OR @input LIKE '%PLATAFORMA DE POPA%'
          OR @input LIKE '%PRAÇA%POPA%'
          OR @input LIKE '%COCKPIT%' THEN 'plataforma_popa'
        WHEN @input LIKE '%SALÃO%' THEN 'salao'
        WHEN @input LIKE '%ÁREA DE JANTAR%' THEN 'area_jantar'
        WHEN @input LIKE '%LAVABO%' THEN 'lavabo'
        WHEN @input LIKE '%COZINHA%' OR @input LIKE '%GALLEY%' THEN 'cozinha_galley'
        WHEN @input LIKE '%ÁREA DA COZINHA%' THEN 'area_cozinha'
        WHEN @input LIKE '%COMANDO PRINCIPAL%' 
          OR @input LIKE '%COMANDO%' 
          OR @input LIKE '%NAVEGAÇÃO%' THEN 'comando_principal'
        WHEN @input LIKE '%FLYBRIDGE%' THEN 'flybridge'
        WHEN @input LIKE '%LOBBY%CONVÉS INFERIOR%' 
          OR @input LIKE '%LOBBY%INFERIOR%' THEN 'lobby_conves_inferior'
        WHEN @input LIKE '%LOBBY%TRIPULAÇÃO%' THEN 'lobby_tripulacao'
        WHEN @input LIKE '%CABINE MASTER%' 
          OR @input LIKE '%CABINE PRINCIPAL%' THEN 'cabine_master'
        WHEN @input LIKE '%CABINE VIP PROA%' THEN 'cabine_vip_proa'
        WHEN @input LIKE '%CABINE VIP%' 
          OR @input LIKE '%CABINES VIP%' THEN 'cabine_vip'
        WHEN @input LIKE '%CABINE%HÓSPEDES%BOMBORDO%' 
          OR @input LIKE '%CABINE HÓSPEDE%BOMBORDO%' THEN 'cabine_hospedes_bombordo'
        WHEN @input LIKE '%CABINE%HÓSPEDES%BORESTE%' 
          OR @input LIKE '%CABINE HÓSPEDE%BORESTE%' THEN 'cabine_hospedes_boreste'
        WHEN @input LIKE '%CABINE%HÓSPEDE%' THEN 'cabine_hospedes_bombordo'
        WHEN @input LIKE '%CABINE%CAPITÃO%' THEN 'cabine_capitao'
        WHEN @input LIKE '%CABINE%TRIPULAÇÃO%' 
          OR @input LIKE '%CABINE%MARINHEIRO%' THEN 'cabine_tripulacao'
        WHEN @input LIKE '%BANHEIRO MASTER%' 
          OR @input LIKE '%WC%MASTER%'
          OR @input LIKE '%WC CABINE MASTER%' THEN 'banheiro_master'
        WHEN @input LIKE '%BANHEIRO VIP%' 
          OR @input LIKE '%WC VIP%'
          OR @input LIKE '%BANHEIROS VIP%' THEN 'banheiro_vip'
        WHEN @input LIKE '%BANHEIRO%HÓSPEDES%BOMBORDO%' THEN 'banheiro_hospedes_bombordo'
        WHEN @input LIKE '%BANHEIRO%HÓSPEDES%BORESTE%' THEN 'banheiro_hospedes_boreste'
        WHEN @input LIKE '%BANHEIRO%HÓSPEDES%COMPARTILHADO%' 
          OR @input LIKE '%BANHEIROS%HÓSPEDES%'
          OR @input LIKE '%WC%HÓSPEDE%' THEN 'banheiro_hospedes_compartilhado'
        WHEN @input LIKE '%BANHEIRO%CAPITÃO%' THEN 'banheiro_capitao'
        WHEN @input LIKE '%BANHEIRO%TRIPULAÇÃO%' THEN 'banheiro_tripulacao'
        WHEN @input LIKE '%SALA DE MÁQUINAS%' 
          OR @input LIKE '%CASA%MÁQUINA%'
          OR @input LIKE '%ÁREA TÉCNICA%' THEN 'sala_maquinas'
        WHEN @input LIKE '%GARAGEM%' THEN 'garagem'
        WHEN @input LIKE '%PROPULSÃO%' 
          OR @input LIKE '%PROPULSOR%' THEN 'propulsao_controle'
        WHEN @input LIKE '%ESTABILIZAÇÃO%' THEN 'sistema_estabilizacao'
        WHEN @input LIKE '%EQUIPAMENTOS ELETRÔNICOS%' THEN 'equipamentos_eletronicos'
        WHEN @input LIKE '%EXTINÇÃO%' OR @input LIKE '%INCÊNDIO%' THEN 'sistema_extincao_incendio'
        WHEN @input LIKE '%AR-CONDICIONADO%' OR @input LIKE '%AR CONDICIONADO%' THEN 'sistema_ar_condicionado'
        WHEN @input LIKE '%BOMBAS%PORÃO%' THEN 'sistema_bombas_porao'
        WHEN @input LIKE '%ÁGUA%' OR @input LIKE '%SANITÁRIO%' THEN 'sistema_agua_sanitario'
        WHEN @input LIKE '%ELÉTRICA%' OR @input LIKE '%ELÉTRICO%' THEN 'eletrica'
        WHEN @input LIKE '%SEGURANÇA%' OR @input LIKE '%SALVATAGEM%' THEN 'seguranca'
        WHEN @input LIKE '%AUDIOVISUAL%' OR @input LIKE '%ENTRETENIMENTO%' THEN 'audiovisual_entretenimento'
        WHEN @input LIKE '%CASCO%CONVÉS%' 
          OR @input LIKE '%CASCO%DECK%'
          OR @input LIKE '%ESTRUTURA%' THEN 'casco_estrutura'
        WHEN @input LIKE '%CARACTERÍSTICAS EXTERNAS%' 
          OR @input LIKE '%EXTERIOR%' THEN 'caracteristicas_externas'
        WHEN @input LIKE '%OPCIONAIS%' 
          OR @input LIKE '%DIVERSOS%'
          OR @input LIKE '%CORREDOR%' THEN 'outros'
        ELSE 'outros'
    END;
    
    RETURN @result;
END;
GO

PRINT 'Função fn_normalize_memorial_category criada com sucesso';
GO


-- =====================================================
-- PARTE 2: STORED PROCEDURES
-- =====================================================

PRINT '';
PRINT '=== PARTE 2: STORED PROCEDURES ===';
GO

-- -----------------------------------------------------
-- 2.1 Procedure: sp_reset_role_permissions_to_default
-- Reseta as permissões de uma role para o padrão
-- Equivalente PostgreSQL: reset_role_permissions_to_default(_role app_role)
-- -----------------------------------------------------
IF OBJECT_ID('dbo.sp_reset_role_permissions_to_default', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reset_role_permissions_to_default;
GO

CREATE PROCEDURE dbo.sp_reset_role_permissions_to_default
    @role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Deletar todas as permissões customizadas desta role
        DELETE FROM dbo.role_permissions_config
        WHERE role = @role AND is_default = 0;
        
        -- Restaurar is_default = 1 para as restantes
        UPDATE dbo.role_permissions_config
        SET is_default = 1, updated_at = GETDATE()
        WHERE role = @role;
        
        COMMIT TRANSACTION;
        
        PRINT 'Permissões da role ' + @role + ' resetadas para o padrão.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

PRINT 'Procedure sp_reset_role_permissions_to_default criada com sucesso';
GO

-- -----------------------------------------------------
-- 2.2 Procedure: sp_update_yacht_models_order
-- Atualiza a ordem de exibição dos modelos de iate
-- Equivalente PostgreSQL: update_yacht_models_order(updates jsonb)
-- NOTA: Recebe JSON como string e processa com OPENJSON
-- -----------------------------------------------------
IF OBJECT_ID('dbo.sp_update_yacht_models_order', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_update_yacht_models_order;
GO

CREATE PROCEDURE dbo.sp_update_yacht_models_order
    @updates NVARCHAR(MAX)  -- JSON array: [{"id": "uuid", "display_order": 1}, ...]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Processar o JSON e atualizar cada registro
        UPDATE ym
        SET 
            ym.display_order = CAST(j.display_order AS INT),
            ym.updated_at = GETDATE()
        FROM dbo.yacht_models ym
        INNER JOIN OPENJSON(@updates)
        WITH (
            id UNIQUEIDENTIFIER '$.id',
            display_order INT '$.display_order'
        ) j ON ym.id = j.id;
        
        COMMIT TRANSACTION;
        
        PRINT 'Ordem dos modelos atualizada com sucesso.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

PRINT 'Procedure sp_update_yacht_models_order criada com sucesso';
GO

-- -----------------------------------------------------
-- 2.3 Procedure: sp_handle_new_user
-- Cria registro na tabela users quando novo usuário é criado
-- Equivalente PostgreSQL: handle_new_user() trigger function
-- NOTA: Chamar manualmente após criar usuário na tabela de auth
-- -----------------------------------------------------
IF OBJECT_ID('dbo.sp_handle_new_user', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_handle_new_user;
GO

CREATE PROCEDURE dbo.sp_handle_new_user
    @user_id UNIQUEIDENTIFIER,
    @email NVARCHAR(255),
    @full_name NVARCHAR(255) = NULL,
    @department NVARCHAR(100) = 'Comercial'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Inserir usuário se não existir
    IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = @user_id)
    BEGIN
        INSERT INTO dbo.users (id, email, full_name, department, is_active)
        VALUES (
            @user_id,
            @email,
            ISNULL(@full_name, @email),
            ISNULL(@department, 'Comercial'),
            1
        );
        
        PRINT 'Usuário ' + @email + ' criado com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'Usuário ' + @email + ' já existe.';
    END
END;
GO

PRINT 'Procedure sp_handle_new_user criada com sucesso';
GO

-- -----------------------------------------------------
-- 2.4 Procedure: sp_create_audit_log
-- Insere registro de auditoria manualmente
-- Equivalente PostgreSQL: audit_trigger_func()
-- NOTA: Chamar após operações para auditoria manual
-- -----------------------------------------------------
IF OBJECT_ID('dbo.sp_create_audit_log', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_create_audit_log;
GO

CREATE PROCEDURE dbo.sp_create_audit_log
    @user_id UNIQUEIDENTIFIER = NULL,
    @user_email NVARCHAR(255) = NULL,
    @user_name NVARCHAR(255) = NULL,
    @action NVARCHAR(50),  -- INSERT, UPDATE, DELETE
    @table_name NVARCHAR(100),
    @record_id UNIQUEIDENTIFIER = NULL,
    @old_values NVARCHAR(MAX) = NULL,  -- JSON
    @new_values NVARCHAR(MAX) = NULL,  -- JSON
    @changed_fields NVARCHAR(MAX) = NULL  -- JSON array
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.audit_logs (
        id,
        user_id,
        user_email,
        user_name,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        changed_fields,
        created_at
    )
    VALUES (
        NEWID(),
        @user_id,
        @user_email,
        @user_name,
        @action,
        @table_name,
        @record_id,
        @old_values,
        @new_values,
        @changed_fields,
        GETDATE()
    );
END;
GO

PRINT 'Procedure sp_create_audit_log criada com sucesso';
GO


-- =====================================================
-- PARTE 3: VIEWS
-- =====================================================

PRINT '';
PRINT '=== PARTE 3: VIEWS ===';
GO

-- -----------------------------------------------------
-- 3.1 View: admin_dashboard_stats
-- Estatísticas gerais para o dashboard administrativo
-- Equivalente PostgreSQL: admin_dashboard_stats
-- -----------------------------------------------------
IF OBJECT_ID('dbo.admin_dashboard_stats', 'V') IS NOT NULL
    DROP VIEW dbo.admin_dashboard_stats;
GO

CREATE VIEW dbo.admin_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM dbo.yacht_models WHERE is_active = 1) AS models_count,
    (SELECT COUNT(*) FROM dbo.memorial_categories WHERE is_active = 1) AS categories_count,
    (SELECT COUNT(*) FROM dbo.options WHERE is_active = 1) AS options_count,
    (SELECT COUNT(*) FROM dbo.quotations) AS quotations_count,
    (SELECT COUNT(*) FROM dbo.users WHERE is_active = 1) AS users_count,
    (SELECT COUNT(*) FROM dbo.contracts WHERE status = 'active') AS contracts_count;
GO

PRINT 'View admin_dashboard_stats criada com sucesso';
GO

-- -----------------------------------------------------
-- 3.2 View: contract_stats
-- Estatísticas de contratos e ATOs
-- Equivalente PostgreSQL: contract_stats
-- -----------------------------------------------------
IF OBJECT_ID('dbo.contract_stats', 'V') IS NOT NULL
    DROP VIEW dbo.contract_stats;
GO

CREATE VIEW dbo.contract_stats AS
SELECT 
    COUNT(DISTINCT c.id) AS total_contracts,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS active_contracts,
    COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) AS completed_contracts,
    COUNT(DISTINCT CASE WHEN c.status = 'cancelled' THEN c.id END) AS cancelled_contracts,
    ISNULL(SUM(DISTINCT c.current_total_price), 0) AS total_revenue,
    COUNT(a.id) AS total_atos,
    COUNT(CASE WHEN a.status IN ('draft', 'pending_approval') THEN a.id END) AS pending_atos,
    COUNT(CASE WHEN a.status = 'approved' THEN a.id END) AS approved_atos,
    COUNT(CASE WHEN a.status = 'rejected' THEN a.id END) AS rejected_atos,
    ISNULL(SUM(CASE WHEN a.status = 'approved' THEN a.price_impact ELSE 0 END), 0) AS total_ato_revenue,
    ISNULL(AVG(CAST(c.current_total_delivery_days AS DECIMAL(18,2))), 0) AS avg_delivery_days
FROM dbo.contracts c
LEFT JOIN dbo.additional_to_orders a ON a.contract_id = c.id;
GO

PRINT 'View contract_stats criada com sucesso';
GO

-- -----------------------------------------------------
-- 3.3 View: live_contracts
-- Contratos ativos com agregação de ATOs
-- Equivalente PostgreSQL: live_contracts
-- -----------------------------------------------------
IF OBJECT_ID('dbo.live_contracts', 'V') IS NOT NULL
    DROP VIEW dbo.live_contracts;
GO

CREATE VIEW dbo.live_contracts AS
SELECT 
    c.id,
    c.id AS contract_id,
    c.contract_number,
    c.status,
    c.base_price,
    c.current_total_price,
    c.base_delivery_days,
    c.current_total_delivery_days,
    c.client_id,
    c.yacht_model_id,
    c.quotation_id,
    c.hull_number_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.signed_at,
    c.signed_by_name,
    c.signed_by_email,
    c.delivery_status,
    c.delivered_at,
    c.delivered_by,
    c.delivery_notes,
    c.base_snapshot,
    -- Agregação de ATOs
    ISNULL(ato_agg.ato_count, 0) AS ato_count,
    ISNULL(ato_agg.approved_ato_count, 0) AS approved_ato_count,
    ISNULL(ato_agg.pending_ato_count, 0) AS pending_ato_count,
    ISNULL(ato_agg.total_ato_price_impact, 0) AS total_ato_price_impact,
    ISNULL(ato_agg.total_ato_delivery_impact, 0) AS total_ato_delivery_impact
FROM dbo.contracts c
OUTER APPLY (
    SELECT 
        COUNT(*) AS ato_count,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) AS approved_ato_count,
        COUNT(CASE WHEN a.status IN ('draft', 'pending_approval') THEN 1 END) AS pending_ato_count,
        ISNULL(SUM(CASE WHEN a.status = 'approved' THEN a.price_impact ELSE 0 END), 0) AS total_ato_price_impact,
        ISNULL(SUM(CASE WHEN a.status = 'approved' THEN a.delivery_days_impact ELSE 0 END), 0) AS total_ato_delivery_impact
    FROM dbo.additional_to_orders a
    WHERE a.contract_id = c.id
) ato_agg
WHERE c.status = 'active';
GO

PRINT 'View live_contracts criada com sucesso';
GO

-- -----------------------------------------------------
-- 3.4 View: quotation_stats
-- Estatísticas de cotações
-- Equivalente PostgreSQL: quotation_stats
-- -----------------------------------------------------
IF OBJECT_ID('dbo.quotation_stats', 'V') IS NOT NULL
    DROP VIEW dbo.quotation_stats;
GO

CREATE VIEW dbo.quotation_stats AS
SELECT 
    COUNT(*) AS total_quotations,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_count,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) AS sent_count,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) AS accepted_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_count,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) AS expired_count,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) AS converted_count,
    ISNULL(SUM(final_price), 0) AS total_value,
    ISNULL(AVG(final_price), 0) AS average_value,
    -- Cotações expirando nos próximos 7 dias
    COUNT(CASE 
        WHEN status IN ('draft', 'sent') 
         AND valid_until >= GETDATE() 
         AND valid_until <= DATEADD(DAY, 7, GETDATE()) 
        THEN 1 
    END) AS expiring_soon_count,
    -- Cotações criadas nos últimos 30 dias
    COUNT(CASE 
        WHEN created_at >= DATEADD(DAY, -30, GETDATE()) 
        THEN 1 
    END) AS last_30_days_count,
    -- Taxa de conversão
    CASE 
        WHEN COUNT(CASE WHEN status IN ('sent', 'accepted', 'rejected', 'converted') THEN 1 END) > 0
        THEN CAST(COUNT(CASE WHEN status IN ('accepted', 'converted') THEN 1 END) AS DECIMAL(5,2)) 
             / COUNT(CASE WHEN status IN ('sent', 'accepted', 'rejected', 'converted') THEN 1 END) * 100
        ELSE 0 
    END AS conversion_rate
FROM dbo.quotations;
GO

PRINT 'View quotation_stats criada com sucesso';
GO


-- =====================================================
-- PARTE 4: TRIGGERS
-- =====================================================

PRINT '';
PRINT '=== PARTE 4: TRIGGERS ===';
GO

-- -----------------------------------------------------
-- 4.1 Trigger Template: trg_set_updated_at
-- Atualiza automaticamente o campo updated_at
-- Equivalente PostgreSQL: set_updated_at() / update_updated_at_column()
-- NOTA: Criar este trigger para cada tabela que precisa de updated_at
-- -----------------------------------------------------

-- Exemplo para tabela yacht_models
IF OBJECT_ID('dbo.trg_yacht_models_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_yacht_models_updated_at;
GO

CREATE TRIGGER dbo.trg_yacht_models_updated_at
ON dbo.yacht_models
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE ym
    SET updated_at = GETDATE()
    FROM dbo.yacht_models ym
    INNER JOIN inserted i ON ym.id = i.id;
END;
GO

PRINT 'Trigger trg_yacht_models_updated_at criado com sucesso';
GO

-- Exemplo para tabela contracts
IF OBJECT_ID('dbo.trg_contracts_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_contracts_updated_at;
GO

CREATE TRIGGER dbo.trg_contracts_updated_at
ON dbo.contracts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE c
    SET updated_at = GETDATE()
    FROM dbo.contracts c
    INNER JOIN inserted i ON c.id = i.id;
END;
GO

PRINT 'Trigger trg_contracts_updated_at criado com sucesso';
GO

-- Exemplo para tabela quotations
IF OBJECT_ID('dbo.trg_quotations_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_quotations_updated_at;
GO

CREATE TRIGGER dbo.trg_quotations_updated_at
ON dbo.quotations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE q
    SET updated_at = GETDATE()
    FROM dbo.quotations q
    INNER JOIN inserted i ON q.id = i.id;
END;
GO

PRINT 'Trigger trg_quotations_updated_at criado com sucesso';
GO

-- Exemplo para tabela options
IF OBJECT_ID('dbo.trg_options_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_options_updated_at;
GO

CREATE TRIGGER dbo.trg_options_updated_at
ON dbo.options
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE o
    SET updated_at = GETDATE()
    FROM dbo.options o
    INNER JOIN inserted i ON o.id = i.id;
END;
GO

PRINT 'Trigger trg_options_updated_at criado com sucesso';
GO

-- Exemplo para tabela clients
IF OBJECT_ID('dbo.trg_clients_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_clients_updated_at;
GO

CREATE TRIGGER dbo.trg_clients_updated_at
ON dbo.clients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE c
    SET updated_at = GETDATE()
    FROM dbo.clients c
    INNER JOIN inserted i ON c.id = i.id;
END;
GO

PRINT 'Trigger trg_clients_updated_at criado com sucesso';
GO

-- -----------------------------------------------------
-- 4.2 Trigger: trg_update_hull_number_on_contract
-- Atualiza status da matrícula quando contrato é criado/alterado/deletado
-- Equivalente PostgreSQL: update_hull_number_on_contract()
-- -----------------------------------------------------
IF OBJECT_ID('dbo.trg_contracts_hull_number_insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_contracts_hull_number_insert;
GO

CREATE TRIGGER dbo.trg_contracts_hull_number_insert
ON dbo.contracts
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Quando contrato é criado, marcar matrícula como 'contracted'
    UPDATE hn
    SET 
        status = 'contracted',
        contract_id = i.id
    FROM dbo.hull_numbers hn
    INNER JOIN inserted i ON hn.id = i.hull_number_id
    WHERE i.hull_number_id IS NOT NULL;
END;
GO

PRINT 'Trigger trg_contracts_hull_number_insert criado com sucesso';
GO

IF OBJECT_ID('dbo.trg_contracts_hull_number_update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_contracts_hull_number_update;
GO

CREATE TRIGGER dbo.trg_contracts_hull_number_update
ON dbo.contracts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Liberar matrícula antiga
    UPDATE hn
    SET 
        status = 'available',
        contract_id = NULL
    FROM dbo.hull_numbers hn
    INNER JOIN deleted d ON hn.id = d.hull_number_id
    LEFT JOIN inserted i ON d.id = i.id
    WHERE d.hull_number_id IS NOT NULL 
      AND (i.hull_number_id IS NULL OR d.hull_number_id <> i.hull_number_id);
    
    -- Reservar nova matrícula
    UPDATE hn
    SET 
        status = 'contracted',
        contract_id = i.id
    FROM dbo.hull_numbers hn
    INNER JOIN inserted i ON hn.id = i.hull_number_id
    LEFT JOIN deleted d ON i.id = d.id
    WHERE i.hull_number_id IS NOT NULL 
      AND (d.hull_number_id IS NULL OR d.hull_number_id <> i.hull_number_id);
END;
GO

PRINT 'Trigger trg_contracts_hull_number_update criado com sucesso';
GO

IF OBJECT_ID('dbo.trg_contracts_hull_number_delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_contracts_hull_number_delete;
GO

CREATE TRIGGER dbo.trg_contracts_hull_number_delete
ON dbo.contracts
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Quando contrato é deletado, liberar matrícula
    UPDATE hn
    SET 
        status = 'available',
        contract_id = NULL
    FROM dbo.hull_numbers hn
    INNER JOIN deleted d ON hn.id = d.hull_number_id
    WHERE d.hull_number_id IS NOT NULL;
END;
GO

PRINT 'Trigger trg_contracts_hull_number_delete criado com sucesso';
GO

-- -----------------------------------------------------
-- 4.3 Trigger: trg_create_customization_workflow_step
-- Cria step de workflow quando customização é inserida
-- Equivalente PostgreSQL: create_customization_workflow_step()
-- -----------------------------------------------------
IF OBJECT_ID('dbo.trg_quotation_customizations_workflow', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_quotation_customizations_workflow;
GO

CREATE TRIGGER dbo.trg_quotation_customizations_workflow
ON dbo.quotation_customizations
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Buscar o PM responsável pelo modelo do iate desta customização
    INSERT INTO dbo.customization_workflow_steps (
        id,
        customization_id, 
        step_type, 
        status, 
        assigned_to,
        created_at
    )
    SELECT 
        NEWID(),
        i.id,
        'pm_review',
        'pending',
        pm.pm_user_id,
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.quotations q ON q.id = i.quotation_id
    INNER JOIN dbo.pm_yacht_model_assignments pm ON pm.yacht_model_id = q.yacht_model_id
    WHERE pm.pm_user_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM dbo.customization_workflow_steps cws 
          WHERE cws.customization_id = i.id AND cws.step_type = 'pm_review'
      );
END;
GO

PRINT 'Trigger trg_quotation_customizations_workflow criado com sucesso';
GO

-- -----------------------------------------------------
-- 4.4 Trigger: trg_create_ato_workflow_steps
-- Cria steps de workflow quando ATO é inserido
-- Equivalente PostgreSQL: create_ato_workflow_steps()
-- -----------------------------------------------------
IF OBJECT_ID('dbo.trg_additional_to_orders_workflow', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_additional_to_orders_workflow;
GO

CREATE TRIGGER dbo.trg_additional_to_orders_workflow
ON dbo.additional_to_orders
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Se a ATO tem workflow_status inicial, criar steps
    INSERT INTO dbo.ato_workflow_steps (
        id,
        ato_id, 
        step_type, 
        status, 
        assigned_to,
        created_at
    )
    SELECT 
        NEWID(),
        i.id,
        'pm_review',
        'pending',
        pm.pm_user_id,
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.contracts c ON c.id = i.contract_id
    INNER JOIN dbo.pm_yacht_model_assignments pm ON pm.yacht_model_id = c.yacht_model_id
    WHERE i.workflow_status IS NOT NULL
      AND pm.pm_user_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM dbo.ato_workflow_steps aws 
          WHERE aws.ato_id = i.id AND aws.step_type = 'pm_review'
      );
END;
GO

PRINT 'Trigger trg_additional_to_orders_workflow criado com sucesso';
GO


-- =====================================================
-- PARTE 5: SCRIPTS AUXILIARES
-- =====================================================

PRINT '';
PRINT '=== PARTE 5: SCRIPTS AUXILIARES ===';
GO

-- -----------------------------------------------------
-- 5.1 Script para criar triggers updated_at em todas as tabelas
-- Execute este bloco para gerar os scripts de triggers
-- -----------------------------------------------------

/*
-- Listar todas as tabelas que têm coluna updated_at
SELECT 
    t.name AS table_name,
    'CREATE TRIGGER dbo.trg_' + t.name + '_updated_at ON dbo.' + t.name + ' AFTER UPDATE AS BEGIN SET NOCOUNT ON; UPDATE tbl SET updated_at = GETDATE() FROM dbo.' + t.name + ' tbl INNER JOIN inserted i ON tbl.id = i.id; END;' AS trigger_script
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
WHERE c.name = 'updated_at'
  AND t.schema_id = SCHEMA_ID('dbo')
ORDER BY t.name;
*/

-- -----------------------------------------------------
-- 5.2 Função auxiliar para verificar permissão
-- Útil para implementar controle de acesso na aplicação
-- -----------------------------------------------------
IF OBJECT_ID('dbo.fn_has_permission', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_has_permission;
GO

CREATE FUNCTION dbo.fn_has_permission (
    @user_id UNIQUEIDENTIFIER,
    @permission NVARCHAR(100)
)
RETURNS BIT
AS
BEGIN
    DECLARE @result BIT = 0;
    
    -- Verificar se usuário é admin (tem todas as permissões)
    IF dbo.fn_is_admin(@user_id) = 1
    BEGIN
        SET @result = 1;
    END
    ELSE
    BEGIN
        -- Verificar permissão específica
        IF EXISTS (
            SELECT 1 FROM dbo.fn_get_effective_permissions(@user_id)
            WHERE permission = @permission
        )
        BEGIN
            SET @result = 1;
        END
    END
    
    RETURN @result;
END;
GO

PRINT 'Função fn_has_permission criada com sucesso';
GO


-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

PRINT '';
PRINT '=== VERIFICAÇÃO FINAL ===';
PRINT '';

-- Listar objetos criados
SELECT 'FUNÇÃO' AS tipo, name AS objeto, create_date AS criado_em
FROM sys.objects 
WHERE type IN ('FN', 'TF', 'IF') AND schema_id = SCHEMA_ID('dbo')
  AND name LIKE 'fn_%'
UNION ALL
SELECT 'PROCEDURE' AS tipo, name, create_date
FROM sys.objects 
WHERE type = 'P' AND schema_id = SCHEMA_ID('dbo')
  AND name LIKE 'sp_%'
UNION ALL
SELECT 'VIEW' AS tipo, name, create_date
FROM sys.objects 
WHERE type = 'V' AND schema_id = SCHEMA_ID('dbo')
UNION ALL
SELECT 'TRIGGER' AS tipo, name, create_date
FROM sys.objects 
WHERE type = 'TR' AND schema_id = SCHEMA_ID('dbo')
  AND name LIKE 'trg_%'
ORDER BY tipo, objeto;

PRINT '';
PRINT '=== MIGRAÇÃO DE OBJETOS CONCLUÍDA COM SUCESSO ===';
PRINT '';
PRINT 'Objetos criados:';
PRINT '  - 6 Funções (fn_has_role, fn_is_admin, fn_get_effective_permissions, fn_get_yacht_model_id, fn_normalize_memorial_category, fn_has_permission)';
PRINT '  - 4 Stored Procedures (sp_reset_role_permissions_to_default, sp_update_yacht_models_order, sp_handle_new_user, sp_create_audit_log)';
PRINT '  - 4 Views (admin_dashboard_stats, contract_stats, live_contracts, quotation_stats)';
PRINT '  - 10 Triggers (updated_at e workflows)';
PRINT '';
PRINT 'NOTAS IMPORTANTES:';
PRINT '  1. As funções que usavam auth.uid() agora recebem @user_id como parâmetro';
PRINT '  2. RLS (Row Level Security) não foi migrado - implementar via Views filtradas ou Procedures';
PRINT '  3. Triggers de auditoria (audit_logs) devem ser chamados manualmente via sp_create_audit_log';
PRINT '  4. Para adicionar updated_at triggers em outras tabelas, use o template fornecido';
PRINT '';
GO
