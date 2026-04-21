-- Opcional: Adiciona a coluna para controlar o funcionamento global do sistema de Gacha para o Casal.
-- Rode este script no Editor SQL do seu projeto:

ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS gacha_enabled BOOLEAN DEFAULT true;
