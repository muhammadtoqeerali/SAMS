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

export type RentPayment = {
  id: string;
  memberId: string;
  memberName: string;
  month: string;
  amount: number;
  paidAt: string;
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
  rentPaid: number;
  rentDue: number;
  rentPaidAt: string | null;
  groceries: number;
  utilities: number;
  utilityPaid: number;
  utilityDue: number;
  externalUtilityDue: number;
  unpaidUtilities: number;
  paidForHouse: number;
  outOfPocketPaid: number;
  internalShare: number;
  netBalance: number;
  totalObligation: number;
  totalDue: number;
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
  rentResidentPaidTotal: number;
  rentResidentDueTotal: number;
  sharedTotal: number;
  householdTotal: number;
  balances: MemberBalance[];
  settlements: Settlement[];
};

export type MemberLifetimeSummary = {
  member: Member;
  monthsResident: number;
  firstMonth: string;
  lastMonth: string;
  totalResponsibility: number;
  recordedCashPaid: number;
  rentCharged: number;
  rentPaid: number;
  rentDue: number;
  groceriesCharged: number;
  utilitiesCharged: number;
  utilitiesPaid: number;
  utilityDue: number;
  externalUtilityDue: number;
  housePurchasesPaid: number;
  utilityBillsCovered: number;
  roommateBalance: number;
  roommateDue: number;
  roommateCredit: number;
  totalDue: number;
};

export type MemberMonthLedger = {
  month: string;
  rent: number;
  rentPaid: number;
  rentDue: number;
  rentPaidAt: string | null;
  groceries: number;
  utilities: number;
  utilityPaid: number;
  utilityDue: number;
  externalUtilityDue: number;
  housePurchasesPaid: number;
  paidForHouse: number;
  outOfPocketPaid: number;
  roommateBalance: number;
  totalObligation: number;
  totalDue: number;
};

export type MemberLedger = {
  summary: MemberLifetimeSummary;
  months: MemberMonthLedger[];
};

export type TrendPoint = {
  month: string;
  label: string;
  rent: number;
  groceries: number;
  utilities: number;
  total: number;
};
