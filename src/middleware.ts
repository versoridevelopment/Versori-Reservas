import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Aunque no usemos la sesión para el bloqueo, es buena práctica inicializar el cliente
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  // 1. LEER NUESTRA COOKIE DE BLOQUEO
  const recoveryCookie = req.cookies.get('recovery_pending')?.value;

  // DEBUG (Opcional, podés borrarlo cuando funcione)
  if (recoveryCookie) {
     console.log(`🔒 MIDDLEWARE: Cookie detectada en ruta: ${req.nextUrl.pathname}`);
  }

  // 2. LÓGICA DE BLOQUEO SIMPLIFICADA
  // Si la cookie existe y es 'true', bloqueamos. NO esperamos a la sesión de Supabase.
  if (recoveryCookie === 'true') {
    
    // Si el usuario intenta ir a cualquier lugar que NO sea reset-password...
    if (!req.nextUrl.pathname.startsWith('/reset-password')) {
      
      console.log("   ⛔ ACCESO DENEGADO. Redirigiendo a /reset-password");
      
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/reset-password';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (rutas internas de auth)
     * - videos (carpeta publica de videos)
     * - images o sponsors (si tenés carpetas públicas de imágenes)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|videos|sponsors|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};