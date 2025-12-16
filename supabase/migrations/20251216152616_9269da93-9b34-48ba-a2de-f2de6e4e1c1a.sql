-- Passo 1: Limpar referências órfãs em memorial_items
UPDATE memorial_items 
SET job_stop_id = NULL 
WHERE job_stop_id IS NOT NULL 
  AND job_stop_id NOT IN (SELECT id FROM job_stops);

-- Passo 2: Limpar referências órfãs em options
UPDATE options 
SET job_stop_id = NULL 
WHERE job_stop_id IS NOT NULL 
  AND job_stop_id NOT IN (SELECT id FROM job_stops);

-- Passo 3: Criar FK para memorial_items
ALTER TABLE memorial_items
ADD CONSTRAINT fk_memorial_items_job_stop
FOREIGN KEY (job_stop_id) 
REFERENCES job_stops(id)
ON DELETE SET NULL;

-- Passo 4: Criar FK para options
ALTER TABLE options
ADD CONSTRAINT fk_options_job_stop
FOREIGN KEY (job_stop_id) 
REFERENCES job_stops(id)
ON DELETE SET NULL;