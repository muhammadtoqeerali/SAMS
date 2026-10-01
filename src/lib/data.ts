import "server-only";

import { getDb } from "@/lib/db";
import { currentMonth, daysInclusive, monthBounds, monthsBack, monthsBetween, overlapDays } from "@/lib/month";
import { shortMonthLabel } from "@/lib/format";
import type {
  Expense,
  Member,
  MemberBalance,
  MemberLedger,
  MemberLifetimeSummary,
  MemberMonthLedger,
  MonthSnapshot,
  RentPayment,
  Settings,
  Settlement,
  TrendPoint,
  UtilityBill,
  UtilityPayment,
  UtilityShareStatus,
} from "@/lib/types";

type Row = Record<string, unknown>;
type ExpenseWithMonth = Expense & { month: string };

const num = (value: unknown) => Number(value ?? 0);
const text = (value: unknown) => String(value ?? "");
const nullableText = (value: unknown) => (value == null ? null : String(value));
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function memberFromRow(row: Row): Member {
  return {
    id: text(row.id),
    name: text(row.name),
    nationality: text(row.nationality),
    phone: text(row.phone),
    joinedOn: text(row.joined_on),
    leftOn: nullableText(row.left_on),
    createdAt: text(row.created_at),
  };
}

function expenseFromRow(row: Row): Expense {
  return {
    id: text(row.id),
    paidBy: text(row.paid_by),
    payerName: text(row.payer_name),
    title: text(row.title),
    description: nullableText(row.description),
    category: text(row.category) as Expense["category"],
    amount: num(row.amount),
    purchasedAt: text(row.purchased_at),
  };
}

function utilityFromRow(row: Row): UtilityBill {
  return {
    id: text(row.id),
    type: text(row.type) as UtilityBill["type"],
    billStart: text(row.bill_start),
    billEnd: text(row.bill_end),
    amount: num(row.amount),
    paidBy: nullableText(row.paid_by),
    payerName: nullableText(row.payer_name),
    notes: nullableText(row.notes),
    createdAt: text(row.created_at),
  };
}

function utilityPaymentFromRow(row: Row): UtilityPayment {
  return {
    id: text(row.id),
    utilityBillId: text(row.utility_bill_id),
    memberId: text(row.member_id),
    memberName: text(row.member_name),
    month: text(row.month),
    amount: num(row.amount),
    paidAt: text(row.paid_at),
  };
}

function rentPaymentFromRow(row: Row): RentPayment {
  return {
    id: text(row.id),
    memberId: text(row.member_id),
    memberName: text(row.member_name),
    month: text(row.month),
    amount: num(row.amount),
    paidAt: text(row.paid_at),
  };
}

export async function getSettings(): Promise<Settings> {
  const sql = getDb();
  const rows = (await sql`
    SELECT household_name, rent_per_person, currency
    FROM household_settings
    WHERE id = 1
  `) as Row[];
  const row = rows[0];
  if (!row) return { householdName: "Our Apartment", rentPerPerson: 150, currency: "EUR" };
  return {
    householdName: text(row.household_name),
    rentPerPerson: num(row.rent_per_person),
    currency: text(row.currency),
  };
}

export async function getAllMembers(): Promise<Member[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id, name, nationality, phone, joined_on, left_on, created_at
    FROM members
    ORDER BY left_on NULLS FIRST, name ASC
  `) as Row[];
  return rows.map(memberFromRow);
}

export async function getActiveMembersOn(date: string): Promise<Member[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id, name, nationality, phone, joined_on, left_on, created_at
    FROM members
    WHERE joined_on <= ${date}::date
      AND (left_on IS NULL OR left_on >= ${date}::date)
    ORDER BY name ASC
  `) as Row[];
  return rows.map(memberFromRow);
}

async function getParticipants(month: string): Promise<Member[]> {
  const { start, end } = monthBounds(month);
  const sql = getDb();
  const rows = (await sql`
    SELECT id, name, nationality, phone, joined_on, left_on, created_at
    FROM members
    WHERE joined_on <= ${end}::date
      AND (left_on IS NULL OR left_on >= ${start}::date)
    ORDER BY name ASC
  `) as Row[];
  return rows.map(memberFromRow);
}

export async function getExpensesForMonth(month: string): Promise<Expense[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT e.id, e.paid_by, m.name AS payer_name, e.title, e.description,
           e.category, e.amount, e.purchased_at
    FROM expenses e
    JOIN members m ON m.id = e.paid_by
    WHERE to_char(e.purchased_at AT TIME ZONE 'Europe/Rome', 'YYYY-MM') = ${month}
    ORDER BY e.purchased_at DESC
  `) as Row[];
  return rows.map(expenseFromRow);
}

export async function getBillsOverlappingMonth(month: string): Promise<UtilityBill[]> {
  const { start, end } = monthBounds(month);
  const sql = getDb();
  const rows = (await sql`
    SELECT b.id, b.type, b.bill_start, b.bill_end, b.amount, b.paid_by,
           m.name AS payer_name, b.notes, b.created_at
    FROM utility_bills b
    LEFT JOIN members m ON m.id = b.paid_by
    WHERE b.bill_start <= ${end}::date AND b.bill_end >= ${start}::date
    ORDER BY b.bill_end DESC, b.created_at DESC
  `) as Row[];
  return rows.map(utilityFromRow);
}

export async function getUtilityPaymentsForMonth(month: string): Promise<UtilityPayment[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT p.id, p.utility_bill_id, p.member_id, m.name AS member_name,
           p.month, p.amount, p.paid_at
    FROM utility_payments p
    JOIN members m ON m.id = p.member_id
    WHERE p.month = ${month}
    ORDER BY p.paid_at DESC
  `) as Row[];
  return rows.map(utilityPaymentFromRow);
}

export async function getRentPaymentsForMonth(month: string): Promise<RentPayment[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT p.id, p.member_id, m.name AS member_name, p.month, p.amount, p.paid_at
    FROM rent_payments p
    JOIN members m ON m.id = p.member_id
    WHERE p.month = ${month}
    ORDER BY p.paid_at DESC
  `) as Row[];
  return rows.map(rentPaymentFromRow);
}

function allocatedBillAmount(bill: UtilityBill, month: string) {
  const { start, end } = monthBounds(month);
  const overlap = overlapDays(bill.billStart, bill.billEnd, start, end);
  const totalDays = daysInclusive(bill.billStart, bill.billEnd);
  return round((bill.amount * overlap) / totalDays);
}

function splitAmountExactly(amount: number, members: Member[]) {
  const result = new Map<string, number>();
  if (!members.length) return result;

  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / members.length);
  const remainder = cents - base * members.length;
  members.forEach((member, index) => {
    result.set(member.id, (base + (index < remainder ? 1 : 0)) / 100);
  });
  return result;
}

function buildSettlements(balances: MemberBalance[]): Settlement[] {
  const creditors = balances
    .filter((b) => b.netBalance > 0.009)
    .map((b) => ({ id: b.id, name: b.name, amount: round(b.netBalance) }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.netBalance < -0.009)
    .map((b) => ({ id: b.id, name: b.name, amount: round(-b.netBalance) }))
    .sort((a, b) => b.amount - a.amount);

  const result: Settlement[] = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = round(Math.min(creditors[c].amount, debtors[d].amount));
    if (amount > 0) {
      result.push({
        fromId: debtors[d].id,
        from: debtors[d].name,
        toId: creditors[c].id,
        to: creditors[c].name,
        amount,
      });
    }
    creditors[c].amount = round(creditors[c].amount - amount);
    debtors[d].amount = round(debtors[d].amount - amount);
    if (creditors[c].amount <= 0.009) c++;
    if (debtors[d].amount <= 0.009) d++;
  }
  return result;
}

function buildMonthSnapshot(
  month: string,
  settings: Settings,
  participants: Member[],
  expenses: Expense[],
  rawBills: UtilityBill[],
  utilityPayments: UtilityPayment[],
  rentPayments: RentPayment[],
): MonthSnapshot {
  const utilityPaymentMap = new Map(
    utilityPayments.map((payment) => [`${payment.utilityBillId}:${payment.memberId}`, payment]),
  );
  const rentPaymentMap = new Map(rentPayments.map((payment) => [payment.memberId, payment]));

  const bills = rawBills.map((bill) => {
    const allocatedAmount = allocatedBillAmount(bill, month);
    const split = splitAmountExactly(allocatedAmount, participants);
    const shares: UtilityShareStatus[] = participants.map((member) => {
      const share = split.get(member.id) ?? 0;
      const payment = utilityPaymentMap.get(`${bill.id}:${member.id}`);
      const paidAmount = payment ? Math.min(share, payment.amount || share) : 0;
      return {
        memberId: member.id,
        memberName: member.name,
        share,
        paidAmount: round(paidAmount),
        dueAmount: round(Math.max(0, share - paidAmount)),
        isPaid: Boolean(payment) && share - paidAmount <= 0.009,
        paidAt: payment?.paidAt ?? null,
      };
    });
    return {
      ...bill,
      allocatedAmount,
      shares,
      residentPaidTotal: round(shares.reduce((sum, item) => sum + item.paidAmount, 0)),
      residentDueTotal: round(shares.reduce((sum, item) => sum + item.dueAmount, 0)),
      clearedResidents: shares.filter((item) => item.isPaid).length,
    };
  });

  const people = participants.length;
  const groceryTotal = round(expenses.reduce((sum, item) => sum + item.amount, 0));
  const electricityTotal = round(
    bills.filter((bill) => bill.type === "ELECTRICITY").reduce((sum, bill) => sum + bill.allocatedAmount, 0),
  );
  const waterTotal = round(
    bills.filter((bill) => bill.type === "WATER").reduce((sum, bill) => sum + bill.allocatedAmount, 0),
  );
  const utilityTotal = round(electricityTotal + waterTotal);
  const utilityResidentPaidTotal = round(bills.reduce((sum, bill) => sum + bill.residentPaidTotal, 0));
  const utilityResidentDueTotal = round(bills.reduce((sum, bill) => sum + bill.residentDueTotal, 0));

  const unassignedUtilityTotal = round(
    bills.filter((bill) => !bill.paidBy).reduce((sum, bill) => sum + bill.allocatedAmount, 0),
  );
  const assignedUtilityTotal = round(utilityTotal - unassignedUtilityTotal);
  const rentTotal = round(settings.rentPerPerson * people);
  const sharedTotal = round(groceryTotal + utilityTotal);
  const householdTotal = round(rentTotal + sharedTotal);

  const groceryShare = people ? groceryTotal / people : 0;
  const utilityShare = people ? utilityTotal / people : 0;
  const assignedUtilityShare = people ? assignedUtilityTotal / people : 0;

  const balances: MemberBalance[] = participants.map((member) => {
    const rentPayment = rentPaymentMap.get(member.id);
    const rent = round(settings.rentPerPerson);
    const rentPaid = rentPayment ? round(Math.min(rent, rentPayment.amount || rent)) : 0;
    const rentDue = round(Math.max(0, rent - rentPaid));
    const expenseContribution = expenses
      .filter((expense) => expense.paidBy === member.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const utilityContribution = bills
      .filter((bill) => bill.paidBy === member.id)
      .reduce((sum, bill) => sum + bill.allocatedAmount, 0);
    const paidForHouse = round(expenseContribution + utilityContribution);
    const internalShare = round(groceryShare + assignedUtilityShare);
    const utilityStatuses = bills
      .map((bill) => bill.shares.find((share) => share.memberId === member.id))
      .filter(Boolean) as UtilityShareStatus[];
    const utilityPaid = round(utilityStatuses.reduce((sum, status) => sum + status.paidAmount, 0));
    const utilityDue = round(utilityStatuses.reduce((sum, status) => sum + status.dueAmount, 0));
    const externalUtilityDue = round(
      bills
        .filter((bill) => !bill.paidBy)
        .reduce((sum, bill) => {
          const share = bill.shares.find((item) => item.memberId === member.id);
          return sum + (share?.dueAmount ?? 0);
        }, 0),
    );
    const utilitySharePaymentsOutsideOwnBills = round(
      bills.reduce((sum, bill) => {
        const share = bill.shares.find((item) => item.memberId === member.id);
        if (!share || !share.isPaid || bill.paidBy === member.id) return sum;
        return sum + share.paidAmount;
      }, 0),
    );
    return {
      id: member.id,
      name: member.name,
      rent,
      rentPaid,
      rentDue,
      rentPaidAt: rentPayment?.paidAt ?? null,
      groceries: round(groceryShare),
      utilities: round(utilityShare),
      utilityPaid,
      utilityDue,
      externalUtilityDue,
      unpaidUtilities: externalUtilityDue,
      paidForHouse,
      outOfPocketPaid: round(rentPaid + expenseContribution + utilityContribution + utilitySharePaymentsOutsideOwnBills),
      internalShare,
      netBalance: round(paidForHouse - internalShare),
      totalObligation: round(rent + groceryShare + utilityShare),
      totalDue: 0,
    };
  });

  // Confirmed utility-share payments are transfers to the named bill holder.
  // Applying them here prevents an already-paid share from appearing again in roommate settlement.
  const balanceMap = new Map(balances.map((balance) => [balance.id, balance]));
  for (const bill of bills) {
    if (!bill.paidBy) continue;
    const holder = balanceMap.get(bill.paidBy);
    if (!holder) continue;
    for (const share of bill.shares) {
      if (!share.isPaid || share.memberId === bill.paidBy) continue;
      const member = balanceMap.get(share.memberId);
      if (!member) continue;
      member.netBalance = round(member.netBalance + share.paidAmount);
      holder.netBalance = round(holder.netBalance - share.paidAmount);
    }
  }

  for (const balance of balances) {
    balance.totalDue = round(balance.rentDue + balance.externalUtilityDue + Math.max(0, -balance.netBalance));
  }

  const rentResidentPaidTotal = round(balances.reduce((sum, balance) => sum + balance.rentPaid, 0));
  const rentResidentDueTotal = round(balances.reduce((sum, balance) => sum + balance.rentDue, 0));

  return {
    month,
    settings,
    participants,
    expenses,
    bills,
    groceryTotal,
    electricityTotal,
    waterTotal,
    utilityTotal,
    utilityResidentPaidTotal,
    utilityResidentDueTotal,
    unpaidUtilityTotal: unassignedUtilityTotal,
    rentTotal,
    rentResidentPaidTotal,
    rentResidentDueTotal,
    sharedTotal,
    householdTotal,
    balances,
    settlements: buildSettlements(balances),
  };
}

export async function getMonthSnapshot(month: string): Promise<MonthSnapshot> {
  const [settings, participants, expenses, rawBills, utilityPayments, rentPayments] = await Promise.all([
    getSettings(),
    getParticipants(month),
    getExpensesForMonth(month),
    getBillsOverlappingMonth(month),
    getUtilityPaymentsForMonth(month),
    getRentPaymentsForMonth(month),
  ]);
  return buildMonthSnapshot(month, settings, participants, expenses, rawBills, utilityPayments, rentPayments);
}

async function getSnapshotRange(fromMonth: string, throughMonth: string): Promise<MonthSnapshot[]> {
  const months = monthsBetween(fromMonth, throughMonth);
  if (!months.length) return [];
  const first = monthBounds(months[0]).start;
  const last = monthBounds(months.at(-1)!).end;
  const sql = getDb();

  const [settings, members, expenseRows, billRows, utilityPaymentRows, rentPaymentRows] = await Promise.all([
    getSettings(),
    getAllMembers(),
    sql`
      SELECT e.id, e.paid_by, m.name AS payer_name, e.title, e.description,
             e.category, e.amount, e.purchased_at,
             to_char(e.purchased_at AT TIME ZONE 'Europe/Rome', 'YYYY-MM') AS month
      FROM expenses e
      JOIN members m ON m.id = e.paid_by
      WHERE (e.purchased_at AT TIME ZONE 'Europe/Rome')::date BETWEEN ${first}::date AND ${last}::date
      ORDER BY e.purchased_at DESC
    ` as Promise<Row[]>,
    sql`
      SELECT b.id, b.type, b.bill_start, b.bill_end, b.amount, b.paid_by,
             m.name AS payer_name, b.notes, b.created_at
      FROM utility_bills b
      LEFT JOIN members m ON m.id = b.paid_by
      WHERE b.bill_start <= ${last}::date AND b.bill_end >= ${first}::date
    ` as Promise<Row[]>,
    sql`
      SELECT p.id, p.utility_bill_id, p.member_id, m.name AS member_name,
             p.month, p.amount, p.paid_at
      FROM utility_payments p
      JOIN members m ON m.id = p.member_id
      WHERE p.month BETWEEN ${months[0]} AND ${months.at(-1)!}
    ` as Promise<Row[]>,
    sql`
      SELECT p.id, p.member_id, m.name AS member_name, p.month, p.amount, p.paid_at
      FROM rent_payments p
      JOIN members m ON m.id = p.member_id
      WHERE p.month BETWEEN ${months[0]} AND ${months.at(-1)!}
    ` as Promise<Row[]>,
  ]);

  const expenses = expenseRows.map((row) => ({ ...expenseFromRow(row), month: text(row.month) })) as ExpenseWithMonth[];
  const bills = billRows.map(utilityFromRow);
  const utilityPayments = utilityPaymentRows.map(utilityPaymentFromRow);
  const rentPayments = rentPaymentRows.map(rentPaymentFromRow);

  return months.map((month) => {
    const { start, end } = monthBounds(month);
    const participants = members.filter((member) => member.joinedOn <= end && (!member.leftOn || member.leftOn >= start));
    const monthExpenses = expenses.filter((expense) => expense.month === month);
    const monthBills = bills.filter((bill) => bill.billStart <= end && bill.billEnd >= start);
    return buildMonthSnapshot(
      month,
      settings,
      participants,
      monthExpenses,
      monthBills,
      utilityPayments.filter((payment) => payment.month === month),
      rentPayments.filter((payment) => payment.month === month),
    );
  });
}

function summarizeMember(member: Member, snapshots: MonthSnapshot[]): MemberLifetimeSummary {
  const activeSnapshots = snapshots.filter((snapshot) => snapshot.balances.some((balance) => balance.id === member.id));
  const balances = activeSnapshots
    .map((snapshot) => snapshot.balances.find((balance) => balance.id === member.id))
    .filter(Boolean) as MemberBalance[];

  const rentCharged = round(balances.reduce((sum, balance) => sum + balance.rent, 0));
  const rentPaid = round(balances.reduce((sum, balance) => sum + balance.rentPaid, 0));
  const rentDue = round(balances.reduce((sum, balance) => sum + balance.rentDue, 0));
  const groceriesCharged = round(balances.reduce((sum, balance) => sum + balance.groceries, 0));
  const utilitiesCharged = round(balances.reduce((sum, balance) => sum + balance.utilities, 0));
  const utilitiesPaid = round(balances.reduce((sum, balance) => sum + balance.utilityPaid, 0));
  const utilityDue = round(balances.reduce((sum, balance) => sum + balance.utilityDue, 0));
  const externalUtilityDue = round(balances.reduce((sum, balance) => sum + balance.externalUtilityDue, 0));
  const roommateBalance = round(balances.reduce((sum, balance) => sum + balance.netBalance, 0));
  const housePurchasesPaid = round(
    activeSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.expenses.filter((expense) => expense.paidBy === member.id).reduce((s, expense) => s + expense.amount, 0),
      0,
    ),
  );
  const utilityBillsCovered = round(
    activeSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.bills.filter((bill) => bill.paidBy === member.id).reduce((s, bill) => s + bill.allocatedAmount, 0),
      0,
    ),
  );
  const recordedCashPaid = round(balances.reduce((sum, balance) => sum + balance.outOfPocketPaid, 0));
  const roommateDue = round(Math.max(0, -roommateBalance));
  const roommateCredit = round(Math.max(0, roommateBalance));

  return {
    member,
    monthsResident: activeSnapshots.length,
    firstMonth: activeSnapshots[0]?.month ?? member.joinedOn.slice(0, 7),
    lastMonth: activeSnapshots.at(-1)?.month ?? member.joinedOn.slice(0, 7),
    totalResponsibility: round(rentCharged + groceriesCharged + utilitiesCharged),
    recordedCashPaid,
    rentCharged,
    rentPaid,
    rentDue,
    groceriesCharged,
    utilitiesCharged,
    utilitiesPaid,
    utilityDue,
    externalUtilityDue,
    housePurchasesPaid,
    utilityBillsCovered,
    roommateBalance,
    roommateDue,
    roommateCredit,
    totalDue: round(rentDue + externalUtilityDue + roommateDue),
  };
}

export async function getMemberOverviews(throughMonth = currentMonth()): Promise<MemberLifetimeSummary[]> {
  const members = await getAllMembers();
  if (!members.length) return [];
  const pastOrCurrent = members.filter((member) => member.joinedOn.slice(0, 7) <= throughMonth);
  if (!pastOrCurrent.length) return members.map((member) => summarizeMember(member, []));
  const firstMonth = pastOrCurrent.map((member) => member.joinedOn.slice(0, 7)).sort()[0];
  const snapshots = await getSnapshotRange(firstMonth, throughMonth);
  return members.map((member) => summarizeMember(member, snapshots));
}

export async function getMemberLedger(memberId: string, throughMonth = currentMonth()): Promise<MemberLedger | null> {
  const members = await getAllMembers();
  const member = members.find((item) => item.id === memberId);
  if (!member) return null;
  const fromMonth = member.joinedOn.slice(0, 7);
  const snapshots = fromMonth <= throughMonth ? await getSnapshotRange(fromMonth, throughMonth) : [];
  const activeSnapshots = snapshots.filter((snapshot) => snapshot.balances.some((balance) => balance.id === member.id));
  const months: MemberMonthLedger[] = activeSnapshots.map((snapshot) => {
    const balance = snapshot.balances.find((item) => item.id === member.id)!;
    const housePurchasesPaid = round(
      snapshot.expenses.filter((expense) => expense.paidBy === member.id).reduce((sum, expense) => sum + expense.amount, 0),
    );
    return {
      month: snapshot.month,
      rent: balance.rent,
      rentPaid: balance.rentPaid,
      rentDue: balance.rentDue,
      rentPaidAt: balance.rentPaidAt,
      groceries: balance.groceries,
      utilities: balance.utilities,
      utilityPaid: balance.utilityPaid,
      utilityDue: balance.utilityDue,
      externalUtilityDue: balance.externalUtilityDue,
      housePurchasesPaid,
      paidForHouse: balance.paidForHouse,
      outOfPocketPaid: balance.outOfPocketPaid,
      roommateBalance: balance.netBalance,
      totalObligation: balance.totalObligation,
      totalDue: balance.totalDue,
    };
  }).reverse();

  return { summary: summarizeMember(member, activeSnapshots), months };
}

export async function getTrend(throughMonth: string, count = 12): Promise<TrendPoint[]> {
  const months = monthsBack(throughMonth, count);
  const first = monthBounds(months[0]).start;
  const last = monthBounds(months.at(-1)!).end;
  const sql = getDb();

  const [settings, memberRows, expenseRows, billRows] = await Promise.all([
    getSettings(),
    sql`
      SELECT id, joined_on, left_on FROM members
      WHERE joined_on <= ${last}::date AND (left_on IS NULL OR left_on >= ${first}::date)
    ` as Promise<Row[]>,
    sql`
      SELECT to_char(purchased_at AT TIME ZONE 'Europe/Rome', 'YYYY-MM') AS month,
             COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE (purchased_at AT TIME ZONE 'Europe/Rome')::date BETWEEN ${first}::date AND ${last}::date
      GROUP BY 1
    ` as Promise<Row[]>,
    sql`
      SELECT b.id, b.type, b.bill_start, b.bill_end, b.amount, b.paid_by,
             m.name AS payer_name, b.notes, b.created_at
      FROM utility_bills b
      LEFT JOIN members m ON m.id = b.paid_by
      WHERE b.bill_start <= ${last}::date AND b.bill_end >= ${first}::date
    ` as Promise<Row[]>,
  ]);

  const expenseMap = new Map(expenseRows.map((row) => [text(row.month), num(row.total)]));
  const bills = billRows.map(utilityFromRow);

  return months.map((month) => {
    const { start, end } = monthBounds(month);
    const participants = memberRows.filter((row) => {
      const joined = text(row.joined_on);
      const left = nullableText(row.left_on);
      return joined <= end && (!left || left >= start);
    }).length;
    const groceries = round(expenseMap.get(month) ?? 0);
    const utilities = round(bills.reduce((sum, bill) => sum + allocatedBillAmount(bill, month), 0));
    const rent = round(participants * settings.rentPerPerson);
    return {
      month,
      label: shortMonthLabel(month),
      rent,
      groceries,
      utilities,
      total: round(rent + groceries + utilities),
    };
  });
}

export async function getHistory(throughMonth: string, count = 12) {
  const trend = await getTrend(throughMonth, count);
  return [...trend].reverse();
}
