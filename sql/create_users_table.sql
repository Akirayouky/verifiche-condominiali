-- Tabella per gestire gli utenti del sistema
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'sopralluoghista')),
    nome VARCHAR(100),
    cognome VARCHAR(100),
    telefono VARCHAR(20),
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Inserimento dell'admin di default
INSERT INTO users (username, email, password_hash, role, nome, cognome, attivo, approved_at)
VALUES (
    'admin',
    'admin@condomini.app',
    '$2b$12$LQv3c1yqBfcCYjTemlDgtOgIrVHsFUU8xpY1Ej.V6Hj6TKqSf2O6G', -- password: admin123
    'admin',
    'Amministratore',
    'Sistema',
    true,
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli admin di vedere tutti gli utenti
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy per permettere agli utenti di vedere solo i propri dati
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (id = auth.uid());

-- Policy per permettere agli admin di modificare tutti gli utenti
CREATE POLICY "Admin can modify all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );