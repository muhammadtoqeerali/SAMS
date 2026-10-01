"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, isAuthenticated, passwordMatches } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getMonthSnapshot } from "@/lib/data";

export type ActionState = { ok: boolean; message: string };

const money = z.coerce.number().positive().max(1_000_000);
const optionalText = z.string().trim().max(1000).optional().transform((v) => v || null);

async function authorized() {
  if (!(await isAuthenticated())) throw new Error("Your session has expired. Please log in again.");
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/utilities");
  revalidatePath("/members");
  revalidatePath("/history");
  revalidatePath("/settings");
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const password = z.string().min(1).max(200).parse(formData.get("password"));
    if (!passwordMatches(password)) return { ok: false, message: "That apartment password is not correct." };
    await createSession();
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to sign in." };
  }
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createMemberAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await authorized();
    const values = z.object({
      name: z.string().trim().min(2).max(100),
      nationality: z.string().trim().min(2).max(80),
      phone: z.string().trim().min(3).max(40),
      joinedOn: z.string().date(),
    }).parse({
      name: formData.get("name"),
      nationality: formData.get("nationality"),
      phone: formData.get("phone"),
      joinedOn: formData.get("joinedOn"),
    });
    const sql = getDb();
    await sql`
      INSERT INTO members (id, name, nationality, phone, joined_on)
      VALUES (${randomUUID()}::uuid, ${values.name}, ${values.nationality}, ${values.phone}, ${values.joinedOn}::date)
    `;
    revalidateAll();
    return { ok: true, message: `${values.name} has been added to the apartment.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not add resident." };
  }
}

export async function setMemberStatusAction(formData: FormData) {
  await authorized();
  const values = z.object({
    id: z.string().uuid(),
    mode: z.enum(["archive", "reactivate"]),
    date: z.string().date().optional(),
  }).parse({
    id: formData.get("id"),
    mode: formData.get("mode"),
    date: formData.get("date") || undefined,
  });
  const sql = getDb();
  if (values.mode === "archive") {
    const date = values.date ?? new Date().toISOString().slice(0, 10);
    await sql`UPDATE members SET left_on = ${date}::date WHERE id = ${values.id}::uuid`;
  } else {
    await sql`UPDATE members SET left_on = NULL WHERE id = ${values.id}::uuid`;
  }
  revalidateAll();
}

export async function createExpenseAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await authorized();
    const values = z.object({
      paidBy: z.string().uuid(),
      title: z.string().trim().min(2).max(140),
      description: optionalText,
      category: z.enum(["GROCERY", "HOUSEHOLD", "OTHER"]),
      amount: money,
    }).parse({
      paidBy: formData.get("paidBy"),
      title: formData.get("title"),
      description: formData.get("description")?.toString(),
      category: formData.get("category"),
      amount: formData.get("amount"),
    });
    const sql = getDb();
    await sql`
      INSERT INTO expenses (id, paid_by, title, description, category, amount, purchased_at)
      VALUES (${randomUUID()}::uuid, ${values.paidBy}::uuid, ${values.title}, ${values.description},
              ${values.category}, ${values.amount}, now())
    `;
    revalidateAll();
    return { ok: true, message: "Expense added. Date and time were saved automatically." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not add expense." };
  }
}

export async function deleteExpenseAction(formData: FormData) {
  await authorized();
  const id = z.string().uuid().parse(formData.get("id"));
  const sql = getDb();
  await sql`DELETE FROM expenses WHERE id = ${id}::uuid`;
  revalidateAll();
}

export async function createUtilityAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await authorized();
    const rawPayer = formData.get("paidBy")?.toString() || "";
    const values = z.object({
      type: z.enum(["ELECTRICITY", "WATER"]),
      billStart: z.string().date(),
      billEnd: z.string().date(),
      amount: money,
      paidBy: z.string().uuid().nullable(),
      notes: optionalText,
    }).refine((v) => v.billEnd >= v.billStart, {
      message: "Bill end date must be on or after the start date.",
    }).parse({
      type: formData.get("type"),
      billStart: formData.get("billStart"),
      billEnd: formData.get("billEnd"),
      amount: formData.get("amount"),
      paidBy: rawPayer || null,
      notes: formData.get("notes")?.toString(),
    });
    const sql = getDb();
    await sql`
      INSERT INTO utility_bills (id, type, bill_start, bill_end, amount, paid_by, notes)
      VALUES (${randomUUID()}::uuid, ${values.type}, ${values.billStart}::date, ${values.billEnd}::date,
              ${values.amount}, ${values.paidBy}::uuid, ${values.notes})
    `;
    revalidateAll();
    return { ok: true, message: "Utility bill saved and ready for monthly proration." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not add utility bill." };
  }
}

export async function deleteUtilityAction(formData: FormData) {
  await authorized();
  const id = z.string().uuid().parse(formData.get("id"));
  const sql = getDb();
  await sql`DELETE FROM utility_bills WHERE id = ${id}::uuid`;
  revalidateAll();
}

export async function setUtilitySharePaymentAction(formData: FormData) {
  await authorized();
  const values = z.object({
    billId: z.string().uuid(),
    memberId: z.string().uuid(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    mode: z.enum(["paid", "unpaid"]),
  }).parse({
    billId: formData.get("billId"),
    memberId: formData.get("memberId"),
    month: formData.get("month"),
    mode: formData.get("mode"),
  });

  const sql = getDb();
  if (values.mode === "unpaid") {
    await sql`
      DELETE FROM utility_payments
      WHERE utility_bill_id = ${values.billId}::uuid
        AND member_id = ${values.memberId}::uuid
        AND month = ${values.month}
    `;
    revalidateAll();
    return;
  }

  const snapshot = await getMonthSnapshot(values.month);
  const bill = snapshot.bills.find((item) => item.id === values.billId);
  const share = bill?.shares.find((item) => item.memberId === values.memberId);
  if (!bill || !share) throw new Error("This utility share is not part of the selected month.");

  await sql`
    INSERT INTO utility_payments (id, utility_bill_id, member_id, month, amount, paid_at)
    VALUES (${randomUUID()}::uuid, ${values.billId}::uuid, ${values.memberId}::uuid,
            ${values.month}, ${share.share}, now())
    ON CONFLICT (utility_bill_id, member_id, month)
    DO UPDATE SET amount = EXCLUDED.amount, paid_at = now()
  `;
  revalidateAll();
}

export async function updateSettingsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await authorized();
    const values = z.object({
      householdName: z.string().trim().min(2).max(120),
      rentPerPerson: z.coerce.number().nonnegative().max(100_000),
    }).parse({
      householdName: formData.get("householdName"),
      rentPerPerson: formData.get("rentPerPerson"),
    });
    const sql = getDb();
    await sql`
      UPDATE household_settings
      SET household_name = ${values.householdName}, rent_per_person = ${values.rentPerPerson}, updated_at = now()
      WHERE id = 1
    `;
    revalidateAll();
    return { ok: true, message: "Apartment settings updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save settings." };
  }
}
