-- CivicDirect 2.0 - Core PostgreSQL Schema
-- Run this in the Supabase SQL Editor

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (Strict constraints for state machines)
CREATE TYPE request_status AS ENUM ('pending', 'active', 'fully_funded', 'disbursed', 'rejected');
CREATE TYPE urgency_level AS ENUM ('normal', 'high', 'critical');

-- 3. TABLES
CREATE TABLE ngos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL, -- Links to Clerk Auth
    name TEXT NOT NULL,
    registration_number TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    city_zone TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL, -- Links to Clerk Auth
    full_name TEXT NOT NULL,
    wallet_balance INTEGER DEFAULT 0, -- Stored in PKR
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- 'medical', 'education', 'utility', etc.
    target_amount INTEGER NOT NULL,
    raised_amount INTEGER DEFAULT 0,
    status request_status DEFAULT 'pending',
    urgency_level urgency_level DEFAULT 'normal',
    proof_image_url TEXT,
    details JSONB DEFAULT '{}'::jsonb, -- DYNAMIC PAYLOAD: holds hospital name, student ID, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES donors(id),
    request_id UUID REFERENCES requests(id),
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ESCROW STATE MACHINE TRIGGER
-- This prevents race conditions and automatically moves campaigns out of the donor app when funded
CREATE OR REPLACE FUNCTION check_escrow_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raised_amount >= NEW.target_amount AND OLD.status = 'active' THEN
        NEW.status = 'fully_funded';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_escrow
BEFORE UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION check_escrow_status();

-- 5. DONATION PROCESSING FUNCTION (RPC)
-- Safely moves money from wallet to campaign inside a strict transaction
CREATE OR REPLACE FUNCTION process_donation(p_donor_id UUID, p_request_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
DECLARE
    v_wallet_balance INTEGER;
    v_campaign_status request_status;
BEGIN
    -- Check campaign status
    SELECT status INTO v_campaign_status FROM requests WHERE id = p_request_id;
    IF v_campaign_status != 'active' THEN
        RAISE EXCEPTION 'Campaign is not active';
    END IF;

    -- Check wallet balance
    SELECT wallet_balance INTO v_wallet_balance FROM donors WHERE id = p_donor_id;
    IF v_wallet_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    -- Execute logic (ACID compliant)
    UPDATE donors SET wallet_balance = wallet_balance - p_amount WHERE id = p_donor_id;
    UPDATE requests SET raised_amount = raised_amount + p_amount WHERE id = p_request_id;
    INSERT INTO transactions (donor_id, request_id, amount) VALUES (p_donor_id, p_request_id, p_amount);
END;
$$ LANGUAGE plpgsql;