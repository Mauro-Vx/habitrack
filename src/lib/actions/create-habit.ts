"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { Status } from "@/app/enums";
import { CreateHabitState } from "@/app/(dashboard)/dashboard/create/types";
import { CreateHabitSchema, createHabitSchema } from "@/app/(dashboard)/dashboard/create/schema";
import { createClient } from "@/lib/supabase/server";
import { TablesInsert } from "@/lib/supabase/database.types";
import { startOfDay, endOfDay } from "date-fns";

export async function createHabit(prevState: CreateHabitState, formData: CreateHabitSchema): Promise<CreateHabitState> {
  const validation = createHabitSchema.safeParse(formData);

  const cookieStore = await cookies();
  const timezone = cookieStore.get("timezone")?.value || "Europe/Prague";

  if (!validation.success) {
    return {
      ...prevState,
      status: Status.VALIDATION_ERROR,
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const {
    date_range: { start_date, end_date },
    ...validationData
  } = validation.data;

  const habitInsertPayload: TablesInsert<"habits"> = {
    id: uuidv4(),
    user_id: user.id,
    name: validationData.name,
    description: validationData.description,
    type: validationData.type,
    target_count: validationData.target_count,
    days_of_week: validationData.days_of_week,
    start_date: startOfDay(start_date).toISOString(),
    end_date: end_date ? endOfDay(end_date).toISOString() : null,
    timezone: timezone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: dbError } = await supabase.from("habits").insert([habitInsertPayload]);

  if (dbError) {
    return {
      ...prevState,
      status: Status.DATABASE_ERROR,
      dbError: dbError,
    };
  }

  revalidatePath("/dashboard", "layout");

  // TODO: Revalidate specific cache tag (cache key) in the future

  return {
    ...prevState,
    status: Status.SUCCESS,
  };
}
