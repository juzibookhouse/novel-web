// src/app.d.ts
import type { Session, User } from '@supabase/supabase-js';

// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session | null;
      user: User | null;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};