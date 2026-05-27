"use client";

import { signOut as firebaseSignOut } from "firebase/auth";
import { signOut as nextAuthSignOut } from "next-auth/react";

import { auth } from "@/lib/firebase";

export async function signOutEverywhere() {
  await firebaseSignOut(auth);
  await nextAuthSignOut({ redirect: false });
}
