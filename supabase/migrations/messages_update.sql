
-- Verificar que la tabla messages existe y tiene las políticas correctas
DO $$ 
BEGIN
    -- Crear la tabla si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        CREATE TABLE messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            content TEXT NOT NULL,
            sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
            receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;

    -- Habilitar RLS
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

    -- Eliminar políticas existentes si existen
    DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

    -- Crear nuevas políticas
    CREATE POLICY "Users can view their own messages" ON messages
        FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

    CREATE POLICY "Users can send messages" ON messages
        FOR INSERT WITH CHECK (auth.uid() = sender_id);

    CREATE POLICY "Users can update their received messages" ON messages
        FOR UPDATE USING (auth.uid() = receiver_id);

    -- Crear índices para mejor rendimiento
    CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
END $$;
