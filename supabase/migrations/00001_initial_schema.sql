-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Tables Schema

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company_reg_no TEXT,
    country TEXT CHECK (country IN ('IN', 'AE')),
    currency TEXT CHECK (currency IN ('INR', 'AED')),
    upi_vpa TEXT,
    upi_payee_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('SUPERADMIN', 'OWNER', 'WARDEN', 'RESIDENT', 'SERVICE_PROVIDER')),
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_locale TEXT CHECK (preferred_locale IN ('en', 'hi', 'ta', 'ml')),
    kyc_document_url TEXT,
    kyc_status TEXT CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    tier TEXT CHECK (tier IN ('AC', 'NON_AC')),
    washroom_type TEXT CHECK (washroom_type IN ('ATTACHED', 'COMMON')),
    base_rent_monthly NUMERIC(10, 2),
    base_rent_weekly NUMERIC(10, 2),
    capacity INT
);

CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    bed_label TEXT,
    is_occupied BOOLEAN DEFAULT FALSE
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    stay_type TEXT CHECK (stay_type IN ('WEEKLY', 'MONTHLY')),
    start_date DATE NOT NULL,
    end_date DATE,
    fixed_base_rent NUMERIC(10, 2),
    security_deposit NUMERIC(10, 2),
    status TEXT CHECK (status IN ('ACTIVE', 'TERMINATED', 'UPCOMING'))
);

CREATE TABLE meal_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    default_diet TEXT CHECK (default_diet IN ('VEG', 'NON_VEG', 'EGGITARIAN')),
    weekly_override_schedule JSONB
);

CREATE TABLE meal_daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    breakfast BOOLEAN DEFAULT FALSE,
    lunch BOOLEAN DEFAULT FALSE,
    dinner BOOLEAN DEFAULT FALSE,
    diet_override TEXT CHECK (diet_override IN ('VEG', 'NON_VEG', 'SKIP') OR diet_override IS NULL)
);

CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    category TEXT CHECK (category IN ('LAUNDRY', 'TIFFIN', 'GYM', 'WIFI', 'HOUSEKEEPING')),
    phone TEXT,
    upi_vpa TEXT,
    settlement_frequency TEXT CHECK (settlement_frequency IN ('WEEKLY', 'MONTHLY'))
);

CREATE TABLE service_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    billing_model TEXT CHECK (billing_model IN ('FLAT_MONTHLY', 'PER_UNIT', 'WEEKLY')),
    unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE resident_service_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT CHECK (status IN ('ACTIVE', 'CANCELLED')),
    prorated_daily_rate NUMERIC(10, 2)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    billing_cycle_start DATE,
    billing_cycle_end DATE,
    base_rent_amount NUMERIC(10, 2),
    add_ons_total NUMERIC(10, 2),
    discount_amount NUMERIC(10, 2),
    late_fee NUMERIC(10, 2),
    total_payable NUMERIC(10, 2),
    status TEXT CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE')),
    due_date DATE,
    payment_reference TEXT
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT,
    amount NUMERIC(10, 2),
    item_type TEXT CHECK (item_type IN ('BASE_RENT', 'SERVICE_ADDON', 'FINE', 'DEPOSIT'))
);

CREATE TABLE maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('ELECTRICAL', 'PLUMBING', 'AC', 'WIFI', 'OTHER')),
    priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'EMERGENCY')),
    description TEXT,
    image_urls TEXT[],
    status TEXT CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED'))
);

-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE .* ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Tenant Isolation: tenants" ON tenants FOR ALL USING (id = current_tenant_id());
CREATE POLICY "Tenant Isolation: profiles" ON profiles FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: rooms" ON rooms FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: beds" ON beds FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: bookings" ON bookings FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: meal_preferences" ON meal_preferences FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: meal_daily_logs" ON meal_daily_logs FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: service_providers" ON service_providers FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: service_catalog" ON service_catalog FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: resident_service_subscriptions" ON resident_service_subscriptions FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: invoices" ON invoices FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: invoice_items" ON invoice_items FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE tenant_id = current_tenant_id())
);
CREATE POLICY "Tenant Isolation: maintenance_tickets" ON maintenance_tickets FOR ALL USING (tenant_id = current_tenant_id());

CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_rooms_tenant_id ON rooms(tenant_id);
CREATE INDEX idx_beds_tenant_id ON beds(tenant_id);
CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_meal_preferences_tenant_id ON meal_preferences(tenant_id);
CREATE INDEX idx_meal_daily_logs_tenant_id ON meal_daily_logs(tenant_id);
CREATE INDEX idx_service_providers_tenant_id ON service_providers(tenant_id);
CREATE INDEX idx_service_catalog_tenant_id ON service_catalog(tenant_id);
CREATE INDEX idx_resident_service_subscriptions_tenant_id ON resident_service_subscriptions(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_maintenance_tickets_tenant_id ON maintenance_tickets(tenant_id);

CREATE INDEX idx_invoices_tenant_status_due_date ON invoices(tenant_id, status, due_date);
CREATE INDEX idx_beds_room_is_occupied ON beds(room_id, is_occupied);

ALTER TABLE meal_daily_logs ADD CONSTRAINT unique_resident_date UNIQUE (resident_id, date);

CREATE OR REPLACE FUNCTION generate_cycle_invoice(
    p_tenant_id UUID,
    p_booking_id UUID,
    p_resident_id UUID,
    p_cycle_start DATE,
    p_cycle_end DATE,
    p_base_rent NUMERIC,
    p_add_ons_total NUMERIC,
    p_total_payable NUMERIC
) RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_bed_id UUID;
    v_room_capacity INT;
    v_current_occupancy INT;
    v_existing_invoice UUID;
BEGIN
    SELECT id INTO v_existing_invoice
    FROM invoices
    WHERE tenant_id = p_tenant_id
      AND resident_id = p_resident_id
      AND billing_cycle_start = p_cycle_start
      AND status != 'PAID';

    IF v_existing_invoice IS NOT NULL THEN
        RAISE EXCEPTION 'Duplicate active invoice exists for resident in this cycle.';
    END IF;

    SELECT bed_id INTO v_bed_id
    FROM bookings
    WHERE id = p_booking_id;

    IF v_bed_id IS NOT NULL THEN
        SELECT capacity INTO v_room_capacity
        FROM rooms r
        JOIN beds b ON b.room_id = r.id
        WHERE b.id = v_bed_id;

        SELECT COUNT(*) INTO v_current_occupancy
        FROM beds b
        WHERE b.room_id = (SELECT room_id FROM beds WHERE id = v_bed_id)
          AND b.is_occupied = TRUE;

        IF v_current_occupancy >= v_room_capacity THEN
            RAISE EXCEPTION 'Bed capacity exceeded for this room.';
        END IF;
    END IF;

    INSERT INTO invoices (
        tenant_id, booking_id, resident_id, billing_cycle_start, billing_cycle_end,
        base_rent_amount, add_ons_total, discount_amount, late_fee, total_payable,
        status, due_date
    ) VALUES (
        p_tenant_id, p_booking_id, p_resident_id, p_cycle_start, p_cycle_end,
        p_base_rent, p_add_ons_total, 0, 0, p_total_payable,
        'UNPAID', p_cycle_start + INTERVAL '5 days'
    ) RETURNING id INTO v_invoice_id;

    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;
