// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    // Usando el código, Supabase intercambia y establece la cookie de sesión
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirige al usuario a la página principal después de iniciar sesión
  return NextResponse.redirect(requestUrl.origin);
}