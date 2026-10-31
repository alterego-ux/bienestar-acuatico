-- Campo opcional de contacto del predio. Migración aditiva y segura para datos existentes.
ALTER TABLE predio
  ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(40);
