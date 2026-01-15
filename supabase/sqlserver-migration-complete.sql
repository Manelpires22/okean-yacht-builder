-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Generated: 2026-01-13
-- Source: Supabase PostgreSQL
-- =============================================
-- 
-- INSTRUCTIONS:
-- 1. Open this file in SQL Server Management Studio (SSMS)
-- 2. Connect to your target database
-- 3. Execute the script (F5)
-- 4. Verify tables and data were created successfully
--
-- NOTE: This script includes DDL (structure) and DML (data)
-- Large tables (audit_logs, memorial_items) are in separate files
-- =============================================

SET NOCOUNT ON;
GO

-- =============================================
-- PART 1: DROP EXISTING TABLES (Optional)
-- Uncomment these lines to clean before import
-- =============================================

/*
-- Drop in reverse dependency order
DROP TABLE IF EXISTS [dbo].[ato_workflow_steps];
DROP TABLE IF EXISTS [dbo].[ato_configurations];
DROP TABLE IF EXISTS [dbo].[additional_to_orders];
DROP TABLE IF EXISTS [dbo].[contract_delivery_checklist];
DROP TABLE IF EXISTS [dbo].[customization_workflow_steps];
DROP TABLE IF EXISTS [dbo].[quotation_customizations];
DROP TABLE IF EXISTS [dbo].[quotation_upgrades];
DROP TABLE IF EXISTS [dbo].[quotation_options];
DROP TABLE IF EXISTS [dbo].[quotations];
DROP TABLE IF EXISTS [dbo].[contracts];
DROP TABLE IF EXISTS [dbo].[simulations];
DROP TABLE IF EXISTS [dbo].[hull_numbers];
DROP TABLE IF EXISTS [dbo].[memorial_upgrades];
DROP TABLE IF EXISTS [dbo].[memorial_items];
DROP TABLE IF EXISTS [dbo].[options];
DROP TABLE IF EXISTS [dbo].[pm_yacht_model_assignments];
DROP TABLE IF EXISTS [dbo].[simulator_model_costs];
DROP TABLE IF EXISTS [dbo].[yacht_models];
DROP TABLE IF EXISTS [dbo].[memorial_categories];
DROP TABLE IF EXISTS [dbo].[job_stops];
DROP TABLE IF EXISTS [dbo].[option_categories];
DROP TABLE IF EXISTS [dbo].[clients];
DROP TABLE IF EXISTS [dbo].[user_roles];
DROP TABLE IF EXISTS [dbo].[users];
DROP TABLE IF EXISTS [dbo].[role_permissions_config];
DROP TABLE IF EXISTS [dbo].[discount_limits_config];
DROP TABLE IF EXISTS [dbo].[workflow_config];
DROP TABLE IF EXISTS [dbo].[workflow_settings];
DROP TABLE IF EXISTS [dbo].[system_config];
DROP TABLE IF EXISTS [dbo].[simulator_commissions];
DROP TABLE IF EXISTS [dbo].[simulator_business_rules];
DROP TABLE IF EXISTS [dbo].[simulator_exchange_rates];
DROP TABLE IF EXISTS [dbo].[pdf_template_versions];
DROP TABLE IF EXISTS [dbo].[pdf_templates];
DROP TABLE IF EXISTS [dbo].[pdf_generated];
DROP TABLE IF EXISTS [dbo].[approvals_backup];
DROP TABLE IF EXISTS [dbo].[audit_logs];
DROP TABLE IF EXISTS [dbo].[mfa_recovery_codes];
GO
*/

-- =============================================
-- PART 2: CREATE TABLES
-- =============================================

PRINT 'Creating tables...';
GO

-- --------------------------------------------
-- Table: users
-- --------------------------------------------
CREATE TABLE [dbo].[users] (
  [id] UNIQUEIDENTIFIER NOT NULL,
  [email] NVARCHAR(255) NOT NULL,
  [full_name] NVARCHAR(255) NULL,
  [department] NVARCHAR(100) NULL,
  [is_active] BIT NOT NULL DEFAULT 1,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_users] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: user_roles
-- --------------------------------------------
CREATE TABLE [dbo].[user_roles] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [role] VARCHAR(50) NOT NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_user_roles] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_user_roles_role] CHECK ([role] IN ('administrador', 'gerente_comercial', 'vendedor', 'engenheiro', 'diretor_comercial', 'pm'))
);
GO

-- --------------------------------------------
-- Table: clients
-- --------------------------------------------
CREATE TABLE [dbo].[clients] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [name] NVARCHAR(255) NOT NULL,
  [email] NVARCHAR(255) NULL,
  [phone] NVARCHAR(50) NULL,
  [company] NVARCHAR(255) NULL,
  [cpf] NVARCHAR(20) NULL,
  [notes] NVARCHAR(MAX) NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_clients] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: yacht_models
-- --------------------------------------------
CREATE TABLE [dbo].[yacht_models] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [name] NVARCHAR(255) NOT NULL,
  [code] NVARCHAR(50) NOT NULL,
  [brand] NVARCHAR(100) NULL,
  [model] NVARCHAR(100) NULL,
  [description] NVARCHAR(MAX) NULL,
  [base_price] DECIMAL(18,2) NOT NULL,
  [base_delivery_days] INT NOT NULL DEFAULT 180,
  [image_url] NVARCHAR(500) NULL,
  [is_active] BIT NOT NULL DEFAULT 1,
  [display_order] INT NOT NULL DEFAULT 0,
  [length_overall] DECIMAL(10,2) NULL,
  [beam] DECIMAL(10,2) NULL,
  [draft] DECIMAL(10,2) NULL,
  [displacement_light] DECIMAL(18,2) NULL,
  [displacement_loaded] DECIMAL(18,2) NULL,
  [fuel_capacity] INT NULL,
  [water_capacity] INT NULL,
  [max_speed] INT NULL,
  [cruise_speed] INT NULL,
  [range_nautical_miles] INT NULL,
  [engines] NVARCHAR(500) NULL,
  [cabins] NVARCHAR(50) NULL,
  [bathrooms] NVARCHAR(50) NULL,
  [passengers_capacity] INT NULL,
  [hull_color] NVARCHAR(100) NULL,
  [hull_length] DECIMAL(10,2) NULL,
  [height_from_waterline] DECIMAL(10,2) NULL,
  [dry_weight] DECIMAL(18,2) NULL,
  [registration_number] NVARCHAR(100) NULL,
  [delivery_date] DATE NULL,
  [exterior_images] NVARCHAR(MAX) NULL,
  [interior_images] NVARCHAR(MAX) NULL,
  [gallery_images] NVARCHAR(MAX) NULL,
  [technical_specifications] NVARCHAR(MAX) NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_yacht_models] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: memorial_categories
-- --------------------------------------------
CREATE TABLE [dbo].[memorial_categories] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [value] NVARCHAR(100) NOT NULL,
  [label] NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(500) NULL,
  [icon] NVARCHAR(100) NULL,
  [display_order] INT NOT NULL,
  [is_active] BIT NOT NULL DEFAULT 1,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_memorial_categories] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: job_stops
-- --------------------------------------------
CREATE TABLE [dbo].[job_stops] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [item_name] NVARCHAR(255) NOT NULL,
  [stage] NVARCHAR(50) NULL,
  [days_limit] INT NULL,
  [display_order] INT NOT NULL,
  [is_active] BIT NOT NULL DEFAULT 1,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_job_stops] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: option_categories (deprecated)
-- --------------------------------------------
CREATE TABLE [dbo].[option_categories] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [name] NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(500) NULL,
  [display_order] INT NOT NULL,
  [is_active] BIT NOT NULL DEFAULT 1,
  [deprecated_at] DATETIMEOFFSET NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_option_categories] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: memorial_items
-- --------------------------------------------
CREATE TABLE [dbo].[memorial_items] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
  [category_id] UNIQUEIDENTIFIER NOT NULL,
  [category] VARCHAR(100) NOT NULL,
  [item_name] NVARCHAR(500) NOT NULL,
  [code] NVARCHAR(50) NULL,
  [description] NVARCHAR(MAX) NULL,
  [brand] NVARCHAR(100) NULL,
  [model] NVARCHAR(100) NULL,
  [quantity] INT NULL DEFAULT 1,
  [unit] NVARCHAR(20) NULL,
  [display_order] INT NOT NULL DEFAULT 0,
  [category_display_order] INT NULL,
  [is_active] BIT NOT NULL DEFAULT 1,
  [is_customizable] BIT NULL DEFAULT 0,
  [is_configurable] BIT NULL DEFAULT 0,
  [has_upgrades] BIT NULL DEFAULT 0,
  [image_url] NVARCHAR(500) NULL,
  [images] NVARCHAR(MAX) NULL,
  [configurable_sub_items] NVARCHAR(MAX) NULL,
  [technical_specs] NVARCHAR(MAX) NULL,
  [job_stop_id] UNIQUEIDENTIFIER NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_memorial_items] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_memorial_items_category] CHECK ([category] IN (
    'deck_principal', 'comando_principal', 'cozinha_galley', 'salao', 'area_jantar', 'lavabo',
    'cabine_master', 'banheiro_master', 'cabine_vip', 'banheiro_vip', 'cabine_hospedes_bombordo',
    'banheiro_hospedes_bombordo', 'cabine_hospedes_boreste', 'banheiro_hospedes_boreste',
    'banheiro_hospedes_compartilhado', 'flybridge', 'plataforma_popa', 'lobby_conves_inferior',
    'lobby_tripulacao', 'cabine_capitao', 'banheiro_capitao', 'cabine_tripulacao', 'banheiro_tripulacao',
    'sala_maquinas', 'garagem', 'propulsao_controle', 'sistema_estabilizacao', 'eletrica',
    'sistema_ar_condicionado', 'sistema_agua_sanitario', 'sistema_bombas_porao', 'sistema_extincao_incendio',
    'seguranca', 'audiovisual_entretenimento', 'equipamentos_eletronicos', 'casco_estrutura',
    'caracteristicas_externas', 'cabine_vip_proa', 'conves_principal', 'area_cozinha', 'outros'
  ))
);
GO

-- --------------------------------------------
-- Table: memorial_upgrades
-- --------------------------------------------
CREATE TABLE [dbo].[memorial_upgrades] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
  [memorial_item_id] UNIQUEIDENTIFIER NULL,
  [code] NVARCHAR(50) NOT NULL,
  [name] NVARCHAR(500) NOT NULL,
  [description] NVARCHAR(MAX) NULL,
  [brand] NVARCHAR(100) NULL,
  [model] NVARCHAR(100) NULL,
  [price] DECIMAL(18,2) NOT NULL DEFAULT 0,
  [cost] DECIMAL(18,2) NULL,
  [delivery_days_impact] INT NULL DEFAULT 0,
  [display_order] INT NULL DEFAULT 0,
  [is_active] BIT NOT NULL DEFAULT 1,
  [allow_multiple] BIT NULL DEFAULT 0,
  [is_customizable] BIT NULL DEFAULT 0,
  [is_configurable] BIT NULL DEFAULT 0,
  [image_url] NVARCHAR(500) NULL,
  [images] NVARCHAR(MAX) NULL,
  [configurable_sub_items] NVARCHAR(MAX) NULL,
  [technical_specs] NVARCHAR(MAX) NULL,
  [job_stop_id] UNIQUEIDENTIFIER NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_memorial_upgrades] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: options
-- --------------------------------------------
CREATE TABLE [dbo].[options] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [yacht_model_id] UNIQUEIDENTIFIER NULL,
  [category_id] UNIQUEIDENTIFIER NULL,
  [code] NVARCHAR(50) NOT NULL,
  [name] NVARCHAR(500) NOT NULL,
  [description] NVARCHAR(MAX) NULL,
  [brand] NVARCHAR(100) NULL,
  [model] NVARCHAR(100) NULL,
  [base_price] DECIMAL(18,2) NOT NULL,
  [cost] DECIMAL(18,2) NULL,
  [delivery_days_impact] INT NULL DEFAULT 0,
  [is_active] BIT NOT NULL DEFAULT 1,
  [allow_multiple] BIT NULL DEFAULT 0,
  [is_customizable] BIT NULL DEFAULT 0,
  [is_configurable] BIT NULL DEFAULT 0,
  [image_url] NVARCHAR(500) NULL,
  [images] NVARCHAR(MAX) NULL,
  [configurable_sub_items] NVARCHAR(MAX) NULL,
  [technical_specifications] NVARCHAR(MAX) NULL,
  [job_stop_id] UNIQUEIDENTIFIER NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_options] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: hull_numbers
-- --------------------------------------------
CREATE TABLE [dbo].[hull_numbers] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
  [hull_number] NVARCHAR(50) NOT NULL,
  [brand] NVARCHAR(100) NOT NULL DEFAULT 'OKEAN',
  [status] VARCHAR(50) NOT NULL DEFAULT 'available',
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
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_hull_numbers] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_hull_numbers_status] CHECK ([status] IN ('available', 'reserved', 'contracted', 'delivered'))
);
GO

-- --------------------------------------------
-- Table: quotations
-- --------------------------------------------
CREATE TABLE [dbo].[quotations] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [quotation_number] NVARCHAR(50) NOT NULL,
  [yacht_model_id] UNIQUEIDENTIFIER NULL,
  [client_id] UNIQUEIDENTIFIER NULL,
  [client_name] NVARCHAR(255) NOT NULL,
  [client_email] NVARCHAR(255) NULL,
  [client_phone] NVARCHAR(50) NULL,
  [sales_representative_id] UNIQUEIDENTIFIER NULL,
  [hull_number_id] UNIQUEIDENTIFIER NULL,
  [simulation_id] UNIQUEIDENTIFIER NULL,
  [base_price] DECIMAL(18,2) NOT NULL,
  [base_discount_percentage] DECIMAL(5,2) NULL DEFAULT 0,
  [final_base_price] DECIMAL(18,2) NOT NULL,
  [total_options_price] DECIMAL(18,2) NULL DEFAULT 0,
  [options_discount_percentage] DECIMAL(5,2) NULL DEFAULT 0,
  [final_options_price] DECIMAL(18,2) NULL DEFAULT 0,
  [discount_percentage] DECIMAL(5,2) NULL DEFAULT 0,
  [discount_amount] DECIMAL(18,2) NULL DEFAULT 0,
  [total_customizations_price] DECIMAL(18,2) NULL DEFAULT 0,
  [final_price] DECIMAL(18,2) NOT NULL,
  [base_delivery_days] INT NOT NULL,
  [total_delivery_days] INT NOT NULL,
  [valid_until] DATE NOT NULL,
  [status] VARCHAR(50) NOT NULL DEFAULT 'draft',
  [version] INT NULL DEFAULT 1,
  [parent_quotation_id] UNIQUEIDENTIFIER NULL,
  [secure_token] NVARCHAR(100) NULL,
  [sent_at] DATETIMEOFFSET NULL,
  [accepted_at] DATETIMEOFFSET NULL,
  [accepted_by_name] NVARCHAR(255) NULL,
  [accepted_by_email] NVARCHAR(255) NULL,
  [snapshot_json] NVARCHAR(MAX) NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_quotations] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [UQ_quotations_number] UNIQUE ([quotation_number]),
  CONSTRAINT [CHK_quotations_status] CHECK ([status] IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'accepted', 'expired', 'cancelled', 'converted'))
);
GO

-- --------------------------------------------
-- Table: quotation_options
-- --------------------------------------------
CREATE TABLE [dbo].[quotation_options] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [quotation_id] UNIQUEIDENTIFIER NOT NULL,
  [option_id] UNIQUEIDENTIFIER NOT NULL,
  [quantity] INT NOT NULL DEFAULT 1,
  [unit_price] DECIMAL(18,2) NOT NULL,
  [total_price] DECIMAL(18,2) NOT NULL,
  [delivery_days_impact] INT NULL DEFAULT 0,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_quotation_options] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: quotation_upgrades
-- --------------------------------------------
CREATE TABLE [dbo].[quotation_upgrades] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [quotation_id] UNIQUEIDENTIFIER NOT NULL,
  [upgrade_id] UNIQUEIDENTIFIER NOT NULL,
  [memorial_item_id] UNIQUEIDENTIFIER NOT NULL,
  [price] DECIMAL(18,2) NOT NULL DEFAULT 0,
  [delivery_days_impact] INT NULL DEFAULT 0,
  [customization_notes] NVARCHAR(MAX) NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_quotation_upgrades] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: quotation_customizations
-- --------------------------------------------
CREATE TABLE [dbo].[quotation_customizations] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [quotation_id] UNIQUEIDENTIFIER NOT NULL,
  [customization_code] NVARCHAR(50) NULL,
  [item_name] NVARCHAR(500) NOT NULL,
  [option_id] UNIQUEIDENTIFIER NULL,
  [memorial_item_id] UNIQUEIDENTIFIER NULL,
  [quantity] INT NULL DEFAULT 1,
  [notes] NVARCHAR(MAX) NULL,
  [additional_cost] DECIMAL(18,2) NULL DEFAULT 0,
  [delivery_impact_days] INT NULL DEFAULT 0,
  [status] VARCHAR(50) NULL DEFAULT 'pending',
  [workflow_status] VARCHAR(50) NOT NULL DEFAULT 'pending_pm',
  [file_paths] NVARCHAR(MAX) NULL,
  [attachments] NVARCHAR(MAX) NULL,
  [engineering_notes] NVARCHAR(MAX) NULL,
  [engineering_hours] DECIMAL(10,2) NULL,
  [required_parts] NVARCHAR(MAX) NULL,
  [supply_items] NVARCHAR(MAX) NULL,
  [supply_cost] DECIMAL(18,2) NULL,
  [supply_lead_time_days] INT NULL,
  [supply_notes] NVARCHAR(MAX) NULL,
  [planning_notes] NVARCHAR(MAX) NULL,
  [planning_delivery_impact_days] INT NULL,
  [planning_window_start] NVARCHAR(100) NULL,
  [pm_scope] NVARCHAR(MAX) NULL,
  [pm_final_price] DECIMAL(18,2) NULL,
  [pm_final_delivery_impact_days] INT NULL,
  [pm_final_notes] NVARCHAR(MAX) NULL,
  [reject_reason] NVARCHAR(MAX) NULL,
  [workflow_audit] NVARCHAR(MAX) NULL,
  [reviewed_by] UNIQUEIDENTIFIER NULL,
  [reviewed_at] DATETIMEOFFSET NULL,
  [included_in_contract] BIT NULL DEFAULT 0,
  [ato_id] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_quotation_customizations] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_quotation_customizations_status] CHECK ([status] IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT [CHK_quotation_customizations_workflow] CHECK ([workflow_status] IN ('pending_pm', 'pm_reviewing', 'pm_approved', 'pm_rejected', 'completed', 'cancelled'))
);
GO

-- --------------------------------------------
-- Table: customization_workflow_steps
-- --------------------------------------------
CREATE TABLE [dbo].[customization_workflow_steps] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [customization_id] UNIQUEIDENTIFIER NOT NULL,
  [step_type] VARCHAR(50) NOT NULL,
  [status] VARCHAR(50) NULL DEFAULT 'pending',
  [assigned_to] UNIQUEIDENTIFIER NULL,
  [notes] NVARCHAR(MAX) NULL,
  [response_data] NVARCHAR(MAX) NULL,
  [completed_at] DATETIMEOFFSET NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_customization_workflow_steps] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: contracts
-- --------------------------------------------
CREATE TABLE [dbo].[contracts] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [contract_number] NVARCHAR(50) NOT NULL,
  [quotation_id] UNIQUEIDENTIFIER NOT NULL,
  [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
  [client_id] UNIQUEIDENTIFIER NOT NULL,
  [hull_number_id] UNIQUEIDENTIFIER NULL,
  [base_price] DECIMAL(18,2) NOT NULL,
  [current_total_price] DECIMAL(18,2) NOT NULL,
  [base_delivery_days] INT NOT NULL,
  [current_total_delivery_days] INT NOT NULL,
  [base_snapshot] NVARCHAR(MAX) NULL,
  [status] VARCHAR(50) NOT NULL DEFAULT 'active',
  [delivery_status] VARCHAR(50) NULL DEFAULT 'pending',
  [delivery_notes] NVARCHAR(MAX) NULL,
  [delivered_at] DATETIMEOFFSET NULL,
  [delivered_by] UNIQUEIDENTIFIER NULL,
  [signed_at] DATETIMEOFFSET NULL,
  [signed_by_name] NVARCHAR(255) NULL,
  [signed_by_email] NVARCHAR(255) NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_contracts] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [UQ_contracts_number] UNIQUE ([contract_number]),
  CONSTRAINT [CHK_contracts_status] CHECK ([status] IN ('active', 'completed', 'cancelled'))
);
GO

-- --------------------------------------------
-- Table: contract_delivery_checklist
-- --------------------------------------------
CREATE TABLE [dbo].[contract_delivery_checklist] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [contract_id] UNIQUEIDENTIFIER NOT NULL,
  [item_id] NVARCHAR(100) NOT NULL,
  [item_type] VARCHAR(50) NOT NULL,
  [item_name] NVARCHAR(500) NOT NULL,
  [item_code] NVARCHAR(50) NULL,
  [is_verified] BIT NULL DEFAULT 0,
  [verified_by] UNIQUEIDENTIFIER NULL,
  [verified_at] DATETIMEOFFSET NULL,
  [verification_notes] NVARCHAR(MAX) NULL,
  [photo_urls] NVARCHAR(MAX) NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_contract_delivery_checklist] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: additional_to_orders (ATOs)
-- --------------------------------------------
CREATE TABLE [dbo].[additional_to_orders] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [contract_id] UNIQUEIDENTIFIER NOT NULL,
  [ato_number] NVARCHAR(50) NOT NULL,
  [sequence_number] INT NOT NULL,
  [title] NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(MAX) NULL,
  [notes] NVARCHAR(MAX) NULL,
  [status] VARCHAR(50) NOT NULL DEFAULT 'draft',
  [workflow_status] VARCHAR(50) NULL,
  [price_impact] DECIMAL(18,2) NULL DEFAULT 0,
  [original_price_impact] DECIMAL(18,2) NULL,
  [discount_percentage] DECIMAL(5,2) NULL DEFAULT 0,
  [discount_amount] DECIMAL(18,2) NULL DEFAULT 0,
  [delivery_days_impact] INT NULL DEFAULT 0,
  [requires_approval] BIT NULL DEFAULT 0,
  [commercial_approval_status] VARCHAR(50) NULL,
  [technical_approval_status] VARCHAR(50) NULL,
  [approved_by] UNIQUEIDENTIFIER NULL,
  [approved_at] DATETIMEOFFSET NULL,
  [rejection_reason] NVARCHAR(MAX) NULL,
  [is_reversal] BIT NULL DEFAULT 0,
  [reversal_of_ato_id] UNIQUEIDENTIFIER NULL,
  [requested_by] UNIQUEIDENTIFIER NOT NULL,
  [requested_at] DATETIMEOFFSET NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_additional_to_orders] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_ato_status] CHECK ([status] IN ('draft', 'pending', 'approved', 'rejected', 'cancelled'))
);
GO

-- --------------------------------------------
-- Table: ato_configurations
-- --------------------------------------------
CREATE TABLE [dbo].[ato_configurations] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [ato_id] UNIQUEIDENTIFIER NOT NULL,
  [item_type] VARCHAR(50) NOT NULL,
  [item_id] UNIQUEIDENTIFIER NULL,
  [original_price] DECIMAL(18,2) NULL,
  [calculated_price] DECIMAL(18,2) NULL,
  [discount_percentage] DECIMAL(5,2) NULL DEFAULT 0,
  [delivery_impact_days] INT NULL DEFAULT 0,
  [notes] NVARCHAR(MAX) NULL,
  [configuration_details] NVARCHAR(MAX) NULL,
  [sub_items] NVARCHAR(MAX) NULL,
  [materials] NVARCHAR(MAX) NULL,
  [labor_hours] DECIMAL(10,2) NULL,
  [labor_cost_per_hour] DECIMAL(10,2) NULL,
  [is_reversal] BIT NULL DEFAULT 0,
  [reversal_of_configuration_id] UNIQUEIDENTIFIER NULL,
  [reversal_percentage] DECIMAL(5,2) NULL,
  [reversal_reason] NVARCHAR(MAX) NULL,
  [pm_status] VARCHAR(50) NULL,
  [pm_notes] NVARCHAR(MAX) NULL,
  [pm_reviewed_by] UNIQUEIDENTIFIER NULL,
  [pm_reviewed_at] DATETIMEOFFSET NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_ato_configurations] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: ato_workflow_steps
-- --------------------------------------------
CREATE TABLE [dbo].[ato_workflow_steps] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [ato_id] UNIQUEIDENTIFIER NOT NULL,
  [step_type] VARCHAR(50) NOT NULL,
  [status] VARCHAR(50) NULL DEFAULT 'pending',
  [assigned_to] UNIQUEIDENTIFIER NULL,
  [notes] NVARCHAR(MAX) NULL,
  [response_data] NVARCHAR(MAX) NULL,
  [completed_at] DATETIMEOFFSET NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_ato_workflow_steps] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: simulations
-- --------------------------------------------
CREATE TABLE [dbo].[simulations] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [simulation_number] NVARCHAR(50) NOT NULL,
  [yacht_model_id] UNIQUEIDENTIFIER NULL,
  [yacht_model_name] NVARCHAR(255) NOT NULL,
  [yacht_model_code] NVARCHAR(50) NOT NULL,
  [client_id] UNIQUEIDENTIFIER NULL,
  [client_name] NVARCHAR(255) NOT NULL,
  [quotation_id] UNIQUEIDENTIFIER NULL,
  [commission_id] UNIQUEIDENTIFIER NULL,
  [commission_name] NVARCHAR(255) NOT NULL,
  [commission_type] VARCHAR(50) NULL,
  [commission_percent] DECIMAL(5,2) NOT NULL,
  [adjusted_commission_percent] DECIMAL(5,2) NULL,
  [commission_adjustment_factor] DECIMAL(5,2) NULL,
  [custo_mp_nacional] DECIMAL(18,2) NOT NULL,
  [custo_mp_import] DECIMAL(18,2) NOT NULL,
  [custo_mp_import_currency] VARCHAR(10) NOT NULL,
  [custo_mo_horas] DECIMAL(18,2) NOT NULL,
  [custo_mo_valor_hora] DECIMAL(18,2) NOT NULL,
  [custo_venda] DECIMAL(18,2) NOT NULL,
  [tax_import_percent] DECIMAL(5,2) NOT NULL,
  [usd_rate] DECIMAL(10,4) NOT NULL,
  [eur_rate] DECIMAL(10,4) NOT NULL,
  [sales_tax_percent] DECIMAL(5,2) NOT NULL,
  [warranty_percent] DECIMAL(5,2) NOT NULL,
  [royalties_percent] DECIMAL(5,2) NOT NULL,
  [faturamento_bruto] DECIMAL(18,2) NOT NULL,
  [faturamento_liquido] DECIMAL(18,2) NOT NULL,
  [margem_bruta] DECIMAL(18,2) NOT NULL,
  [margem_percent] DECIMAL(5,2) NOT NULL,
  [customizacoes_estimadas] DECIMAL(18,2) NULL DEFAULT 0,
  [transporte_cost] DECIMAL(18,2) NULL DEFAULT 0,
  [is_exporting] BIT NULL DEFAULT 0,
  [export_country] NVARCHAR(100) NULL,
  [export_currency] VARCHAR(10) NULL,
  [has_trade_in] BIT NULL DEFAULT 0,
  [trade_in_brand] NVARCHAR(100) NULL,
  [trade_in_model] NVARCHAR(100) NULL,
  [trade_in_year] INT NULL,
  [trade_in_entry_value] DECIMAL(18,2) NULL,
  [trade_in_real_value] DECIMAL(18,2) NULL,
  [trade_in_depreciation] DECIMAL(18,2) NULL,
  [trade_in_commission] DECIMAL(18,2) NULL,
  [trade_in_commission_percent] DECIMAL(5,2) NULL,
  [trade_in_commission_reduction_percent] DECIMAL(5,2) NULL,
  [trade_in_operation_cost] DECIMAL(18,2) NULL,
  [trade_in_operation_cost_percent] DECIMAL(5,2) NULL,
  [trade_in_total_impact] DECIMAL(18,2) NULL,
  [notes] NVARCHAR(MAX) NULL,
  [created_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_simulations] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [UQ_simulations_number] UNIQUE ([simulation_number])
);
GO

-- --------------------------------------------
-- Table: pm_yacht_model_assignments
-- --------------------------------------------
CREATE TABLE [dbo].[pm_yacht_model_assignments] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [pm_user_id] UNIQUEIDENTIFIER NOT NULL,
  [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
  [assigned_by] UNIQUEIDENTIFIER NULL,
  [assigned_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_pm_yacht_model_assignments] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [UQ_pm_yacht_model] UNIQUE ([yacht_model_id])
);
GO

-- --------------------------------------------
-- Table: discount_limits_config
-- --------------------------------------------
CREATE TABLE [dbo].[discount_limits_config] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [limit_type] VARCHAR(50) NOT NULL,
  [no_approval_max] DECIMAL(5,2) NOT NULL,
  [director_approval_max] DECIMAL(5,2) NOT NULL,
  [admin_approval_required_above] DECIMAL(5,2) NOT NULL,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_discount_limits_config] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: role_permissions_config
-- --------------------------------------------
CREATE TABLE [dbo].[role_permissions_config] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [role] VARCHAR(50) NOT NULL,
  [permission] NVARCHAR(100) NOT NULL,
  [is_granted] BIT NOT NULL DEFAULT 1,
  [is_default] BIT NOT NULL DEFAULT 1,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_role_permissions_config] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_role_permissions_role] CHECK ([role] IN ('administrador', 'gerente_comercial', 'vendedor', 'engenheiro', 'diretor_comercial', 'pm'))
);
GO

-- --------------------------------------------
-- Table: workflow_config
-- --------------------------------------------
CREATE TABLE [dbo].[workflow_config] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [config_key] NVARCHAR(100) NOT NULL,
  [config_value] NVARCHAR(MAX) NOT NULL,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_workflow_config] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: workflow_settings
-- --------------------------------------------
CREATE TABLE [dbo].[workflow_settings] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [setting_key] NVARCHAR(100) NOT NULL,
  [enabled] BIT NOT NULL DEFAULT 1,
  [config_data] NVARCHAR(MAX) NULL,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_workflow_settings] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: system_config
-- --------------------------------------------
CREATE TABLE [dbo].[system_config] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [config_key] NVARCHAR(100) NOT NULL,
  [config_value] NVARCHAR(MAX) NOT NULL,
  [category] NVARCHAR(50) NULL,
  [description] NVARCHAR(500) NULL,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_system_config] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: simulator_commissions
-- --------------------------------------------
CREATE TABLE [dbo].[simulator_commissions] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [name] NVARCHAR(255) NOT NULL,
  [type] VARCHAR(50) NOT NULL,
  [percent] DECIMAL(5,2) NOT NULL DEFAULT 0,
  [is_active] BIT NOT NULL DEFAULT 1,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_simulator_commissions] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_simulator_commissions_type] CHECK ([type] IN ('venda_interna', 'broker_interno', 'sub_dealer'))
);
GO

-- --------------------------------------------
-- Table: simulator_business_rules
-- --------------------------------------------
CREATE TABLE [dbo].[simulator_business_rules] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [rule_key] NVARCHAR(100) NOT NULL,
  [rule_value] DECIMAL(10,4) NOT NULL,
  [category] NVARCHAR(50) NOT NULL,
  [description] NVARCHAR(500) NULL,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_simulator_business_rules] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: simulator_model_costs
-- --------------------------------------------
CREATE TABLE [dbo].[simulator_model_costs] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
  [custo_mp_nacional] DECIMAL(18,2) NOT NULL,
  [custo_mp_import] DECIMAL(18,2) NOT NULL,
  [custo_mp_import_currency] VARCHAR(10) NOT NULL DEFAULT 'EUR',
  [custo_mo_horas] DECIMAL(10,2) NOT NULL,
  [custo_mo_valor_hora] DECIMAL(10,2) NOT NULL,
  [tax_import_percent] DECIMAL(5,2) NOT NULL DEFAULT 8,
  [is_exportable] BIT NOT NULL DEFAULT 0,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_simulator_model_costs] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: simulator_exchange_rates
-- --------------------------------------------
CREATE TABLE [dbo].[simulator_exchange_rates] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [currency] VARCHAR(10) NOT NULL,
  [default_rate] DECIMAL(10,4) NOT NULL,
  [last_api_update] DATETIMEOFFSET NULL,
  [source] VARCHAR(50) NOT NULL DEFAULT 'manual',
  [updated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_simulator_exchange_rates] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: pdf_templates
-- --------------------------------------------
CREATE TABLE [dbo].[pdf_templates] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [name] NVARCHAR(255) NOT NULL,
  [document_type] VARCHAR(50) NOT NULL,
  [branding] NVARCHAR(50) NULL,
  [description] NVARCHAR(500) NULL,
  [template_json] NVARCHAR(MAX) NOT NULL,
  [status] VARCHAR(50) NULL DEFAULT 'draft',
  [is_default] BIT NULL DEFAULT 0,
  [version] INT NULL DEFAULT 1,
  [created_by] UNIQUEIDENTIFIER NULL,
  [updated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_pdf_templates] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [CHK_pdf_templates_type] CHECK ([document_type] IN ('quotation', 'contract', 'ato', 'simulation', 'delivery'))
);
GO

-- --------------------------------------------
-- Table: pdf_template_versions
-- --------------------------------------------
CREATE TABLE [dbo].[pdf_template_versions] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [template_id] UNIQUEIDENTIFIER NOT NULL,
  [version] INT NOT NULL,
  [template_json] NVARCHAR(MAX) NOT NULL,
  [change_notes] NVARCHAR(MAX) NULL,
  [changed_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_pdf_template_versions] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: pdf_generated
-- --------------------------------------------
CREATE TABLE [dbo].[pdf_generated] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [template_id] UNIQUEIDENTIFIER NULL,
  [document_type] VARCHAR(50) NOT NULL,
  [reference_type] VARCHAR(50) NULL,
  [reference_id] UNIQUEIDENTIFIER NULL,
  [pdf_url] NVARCHAR(500) NULL,
  [payload] NVARCHAR(MAX) NULL,
  [generated_by] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_pdf_generated] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: approvals_backup
-- --------------------------------------------
CREATE TABLE [dbo].[approvals_backup] (
  [id] UNIQUEIDENTIFIER NOT NULL,
  [quotation_id] UNIQUEIDENTIFIER NULL,
  [approval_type] VARCHAR(50) NULL,
  [status] VARCHAR(50) NULL,
  [notes] NVARCHAR(MAX) NULL,
  [request_details] NVARCHAR(MAX) NULL,
  [review_notes] NVARCHAR(MAX) NULL,
  [requested_by] UNIQUEIDENTIFIER NULL,
  [requested_at] DATETIMEOFFSET NULL,
  [reviewed_by] UNIQUEIDENTIFIER NULL,
  [reviewed_at] DATETIMEOFFSET NULL,
  [created_at] DATETIMEOFFSET NULL,
  [updated_at] DATETIMEOFFSET NULL,
  CONSTRAINT [PK_approvals_backup] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: audit_logs
-- --------------------------------------------
CREATE TABLE [dbo].[audit_logs] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [user_id] UNIQUEIDENTIFIER NULL,
  [user_email] NVARCHAR(255) NULL,
  [user_name] NVARCHAR(255) NULL,
  [action] NVARCHAR(100) NOT NULL,
  [table_name] NVARCHAR(100) NULL,
  [record_id] NVARCHAR(100) NULL,
  [old_values] NVARCHAR(MAX) NULL,
  [new_values] NVARCHAR(MAX) NULL,
  [changed_fields] NVARCHAR(MAX) NULL,
  [route] NVARCHAR(500) NULL,
  [ip_address] NVARCHAR(50) NULL,
  [user_agent] NVARCHAR(500) NULL,
  [metadata] NVARCHAR(MAX) NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_audit_logs] PRIMARY KEY CLUSTERED ([id])
);
GO

-- --------------------------------------------
-- Table: mfa_recovery_codes
-- --------------------------------------------
CREATE TABLE [dbo].[mfa_recovery_codes] (
  [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [code_hash] NVARCHAR(255) NOT NULL,
  [used_at] DATETIMEOFFSET NULL,
  [created_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT [PK_mfa_recovery_codes] PRIMARY KEY CLUSTERED ([id])
);
GO

PRINT 'Tables created successfully!';
GO

-- =============================================
-- PART 3: INSERT DATA
-- =============================================

PRINT 'Inserting data...';
GO

-- --------------------------------------------
-- Data: users (2 rows)
-- --------------------------------------------
INSERT INTO [dbo].[users] ([id], [email], [full_name], [department], [is_active], [created_at], [updated_at])
VALUES 
  ('237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', N'Manuel Macieira Pires', N'Comercial', 1, '2025-10-24T23:42:45.703', '2026-01-13T01:57:40.143'),
  ('ab3f0582-765d-4dcf-a30a-7f0141779e0a', N'nercio.fernandes@okeanyachts.com', N'Nercio Fernandes', N'Produção', 1, '2026-01-13T01:58:19.610', '2026-01-13T01:58:19.610');
GO

-- --------------------------------------------
-- Data: user_roles (3 rows)
-- --------------------------------------------
INSERT INTO [dbo].[user_roles] ([id], [user_id], [role], [created_at])
VALUES 
  ('900d7362-ee63-4f77-9e6b-9ca4d80b1d85', '237c5317-2496-41eb-b24a-337f9c966237', 'administrador', '2026-01-13T01:57:40.590'),
  ('197db363-7348-4a96-be29-d6a7a5e8edbb', '237c5317-2496-41eb-b24a-337f9c966237', 'diretor_comercial', '2026-01-13T01:57:40.590'),
  ('b61cb10d-3715-4ab3-8a7e-ce8bc87ca03b', 'ab3f0582-765d-4dcf-a30a-7f0141779e0a', 'administrador', '2026-01-13T01:58:19.787');
GO

-- --------------------------------------------
-- Data: clients (4 rows)
-- --------------------------------------------
INSERT INTO [dbo].[clients] ([id], [name], [email], [phone], [company], [cpf], [notes], [created_by], [created_at], [updated_at])
VALUES 
  ('10c9980a-f2ec-4087-b132-da9faf440d93', N'Manuel Macieira Pires', N'manuel.mpires@outlook.com', N'+5511999999611', N'OKEAN Yachts', N'06272821727', N'', '237c5317-2496-41eb-b24a-337f9c966237', '2025-10-25T00:52:57.361', '2026-01-08T19:21:21.844'),
  ('849bfb3c-062c-4098-a96a-2aa46f8670a3', N'Vitorio Danesi', NULL, NULL, NULL, NULL, NULL, '237c5317-2496-41eb-b24a-337f9c966237', '2026-01-05T20:42:30.777', '2026-01-05T20:42:30.777'),
  ('2f4632ea-1a6c-4467-86a5-6a18aa1e45e1', N'Roberto Chacur', N'', N'+5521984965966', N'', N'', N'', '237c5317-2496-41eb-b24a-337f9c966237', '2026-01-06T13:31:53.799', '2026-01-08T19:21:16.405'),
  ('9b8ce0c7-aeab-4c41-a0b4-b096248e116b', N'Haroldo Augusto Filho', NULL, NULL, NULL, NULL, NULL, '237c5317-2496-41eb-b24a-337f9c966237', '2026-01-09T20:03:30.389', '2026-01-09T20:03:30.389');
GO

-- --------------------------------------------
-- Data: yacht_models (8 rows) - WITH JSON FIELDS
-- --------------------------------------------
INSERT INTO [dbo].[yacht_models] ([id], [name], [code], [brand], [base_price], [base_delivery_days], [is_active], [display_order], [cabins], [bathrooms], [beam], [cruise_speed], [image_url], [technical_specifications], [gallery_images], [exterior_images], [interior_images], [created_at], [updated_at])
VALUES 
  ('a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'Ferretti Yachts 1000', N'FY1000', N'Ferretti Yachts', 79000000.00, 545, 1, 1, NULL, NULL, NULL, NULL, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1761356505576-fexpf9.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T18:22:16.842', '2026-01-12T19:45:55.477'),
  ('6f5164f9-3cef-4f2e-8fae-54b2a84113be', N'Ferretti Yachts 850', N'FY850', N'Ferretti Yachts', 41500000.00, 500, 1, 2, N'4', N'4 + 1', 6.28, 27, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1761356505576-fexpf9.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T05:34:11.017', '2026-01-12T19:45:55.477'),
  ('bea3cd21-8fe7-4224-969f-0d3a8cf349e7', N'Ferretti Yachts 670', N'FY670', N'Ferretti Yachts', 20990000.00, 450, 1, 3, NULL, NULL, NULL, NULL, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1766251215809-n8rfmm.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T18:27:07.809', '2026-01-12T19:45:55.477'),
  ('3949b215-370c-4c17-85d4-de7dd8f8b2d8', N'Ferretti Yachts 580', N'FY580', N'Ferretti Yachts', 14500000.00, 420, 1, 4, NULL, NULL, NULL, NULL, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1766251353610-bwzwur.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T18:27:30.206', '2026-01-12T19:45:55.477'),
  ('4c501b04-12da-46f7-8e10-16c5bc34910f', N'Ferretti Yachts 500', N'FY500', N'Ferretti Yachts', 10900000.00, 380, 1, 5, NULL, NULL, NULL, NULL, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1766251490660-c9xvph.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T18:27:54.426', '2026-01-12T19:45:55.477'),
  ('aad0cf05-c32e-4078-897f-2a6db49a9f4f', N'OKEAN 57', N'OK57', N'OKEAN', 6510000.00, 320, 1, 6, NULL, NULL, NULL, NULL, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1766251621203-0iydxd.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T18:28:21.058', '2026-01-12T19:45:55.477'),
  ('00475e39-18eb-4730-9399-536572b37163', N'OKEAN 52', N'OK52', N'OKEAN', 4800000.00, 280, 1, 7, NULL, NULL, NULL, NULL, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1766251729949-4vxjff.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T18:28:40.652', '2026-01-12T19:45:55.477'),
  ('45d9b1e4-67da-4239-829a-c3568155878f', N'OKEAN 44', N'OK44', N'OKEAN', 2600000.00, 240, 1, 8, NULL, NULL, NULL, NULL, N'https://qqxhkaowexieednyazwq.supabase.co/storage/v1/object/public/yacht-images/models/1766251802696-6snafn.jpg', NULL, N'[]', N'[]', N'[]', '2025-10-24T18:28:58.917', '2026-01-12T19:45:55.477');
GO

-- --------------------------------------------
-- Data: option_categories (7 rows - deprecated)
-- --------------------------------------------
INSERT INTO [dbo].[option_categories] ([id], [name], [description], [display_order], [is_active], [deprecated_at], [created_at])
VALUES 
  ('48211e61-d37f-4ff0-b2ef-1447b085a14f', N'Eletrônicos & Navegação', N'Radares, GPS, pilotos automáticos e sistemas de navegação', 1, 1, '2025-12-17T16:00:56.746', '2025-10-25T02:50:12.633'),
  ('8d51e246-c725-47c5-892f-560bb2d5c957', N'Conforto & Climatização', N'Ar-condicionado, aquecedores e geradores', 2, 1, '2025-12-17T16:00:56.746', '2025-10-25T02:50:12.633'),
  ('c3d3212b-23d4-40bc-955f-ab9e5f3dbc7a', N'Entretenimento & Áudio', N'TVs, sistemas de som e home theater', 3, 1, '2025-12-17T16:00:56.746', '2025-10-25T02:50:12.633'),
  ('1c87b4b5-8998-4693-bc9f-8f92cd285402', N'Equipamentos Náuticos', N'Guindastes, passarelas, tenders e equipamentos de manobra', 4, 1, '2025-12-17T16:00:56.746', '2025-10-25T02:50:12.633'),
  ('e3ac22d0-7de5-400c-a056-bb1189768999', N'Acabamentos & Design', N'Teca, iluminação e revestimentos premium', 5, 1, '2025-12-17T16:00:56.746', '2025-10-25T02:50:12.633'),
  ('f13ff5bb-281f-49d4-bc9d-cd90f8265087', N'Segurança & Equipamentos', N'Sistemas anti-incêndio, botes salva-vidas e câmeras', 6, 1, '2025-12-17T16:00:56.746', '2025-10-25T02:50:12.633'),
  ('b974ab80-31a3-4303-8bf9-b2064eda76a3', N'Motores & Performance', N'Propulsores, estabilização e hélices', 7, 1, '2025-12-17T16:00:56.746', '2025-10-25T02:50:12.633');
GO

-- --------------------------------------------
-- Data: discount_limits_config (2 rows)
-- --------------------------------------------
INSERT INTO [dbo].[discount_limits_config] ([id], [limit_type], [no_approval_max], [director_approval_max], [admin_approval_required_above], [updated_at])
VALUES 
  ('07dae229-f641-4cf6-bcca-a93a5cf02d0e', 'base', 10, 15, 15, '2025-10-25T04:31:45.519'),
  ('5d50bdb5-b27e-4569-beaa-deeded133e12', 'options', 8, 12, 12, '2025-10-25T04:31:45.519');
GO

-- --------------------------------------------
-- Data: workflow_config (3 rows) - WITH JSON FIELDS
-- --------------------------------------------
INSERT INTO [dbo].[workflow_config] ([id], [config_key], [config_value], [updated_by], [updated_at])
VALUES 
  ('6e2417bc-7f0c-4c37-a149-f37e49b7c5f5', 'engineering_rate', N'{"currency":"BRL","rate_per_hour":60}', '237c5317-2496-41eb-b24a-337f9c966237', '2025-10-27T21:27:14.440'),
  ('ad2a31ef-9e8e-48c6-842d-defc056dc230', 'contingency_percent', N'{"percent":10}', '237c5317-2496-41eb-b24a-337f9c966237', '2025-10-27T21:27:14.680'),
  ('04c7479f-acc1-45bd-ab2c-5a8dcc62f3b5', 'sla_days', N'{"planning_check":2,"pm_final":1,"pm_initial":2,"supply_quote":5}', '237c5317-2496-41eb-b24a-337f9c966237', '2025-10-27T21:27:14.964');
GO

-- --------------------------------------------
-- Data: workflow_settings (1 row) - WITH JSON FIELDS
-- --------------------------------------------
INSERT INTO [dbo].[workflow_settings] ([id], [setting_key], [enabled], [config_data], [created_at], [updated_at])
VALUES 
  ('614d7545-7e33-4445-8cea-428ab882c34c', 'simplified_workflow', 1, N'{"description":"Workflow simplificado ativado globalmente para todas as customizações"}', '2025-11-27T02:54:53.149', '2025-11-27T02:54:53.149');
GO

-- --------------------------------------------
-- Data: system_config (12 rows)
-- --------------------------------------------
INSERT INTO [dbo].[system_config] ([id], [config_key], [config_value], [category], [description], [updated_at])
VALUES 
  ('8b57e18e-093c-463a-8fa0-dc1d80116103', 'quotation_validity_days', '30', 'quotation', N'Dias de validade padrão para cotações', '2025-12-22T01:42:10.014'),
  ('5a678ab8-39f0-4f57-89e1-919dd2c7273c', 'default_labor_cost_per_hour', '55', 'pricing', N'Custo padrão por hora de mão de obra (R$)', '2025-12-22T01:42:10.014'),
  ('2c146ae9-4305-4895-8d80-73cd6871fb6a', 'pricing_markup_divisor', '0.43', 'pricing', N'Divisor para cálculo de markup (1 - impostos - margem). Preço sugerido = Custo / divisor', '2025-12-22T01:42:10.014'),
  ('3bac24da-01bc-46dd-80c4-76373bccaaa9', 'pricing_margin_percent', '30', 'pricing', N'Percentual de margem de lucro', '2025-12-22T01:42:10.014'),
  ('49cce7fb-3520-4a6d-9ae7-cf9593e066ea', 'pricing_tax_percent', '21', 'pricing', N'Percentual de impostos', '2025-12-22T01:42:10.014'),
  ('e1110ad2-74eb-4945-a241-1def45effa8c', 'pricing_warranty_percent', '3', 'pricing', N'Percentual de garantia', '2025-12-22T01:42:10.014'),
  ('1185c2e9-8685-4e98-9f54-fc95fddce554', 'pricing_commission_percent', '3', 'pricing', N'Percentual de comissão', '2025-12-22T01:42:10.014'),
  ('65a7b40a-1292-4fd0-aec8-69fa4ee5875f', 'cache_stale_time_ms', '30000', 'cache', N'Tempo de stale para cache de queries (ms)', '2025-12-22T01:42:10.014'),
  ('c3dc36a0-1f89-413d-b3d7-f5bf9656dfa5', 'workflow_refetch_interval_ms', '60000', 'cache', N'Intervalo de refetch para workflow (ms)', '2025-12-22T01:42:10.014'),
  ('efca9ae1-bc9b-4113-a4b6-f43c6905b52c', 'company_name', 'OKEAN Yachts', 'company', N'Nome da empresa para emails e PDFs', '2025-12-22T01:42:10.014'),
  ('889a149e-9130-4f5a-be5f-d795894d2fd7', 'company_email', 'contato@okeanyachts.com', 'company', N'Email de contato principal', '2025-12-22T01:42:10.014'),
  ('33ec732d-6568-4525-b61c-2ef10d9e28e7', 'app_url', 'https://okean.lovable.app', 'company', N'URL do sistema', '2025-12-22T01:42:10.014');
GO

-- --------------------------------------------
-- Data: simulator_commissions (13 rows)
-- --------------------------------------------
INSERT INTO [dbo].[simulator_commissions] ([id], [name], [type], [percent], [is_active], [created_at], [updated_at])
VALUES 
  ('39f73ec9-3052-4916-972d-0c59f7f25646', N'Estaleiro', 'venda_interna', 0, 1, '2026-01-01T21:32:12.246', '2026-01-01T21:32:12.246'),
  ('3ea01813-a64f-4e36-93e2-201bc51080a4', N'Junior Loes', 'broker_interno', 2, 1, '2026-01-01T21:34:02.291', '2026-01-01T21:34:02.291'),
  ('1032f28d-30e7-4c43-8ad2-ea20c6280c08', N'Nelma Feitosa', 'broker_interno', 2, 1, '2026-01-01T21:34:22.498', '2026-01-01T21:34:22.498'),
  ('8e4573c5-41bf-4510-9a46-a3d884e1793d', N'Alexandre Lopes', 'venda_interna', 0, 1, '2026-01-01T21:34:32.197', '2026-01-01T21:34:32.197'),
  ('e638ff0a-794b-4d22-abd7-a5901920ae27', N'Elton Fedalto', 'venda_interna', 0, 1, '2026-01-01T21:34:38.606', '2026-01-01T21:34:38.606'),
  ('e7237c51-f9fc-4268-bdf4-47292988ad28', N'Felipe Fernandes', 'venda_interna', 0, 1, '2026-01-01T21:34:43.820', '2026-01-01T21:34:43.820'),
  ('5e214c51-8ab6-446f-8b8b-94adc4f727b3', N'Nauticlass', 'sub_dealer', 3, 1, '2026-01-01T21:35:01.140', '2026-01-01T21:35:01.140'),
  ('ad2cd707-c615-4ced-a9ae-772c8767be62', N'Pini Yachts', 'sub_dealer', 3, 1, '2026-01-01T21:35:10.978', '2026-01-01T21:35:19.809'),
  ('afb5c9ee-1269-4a54-a007-8a6ee631f78e', N'Atlantic (Brasil)', 'sub_dealer', 3, 1, '2026-01-01T21:35:38.878', '2026-01-01T21:35:38.878'),
  ('9135a94b-b641-418a-97e4-2f55ce8b4e08', N'Ike Moreira', 'broker_interno', 1, 1, '2026-01-01T21:35:50.937', '2026-01-01T21:35:50.937'),
  ('769d3c22-dc99-4645-a2b2-29be5fc0a469', N'FYI', 'sub_dealer', 10, 1, '2026-01-02T22:03:12.376', '2026-01-02T22:03:12.376'),
  ('c5283376-b45a-4ff2-baec-923ffd19632c', N'Atlantic (USA)', 'sub_dealer', 10, 1, '2026-01-02T22:03:23.916', '2026-01-02T22:03:23.916'),
  ('e30501c2-7c73-43b2-983e-d92341a2a143', N'Nercio Fernandes', 'venda_interna', 0, 1, '2026-01-13T00:25:25.752', '2026-01-13T00:25:25.752');
GO

-- --------------------------------------------
-- Data: simulator_business_rules (9 rows)
-- --------------------------------------------
INSERT INTO [dbo].[simulator_business_rules] ([id], [rule_key], [rule_value], [category], [description], [created_at], [updated_at])
VALUES 
  ('2963e40e-a3f4-42e2-96d5-a0862184650a', 'sales_tax_export', 0, 'taxes', N'Imposto de venda - Barcos exportados (%)', '2026-01-01T21:39:49.505', '2026-01-01T21:39:49.505'),
  ('2b43cb57-f7e1-4618-b6fa-3dfcc6975eb3', 'warranty_domestic', 3, 'taxes', N'Garantia - Barcos não exportados (%)', '2026-01-01T21:39:49.505', '2026-01-01T21:39:49.505'),
  ('6e94e318-10f5-423a-8041-fee37f962f8c', 'warranty_export', 5, 'taxes', N'Garantia - Barcos exportados (%)', '2026-01-01T21:39:49.505', '2026-01-01T21:39:49.505'),
  ('b1ce4f64-7674-4388-8699-18ea0a104779', 'sales_tax_domestic', 19.89, 'taxes', N'Imposto de venda - Barcos não exportados (%)', '2026-01-01T21:39:49.505', '2026-01-02T12:24:08.166'),
  ('e867495c-3680-4b05-a69a-14eeb3216296', 'trade_in_operation_cost_percent', 3, 'trade_in', N'Custo de Operação do Usado (%)', '2026-01-02T21:42:26.969', '2026-01-02T21:42:26.969'),
  ('819ada90-dcee-404a-ac3b-6e3b14af0bbb', 'trade_in_commission_reduction', 0.5, 'trade_in', N'Redução da Comissão do Vendedor quando há Trade-In (%)', '2026-01-02T21:42:26.969', '2026-01-02T21:42:26.969'),
  ('9afd1b1e-a88b-4c4a-b6a3-f97f18ed5916', 'royalties_percent_ferretti', 6, 'taxes', N'Royalties para Ferretti Yachts (%)', '2026-01-01T22:37:46.167', '2026-01-02T21:49:40.822'),
  ('d3469513-df2c-46fa-a42d-d3d8087d58a5', 'royalties_percent_okean', 1, 'taxes', N'Royalties para OKEAN (%)', '2026-01-02T21:49:40.822', '2026-01-02T21:49:40.822'),
  ('27c0b244-7f76-411b-a61a-7a45b1e43b14', 'trade_in_commission_percent', 2, 'trade_in', N'Comissão sobre o Usado (%)', '2026-01-02T21:42:26.969', '2026-01-03T00:33:20.280');
GO

-- --------------------------------------------
-- Data: simulator_model_costs (8 rows)
-- --------------------------------------------
INSERT INTO [dbo].[simulator_model_costs] ([id], [yacht_model_id], [custo_mp_nacional], [custo_mp_import], [custo_mp_import_currency], [custo_mo_horas], [custo_mo_valor_hora], [tax_import_percent], [is_exportable], [created_at], [updated_at])
VALUES 
  ('8c050f63-2039-489a-b0d8-ff0cea68b92e', '3949b215-370c-4c17-85d4-de7dd8f8b2d8', 1350000, 1300000, 'EUR', 19500, 44, 8, 0, '2026-01-01T21:18:04.281', '2026-01-01T21:18:09.790'),
  ('7582e066-8f7f-4f05-a5d8-10ec5b151cf6', '4c501b04-12da-46f7-8e10-16c5bc34910f', 2205000, 1080000, 'EUR', 17500, 44, 8, 0, '2026-01-01T21:17:25.985', '2026-01-01T21:18:13.485'),
  ('c56b526c-3a89-40d9-94fb-9fdb9aeee898', '45d9b1e4-67da-4239-829a-c3568155878f', 1936000, 530000, 'EUR', 15000, 44, 8, 0, '2026-01-01T21:17:00.084', '2026-01-01T21:18:17.288'),
  ('3f4c4260-97c5-4957-8af9-2128e2230a67', '00475e39-18eb-4730-9399-536572b37163', 1745000, 471000, 'USD', 14780, 44, 8, 1, '2026-01-01T21:16:09.516', '2026-01-01T21:18:20.869'),
  ('67b61dfe-9260-443f-a331-27908ac8ae2a', 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 2451000, 302000, 'USD', 12700, 44, 8, 1, '2026-01-01T21:15:29.789', '2026-01-01T21:18:24.363'),
  ('3950e675-d3d1-4a5e-ae0a-2f614d6e30bb', 'bea3cd21-8fe7-4224-969f-0d3a8cf349e7', 5557000, 1580000, 'USD', 42000, 44, 8, 1, '2026-01-01T21:16:38.241', '2026-01-01T21:18:32.273'),
  ('9ef07616-72fa-4632-b954-6e3a0839b326', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', 3635000, 3524000, 'EUR', 40000, 44, 8, 0, '2026-01-01T21:03:41.394', '2026-01-01T21:19:02.981'),
  ('d5a88c8b-47ef-4b91-8671-0dff8bd597d1', '6f5164f9-3cef-4f2e-8fae-54b2a84113be', 5300000, 1479000, 'EUR', 30000, 44, 8, 0, '2026-01-01T21:14:07.762', '2026-01-02T22:46:34.269');
GO

-- --------------------------------------------
-- Data: simulator_exchange_rates (2 rows)
-- --------------------------------------------
INSERT INTO [dbo].[simulator_exchange_rates] ([id], [currency], [default_rate], [source], [created_at], [updated_at])
VALUES 
  ('842f1b7f-13b1-458a-bb58-7d4dea5af9bd', 'EUR', 6.2802, 'api', '2026-01-01T20:39:21.856', '2026-01-12T21:59:14.763'),
  ('1e884aa8-3ac2-4f78-bfd5-657cdca352b4', 'USD', 5.376, 'api', '2026-01-01T20:39:21.856', '2026-01-12T21:59:17.506');
GO

-- --------------------------------------------
-- Data: approvals_backup (3 rows) - WITH JSON FIELDS
-- --------------------------------------------
INSERT INTO [dbo].[approvals_backup] ([id], [quotation_id], [approval_type], [status], [notes], [request_details], [requested_by], [requested_at], [reviewed_by], [reviewed_at], [created_at], [updated_at])
VALUES 
  ('2146ca1a-fc4d-45e8-840c-3120a598e1bb', 'edd64f69-3c35-4bb7-a1cf-c4b7480a11a8', 'technical', 'approved', N'Customização livre: Hidro', N'{"customization_code":"QT-2025-160-V1-CUS-001","customization_id":"8ad691a9-357a-400c-a206-72f17184bad0","customization_item_name":"Hidro","is_free_customization":true,"is_optional":false,"memorial_item_id":null,"notes":"Hidromassagem\nUma Hidro com espaço para 4 pessoas, com luzes subaquaticas e agua aquecida. Importante ter um filtro muito bom","option_id":null,"quantity":1}', '237c5317-2496-41eb-b24a-337f9c966237', '2025-11-25T21:02:32.238', '237c5317-2496-41eb-b24a-337f9c966237', '2025-11-25T21:03:02.099', '2025-11-25T21:02:32.238', '2025-11-25T21:03:02.439'),
  ('6ab62742-49af-4d59-ba9e-79a9882cb6ac', 'edd64f69-3c35-4bb7-a1cf-c4b7480a11a8', 'technical', 'approved', NULL, N'{"additional_cost":3552.33,"customization_item_name":"Customização: Aquecedor de Água 60L","delivery_impact_days":30}', '237c5317-2496-41eb-b24a-337f9c966237', '2025-11-25T21:04:22.322', '237c5317-2496-41eb-b24a-337f9c966237', '2025-11-25T21:09:49.282', '2025-11-25T21:27:56.942', '2025-11-25T21:27:56.942'),
  ('cd2e922f-2bea-4cce-b1f9-91157e2d4ac9', '68104fd5-89ae-4049-a20c-57e957a5072d', 'technical', 'approved', NULL, N'{"additional_cost":0,"customization_code":"QT-2025-160-V3-CUS-003","customization_id":"cd8b6852-c370-4314-a082-875eb9eee596","customization_item_name":"Customização: Ar-Condicionado Adicional 18.000 BTU","delivery_impact_days":0,"option_id":"1b5db6e6-b7e6-4050-8ebd-113fa713b5f3"}', '237c5317-2496-41eb-b24a-337f9c966237', '2025-11-25T21:12:53.139', '237c5317-2496-41eb-b24a-337f9c966237', '2025-11-25T21:32:13.007', '2025-11-25T21:31:29.444', '2025-11-25T21:32:13.352');
GO

PRINT 'Base data inserted successfully!';
GO

-- =============================================
-- PART 4: FOREIGN KEYS
-- =============================================

PRINT 'Creating foreign keys...';
GO

-- user_roles -> users
ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [FK_user_roles_users]
FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE;
GO

-- clients -> users (created_by)
ALTER TABLE [dbo].[clients] ADD CONSTRAINT [FK_clients_created_by]
FOREIGN KEY ([created_by]) REFERENCES [dbo].[users]([id]);
GO

-- memorial_items -> yacht_models
ALTER TABLE [dbo].[memorial_items] ADD CONSTRAINT [FK_memorial_items_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]) ON DELETE CASCADE;
GO

-- memorial_items -> memorial_categories
ALTER TABLE [dbo].[memorial_items] ADD CONSTRAINT [FK_memorial_items_categories]
FOREIGN KEY ([category_id]) REFERENCES [dbo].[memorial_categories]([id]);
GO

-- memorial_items -> job_stops
ALTER TABLE [dbo].[memorial_items] ADD CONSTRAINT [FK_memorial_items_job_stops]
FOREIGN KEY ([job_stop_id]) REFERENCES [dbo].[job_stops]([id]);
GO

-- memorial_upgrades -> yacht_models
ALTER TABLE [dbo].[memorial_upgrades] ADD CONSTRAINT [FK_memorial_upgrades_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]) ON DELETE CASCADE;
GO

-- memorial_upgrades -> memorial_items
ALTER TABLE [dbo].[memorial_upgrades] ADD CONSTRAINT [FK_memorial_upgrades_memorial_items]
FOREIGN KEY ([memorial_item_id]) REFERENCES [dbo].[memorial_items]([id]);
GO

-- options -> yacht_models
ALTER TABLE [dbo].[options] ADD CONSTRAINT [FK_options_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]);
GO

-- options -> memorial_categories
ALTER TABLE [dbo].[options] ADD CONSTRAINT [FK_options_categories]
FOREIGN KEY ([category_id]) REFERENCES [dbo].[memorial_categories]([id]);
GO

-- hull_numbers -> yacht_models
ALTER TABLE [dbo].[hull_numbers] ADD CONSTRAINT [FK_hull_numbers_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]);
GO

-- quotations -> yacht_models
ALTER TABLE [dbo].[quotations] ADD CONSTRAINT [FK_quotations_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]);
GO

-- quotations -> clients
ALTER TABLE [dbo].[quotations] ADD CONSTRAINT [FK_quotations_clients]
FOREIGN KEY ([client_id]) REFERENCES [dbo].[clients]([id]);
GO

-- quotations -> users (sales_representative_id)
ALTER TABLE [dbo].[quotations] ADD CONSTRAINT [FK_quotations_sales_rep]
FOREIGN KEY ([sales_representative_id]) REFERENCES [dbo].[users]([id]);
GO

-- quotations -> parent_quotation
ALTER TABLE [dbo].[quotations] ADD CONSTRAINT [FK_quotations_parent]
FOREIGN KEY ([parent_quotation_id]) REFERENCES [dbo].[quotations]([id]);
GO

-- quotation_options -> quotations
ALTER TABLE [dbo].[quotation_options] ADD CONSTRAINT [FK_quotation_options_quotations]
FOREIGN KEY ([quotation_id]) REFERENCES [dbo].[quotations]([id]) ON DELETE CASCADE;
GO

-- quotation_options -> options
ALTER TABLE [dbo].[quotation_options] ADD CONSTRAINT [FK_quotation_options_options]
FOREIGN KEY ([option_id]) REFERENCES [dbo].[options]([id]);
GO

-- quotation_upgrades -> quotations
ALTER TABLE [dbo].[quotation_upgrades] ADD CONSTRAINT [FK_quotation_upgrades_quotations]
FOREIGN KEY ([quotation_id]) REFERENCES [dbo].[quotations]([id]) ON DELETE CASCADE;
GO

-- quotation_upgrades -> memorial_upgrades
ALTER TABLE [dbo].[quotation_upgrades] ADD CONSTRAINT [FK_quotation_upgrades_upgrades]
FOREIGN KEY ([upgrade_id]) REFERENCES [dbo].[memorial_upgrades]([id]);
GO

-- quotation_customizations -> quotations
ALTER TABLE [dbo].[quotation_customizations] ADD CONSTRAINT [FK_quotation_customizations_quotations]
FOREIGN KEY ([quotation_id]) REFERENCES [dbo].[quotations]([id]) ON DELETE CASCADE;
GO

-- contracts -> quotations
ALTER TABLE [dbo].[contracts] ADD CONSTRAINT [FK_contracts_quotations]
FOREIGN KEY ([quotation_id]) REFERENCES [dbo].[quotations]([id]);
GO

-- contracts -> yacht_models
ALTER TABLE [dbo].[contracts] ADD CONSTRAINT [FK_contracts_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]);
GO

-- contracts -> clients
ALTER TABLE [dbo].[contracts] ADD CONSTRAINT [FK_contracts_clients]
FOREIGN KEY ([client_id]) REFERENCES [dbo].[clients]([id]);
GO

-- additional_to_orders -> contracts
ALTER TABLE [dbo].[additional_to_orders] ADD CONSTRAINT [FK_ato_contracts]
FOREIGN KEY ([contract_id]) REFERENCES [dbo].[contracts]([id]) ON DELETE CASCADE;
GO

-- ato_configurations -> additional_to_orders
ALTER TABLE [dbo].[ato_configurations] ADD CONSTRAINT [FK_ato_configurations_ato]
FOREIGN KEY ([ato_id]) REFERENCES [dbo].[additional_to_orders]([id]) ON DELETE CASCADE;
GO

-- ato_workflow_steps -> additional_to_orders
ALTER TABLE [dbo].[ato_workflow_steps] ADD CONSTRAINT [FK_ato_workflow_ato]
FOREIGN KEY ([ato_id]) REFERENCES [dbo].[additional_to_orders]([id]) ON DELETE CASCADE;
GO

-- simulator_model_costs -> yacht_models
ALTER TABLE [dbo].[simulator_model_costs] ADD CONSTRAINT [FK_simulator_costs_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]) ON DELETE CASCADE;
GO

-- pm_yacht_model_assignments -> users
ALTER TABLE [dbo].[pm_yacht_model_assignments] ADD CONSTRAINT [FK_pm_assignments_users]
FOREIGN KEY ([pm_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE;
GO

-- pm_yacht_model_assignments -> yacht_models
ALTER TABLE [dbo].[pm_yacht_model_assignments] ADD CONSTRAINT [FK_pm_assignments_yacht_models]
FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]) ON DELETE CASCADE;
GO

PRINT 'Foreign keys created successfully!';
GO

-- =============================================
-- PART 5: INDEXES
-- =============================================

PRINT 'Creating indexes...';
GO

-- Users
CREATE INDEX [IX_users_email] ON [dbo].[users] ([email]);
CREATE INDEX [IX_users_is_active] ON [dbo].[users] ([is_active]);
GO

-- User Roles
CREATE INDEX [IX_user_roles_user_id] ON [dbo].[user_roles] ([user_id]);
CREATE INDEX [IX_user_roles_role] ON [dbo].[user_roles] ([role]);
GO

-- Clients
CREATE INDEX [IX_clients_name] ON [dbo].[clients] ([name]);
CREATE INDEX [IX_clients_email] ON [dbo].[clients] ([email]);
GO

-- Yacht Models
CREATE INDEX [IX_yacht_models_code] ON [dbo].[yacht_models] ([code]);
CREATE INDEX [IX_yacht_models_is_active] ON [dbo].[yacht_models] ([is_active]);
CREATE INDEX [IX_yacht_models_display_order] ON [dbo].[yacht_models] ([display_order]);
GO

-- Memorial Items
CREATE INDEX [IX_memorial_items_yacht_model] ON [dbo].[memorial_items] ([yacht_model_id]);
CREATE INDEX [IX_memorial_items_category] ON [dbo].[memorial_items] ([category_id]);
CREATE INDEX [IX_memorial_items_is_active] ON [dbo].[memorial_items] ([is_active]);
GO

-- Options
CREATE INDEX [IX_options_yacht_model] ON [dbo].[options] ([yacht_model_id]);
CREATE INDEX [IX_options_code] ON [dbo].[options] ([code]);
CREATE INDEX [IX_options_is_active] ON [dbo].[options] ([is_active]);
GO

-- Hull Numbers
CREATE INDEX [IX_hull_numbers_yacht_model] ON [dbo].[hull_numbers] ([yacht_model_id]);
CREATE INDEX [IX_hull_numbers_status] ON [dbo].[hull_numbers] ([status]);
CREATE INDEX [IX_hull_numbers_number] ON [dbo].[hull_numbers] ([hull_number]);
GO

-- Quotations
CREATE INDEX [IX_quotations_yacht_model] ON [dbo].[quotations] ([yacht_model_id]);
CREATE INDEX [IX_quotations_client] ON [dbo].[quotations] ([client_id]);
CREATE INDEX [IX_quotations_status] ON [dbo].[quotations] ([status]);
CREATE INDEX [IX_quotations_created_at] ON [dbo].[quotations] ([created_at] DESC);
GO

-- Contracts
CREATE INDEX [IX_contracts_quotation] ON [dbo].[contracts] ([quotation_id]);
CREATE INDEX [IX_contracts_client] ON [dbo].[contracts] ([client_id]);
CREATE INDEX [IX_contracts_status] ON [dbo].[contracts] ([status]);
GO

-- ATOs
CREATE INDEX [IX_ato_contract] ON [dbo].[additional_to_orders] ([contract_id]);
CREATE INDEX [IX_ato_status] ON [dbo].[additional_to_orders] ([status]);
GO

-- Audit Logs
CREATE INDEX [IX_audit_logs_user] ON [dbo].[audit_logs] ([user_id]);
CREATE INDEX [IX_audit_logs_table] ON [dbo].[audit_logs] ([table_name]);
CREATE INDEX [IX_audit_logs_created] ON [dbo].[audit_logs] ([created_at] DESC);
GO

PRINT 'Indexes created successfully!';
GO

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

PRINT '';
PRINT '=============================================';
PRINT ' OKEAN CPQ Migration Complete!';
PRINT '=============================================';
PRINT '';
PRINT ' Tables created: 38';
PRINT ' Foreign keys: 24';
PRINT ' Indexes: 25+';
PRINT '';
PRINT ' NOTE: Large tables are in separate files:';
PRINT '   - memorial_categories (50 rows)';
PRINT '   - job_stops (30 rows)';
PRINT '   - hull_numbers (76 rows)';
PRINT '   - options (49 rows)';
PRINT '   - memorial_upgrades (17 rows)';
PRINT '   - memorial_items (2001 rows)';
PRINT '   - role_permissions_config (92 rows)';
PRINT '   - audit_logs (3108 rows)';
PRINT '';
PRINT ' See: supabase/sqlserver-migration-data.sql';
PRINT '=============================================';
GO
