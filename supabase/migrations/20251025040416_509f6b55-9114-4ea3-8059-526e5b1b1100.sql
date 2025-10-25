-- Criar policy para permitir acesso público às cotações usando secure_token
CREATE POLICY "Allow public access to quotations with valid secure_token"
  ON quotations
  FOR SELECT
  TO anon
  USING (secure_token IS NOT NULL);

-- Criar policy para permitir acesso público aos dados relacionados quando a cotação é acessível
CREATE POLICY "Allow public access to yacht_models for public quotations"
  ON yacht_models
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.yacht_model_id = yacht_models.id
      AND quotations.secure_token IS NOT NULL
    )
  );

CREATE POLICY "Allow public access to clients for public quotations"
  ON clients
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.client_id = clients.id
      AND quotations.secure_token IS NOT NULL
    )
  );

CREATE POLICY "Allow public access to quotation_options for public quotations"
  ON quotation_options
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_options.quotation_id
      AND quotations.secure_token IS NOT NULL
    )
  );

CREATE POLICY "Allow public access to quotation_customizations for public quotations"
  ON quotation_customizations
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_customizations.quotation_id
      AND quotations.secure_token IS NOT NULL
    )
  );

CREATE POLICY "Allow public access to options for public quotations"
  ON options
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotation_options qo
      JOIN quotations q ON q.id = qo.quotation_id
      WHERE qo.option_id = options.id
      AND q.secure_token IS NOT NULL
    )
  );

CREATE POLICY "Allow public access to memorial_items for public quotations"
  ON memorial_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.yacht_model_id = memorial_items.yacht_model_id
      AND quotations.secure_token IS NOT NULL
    )
  );

CREATE POLICY "Allow public access to memorial_categories for public quotations"
  ON memorial_categories
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM memorial_items mi
      JOIN quotations q ON q.yacht_model_id = mi.yacht_model_id
      WHERE mi.category_id = memorial_categories.id
      AND q.secure_token IS NOT NULL
    )
  );

CREATE POLICY "Allow public access to users for public quotations"
  ON users
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.sales_representative_id = users.id
      AND quotations.secure_token IS NOT NULL
    )
  );