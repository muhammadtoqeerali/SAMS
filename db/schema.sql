CREATE TABLE IF NOT EXISTS household_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  household_name varchar(120) NOT NULL DEFAULT 'Our Apartment',
  rent_per_person numeric(10,2) NOT NULL DEFAULT 150.00 CHECK (rent_per_person >= 0),
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
INSERT INTO household_settings (id, household_name, rent_per_person, currency)
VALUES (1, 'Our Apartment', 150.00, 'EUR')
ON CONFLICT (id) DO NOTHING;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  nationality varchar(80) NOT NULL,
  phone varchar(40) NOT NULL,
  joined_on date NOT NULL DEFAULT CURRENT_DATE,
  left_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_membership_dates CHECK (left_on IS NULL OR left_on >= joined_on)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY,
  paid_by uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  title varchar(140) NOT NULL,
  description text,
  category varchar(30) NOT NULL DEFAULT 'GROCERY' CHECK (category IN ('GROCERY', 'HOUSEHOLD', 'OTHER')),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS expenses_purchased_at_idx ON expenses (purchased_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS expenses_paid_by_idx ON expenses (paid_by);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS utility_bills (
  id uuid PRIMARY KEY,
  type varchar(20) NOT NULL CHECK (type IN ('ELECTRICITY', 'WATER')),
  bill_start date NOT NULL,
  bill_end date NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  paid_by uuid REFERENCES members(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_bill_dates CHECK (bill_end >= bill_start)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS utility_bills_range_idx ON utility_bills (bill_start, bill_end);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS utility_payments (
  id uuid PRIMARY KEY,
  utility_bill_id uuid NOT NULL REFERENCES utility_bills(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  month char(7) NOT NULL CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (utility_bill_id, member_id, month)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS utility_payments_month_idx ON utility_payments (month, utility_bill_id);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS rent_payments (
  id uuid PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  month char(7) NOT NULL CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, month)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS rent_payments_month_idx ON rent_payments (month, member_id);
