export type Member = {
  id: string;
  name: string;
  nationality: string;
  phone: string;
  joinedOn: string;
  leftOn: string | null;
  createdAt: string;
};

export type ExpenseCategory = "GROCERY" | "HOUSEHOLD" | "OTHER";

export type Expense = {
  id: string;
  paidBy: string;
  payerName: string;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  amount: number;
  purchasedAt: string;
};

export type UtilityType = "ELECTRICITY" | "WATER";

export type UtilityBill = {
  id: string;
  type: UtilityType;
  billStart: string;
  billEnd: string;
  amount: number;
  paidBy: string | null;
  payerName: string | null;
  notes: string | null;
  createdAt: string;
};

export type UtilityPayment = {
  id: string;
  utilityBillId: string;
  memberId: string;
  memberName: string;
  month: string;
  amount: number;
  paidAt: string;
};

export type UtilityShareStatus = {
  memberId: string;
  memberName: string;
  share: number;
  paidAmount: number;
  dueAmount: number;
  isPaid: boolean;
  paidAt: string | null;
};

export type Settings = {
  householdName: string;
  rentPerPerson: number;
  currency: string;
};

export type MemberBalance = {
  id: string;
  name: string;
  rent: number;
  groceries: number;
  utilities: number;
  utilityPaid: number;
  utilityDue: number;
  unpaidUtilities: number;
  paidForHouse: number;
  internalShare: number;
  netBalance: number;
  totalObligation: number;
};

export type Settlement = {
  fromId: string;
  from: string;
  toId: string;
  to: string;
  amount: number;
};

export type MonthSnapshot = {
  month: string;
  settings: Settings;
  participants: Member[];
  expenses: Expense[];
  bills: (UtilityBill & {
    allocatedAmount: number;
    shares: UtilityShareStatus[];
    residentPaidTotal: number;
    residentDueTotal: number;
    clearedResidents: number;
  })[];
  groceryTotal: number;
  electricityTotal: number;
  waterTotal: number;
  utilityTotal: number;
  utilityResidentPaidTotal: number;
  utilityResidentDueTotal: number;
  unpaidUtilityTotal: number;
  rentTotal: number;
  sharedTotal: number;
  householdTotal: number;
  balances: MemberBalance[];
  settlements: Settlement[];
};

export type TrendPoint = {
  month: string;
  label: string;
  rent: number;
  groceries: number;
  utilities: number;
  total: number;
};
