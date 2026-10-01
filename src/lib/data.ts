import "server-only";

import { getDb } from "@/lib/db";
import { monthBounds, monthsBack, overlapDays, daysInclusive } from "@/lib/month";
import { shortMonthLabel } from "@/lib/format";
import type {
  Expense,
  Member,
  MemberBalance,
  MonthSnapshot,
  Settings,
  Settlement,
  TrendPoint,
  UtilityBill,
} from "@/lib/types";

type Row = Record<string, unknown>;

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

function allocatedBillAmount(bill: UtilityBill, month: string) {
  const { start, end } = monthBounds(month);
  const overlap = overlapDays(bill.billStart, bill.billEnd, start, end);
  const totalDays = daysInclusive(bill.billStart, bill.billEnd);
  return round((bill.amount * overlap) / totalDays);
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

export async function getMonthSnapshot(month: string): Promise<MonthSnapshot> {
  const [settings, participants, expenses, rawBills] = await Promise.all([
    getSettings(),
    getParticipants(month),
    getExpensesForMonth(month),
    getBillsOverlappingMonth(month),
  ]);

  const bills = rawBills.map((bill) => ({ ...bill, allocatedAmount: allocatedBillAmount(bill, month) }));
  const people = participants.length;
  const groceryTotal = round(expenses.reduce((sum, item) => sum + item.amount, 0));
  const electricityTotal = round(
    bills.filter((bill) => bill.type === "ELECTRICITY").reduce((sum, bill) => sum + bill.allocatedAmount, 0),
  );
  const waterTotal = round(
    bills.filter((bill) => bill.type === "WATER").reduce((sum, bill) => sum + bill.allocatedAmount, 0),
  );
  const utilityTotal = round(electricityTotal + waterTotal);
  const unpaidUtilityTotal = round(
    bills.filter((bill) => !bill.paidBy).reduce((sum, bill) => sum + bill.allocatedAmount, 0),
  );
  const paidUtilityTotal = round(utilityTotal - unpaidUtilityTotal);
  const rentTotal = round(settings.rentPerPerson * people);
  const sharedTotal = round(groceryTotal + utilityTotal);
  const householdTotal = round(rentTotal + sharedTotal);

  const groceryShare = people ? groceryTotal / people : 0;
  const utilityShare = people ? utilityTotal / people : 0;
  const paidUtilityShare = people ? paidUtilityTotal / people : 0;
  const unpaidUtilityShare = people ? unpaidUtilityTotal / people : 0;

  const balances: MemberBalance[] = participants.map((member) => {
    const expenseContribution = expenses
      .filter((expense) => expense.paidBy === member.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const utilityContribution = bills
      .filter((bill) => bill.paidBy === member.id)
      .reduce((sum, bill) => sum + bill.allocatedAmount, 0);
    const paidForHouse = round(expenseContribution + utilityContribution);
    const internalShare = round(groceryShare + paidUtilityShare);
    return {
      id: member.id,
      name: member.name,
      rent: round(settings.rentPerPerson),
      groceries: round(groceryShare),
      utilities: round(utilityShare),
      unpaidUtilities: round(unpaidUtilityShare),
      paidForHouse,
      internalShare,
      netBalance: round(paidForHouse - internalShare),
      totalObligation: round(settings.rentPerPerson + groceryShare + utilityShare),
    };
  });

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
    unpaidUtilityTotal,
    rentTotal,
    sharedTotal,
    householdTotal,
    balances,
    settlements: buildSettlements(balances),
  };
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
    const utilities = round(
      bills.reduce((sum, bill) => sum + allocatedBillAmount(bill, month), 0),
    );
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
