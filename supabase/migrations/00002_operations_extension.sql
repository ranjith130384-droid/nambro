-- MODULE 8: AI CAMERA SUB-METER
CREATE TABLE meter_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    previous_reading NUMERIC,
    current_reading NUMERIC,
    units_consumed NUMERIC GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
    rate_per_unit NUMERIC,
    total_cost NUMERIC,
    split_count INT,
    per_head_amount NUMERIC,
    meter_image_url TEXT,
    billing_month VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);

-- MODULE 9: MOVE-IN / MOVE-OUT INSPECTION
CREATE TABLE inspection_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    inspection_type TEXT CHECK (inspection_type IN ('CHECK_IN', 'CHECK_OUT')),
    checklist_data JSONB,
    damage_photos TEXT[],
    total_deduction NUMERIC DEFAULT 0,
    refund_payable NUMERIC,
    refund_status TEXT CHECK (refund_status IN ('PENDING', 'APPROVED', 'DISBURSED')),
    refund_vpa TEXT,
    refund_utr TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MODULE 12: GATE PASS & LATE PASS
CREATE TABLE late_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    valid_date DATE,
    expected_return_time TIME,
    reason TEXT,
    status TEXT CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED'))
);

CREATE TABLE gate_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    direction TEXT CHECK (direction IN ('IN', 'OUT')),
    timestamp TIMESTAMP DEFAULT NOW(),
    is_curfew_violation BOOLEAN DEFAULT FALSE,
    late_pass_id UUID REFERENCES late_passes(id) ON DELETE SET NULL
);

-- MODULE 13: ROOMMATE INTAKE MATCHER
CREATE TABLE roommate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sleep_schedule TEXT CHECK (sleep_schedule IN ('EARLY_BIRD', 'NIGHT_OWL')),
    work_shift TEXT CHECK (work_shift IN ('GENERAL_DAY', 'US_UK_NIGHT', 'HYBRID')),
    ac_tolerance TEXT CHECK (ac_tolerance IN ('COLD_18', 'MODERATE_24', 'NO_AC')),
    study_preference TEXT CHECK (study_preference IN ('QUIET_ZONE', 'CASUAL'))
);

-- MODULE 14: KITCHEN INVENTORY
CREATE TABLE kitchen_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    meal_type TEXT CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER')),
    diet_type TEXT CHECK (diet_type IN ('VEG', 'NON_VEG')),
    ingredient_name TEXT NOT NULL,
    grams_per_head NUMERIC NOT NULL
);

CREATE TABLE grocery_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT CHECK (unit IN ('KG', 'LITRE', 'BAG')),
    price_paid NUMERIC NOT NULL,
    vendor_name TEXT,
    purchase_date DATE NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_purchases ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR TENANT ISOLATION
CREATE POLICY "Tenant Isolation: meter_readings" ON meter_readings FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: inspection_reports" ON inspection_reports FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: late_passes" ON late_passes FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: gate_logs" ON gate_logs FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: roommate_profiles" ON roommate_profiles FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: kitchen_recipes" ON kitchen_recipes FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation: grocery_purchases" ON grocery_purchases FOR ALL USING (tenant_id = current_tenant_id());
