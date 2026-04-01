import { createClient } from "@supabase/supabase-js";

import { readEnvValue, requireEnvValue } from "./env";

type AuthUser = {
  id: string;
  email?: string;
};

const supabaseUrl = requireEnvValue("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceRoleKey =
  readEnvValue("SUPABASE_SERVICE_ROLE_KEY") ??
  requireEnvValue("SUPABASE_SERVICE_KEY");

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function findAuthUserByEmail(email: string): Promise<AuthUser | null> {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const users = data.users ?? [];
    const user = users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      return {
        id: user.id,
        email: user.email ?? undefined,
      };
    }

    if (users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function deleteAuthUserByEmail(email: string): Promise<void> {
  const user = await findAuthUserByEmail(email);

  if (!user) {
    return;
  }

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    throw error;
  }
}

export async function createConfirmedUser(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthUser> {
  await deleteAuthUserByEmail(input.email);

  const { data, error } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("Unable to create confirmed test user.");
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
}

export async function confirmAuthUserEmail(userId: string): Promise<void> {
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (error) {
    throw error;
  }
}

export async function getPublicProfileRow(userId: string): Promise<{
  id: string;
  email: string;
  full_name: string;
} | null> {
  const { data, error } = await adminClient
    .from("users")
    .select("id, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertPublicProfileRow(input: {
  id: string;
  email: string;
  fullName: string;
}): Promise<void> {
  const { error } = await adminClient.from("users").upsert(
    {
      id: input.id,
      email: input.email,
      full_name: input.fullName,
      plan: "free",
      watchlist: [],
      alerts_count: 0,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}
