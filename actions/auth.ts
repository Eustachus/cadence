"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";

export async function loginAction(values: {
  email: string;
  password: string;
}) {
  const validated = loginSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid fields" };
  }

  const { email, password } = validated.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Check if this is a NextAuth redirect (which is expected)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    // Re-throw other errors (including NEXT_REDIRECT)
    throw error;
  }
}

export async function registerAction(values: {
  name: string;
  email: string;
  password: string;
}) {
  const validated = registerSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid fields" };
  }

  const { name, email, password } = validated.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Email already in use" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "Something went wrong" };
    }
    throw error;
  }
}

export async function oauthSignInAction(provider: "google" | "github") {
  try {
    await signIn(provider, { redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: `Failed to sign in with ${provider}` };
    }
    throw error;
  }
}
