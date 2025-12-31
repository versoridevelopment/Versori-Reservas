import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Cliente ADMIN para generar links (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, clubName, clubLogo, subdomain } = await request.json();

    // 1. Validar que el usuario exista antes de generar nada (Opcional, pero recomendado)
    // Esto evita generar links para correos que no existen
    const { data: userConfig } = await supabaseAdmin
      .from("profiles")
      .select("id_usuario")
      .eq("email", email)
      .single();

    // Si querés seguridad por oscuridad (que no sepan si el mail existe), borra este if
    if (!userConfig) {
      // Retornamos success igual para no revelar usuarios, pero no enviamos mail
      return NextResponse.json({ success: true });
    }

    // 2. Generar Link de Recuperación
    // El 'redirectTo' apunta a tu página de setear nueva password
    const origin =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${origin}/auth/callback?type=recovery&sub=${
          subdomain || ""
        }`,
      },
    });

    if (error) throw error;

    const recoveryLink = data.properties?.action_link;

    if (!recoveryLink) {
      throw new Error("No se pudo generar el link de recuperación");
    }

    // 3. Preparar Logos (Fallbacks por si son nulos)
    // NOTA: Los clientes de correo bloquean imágenes locales.
    // Asegurate de que clubLogo sea una URL pública (https://...)
    const logoHtml = clubLogo
      ? `<img src="${clubLogo}" alt="${clubName}" style="max-width: 150px; height: auto; margin-bottom: 20px;" />`
      : `<h2 style="color: #333;">${clubName}</h2>`;

    // 4. Enviar Email con Resend
    await resend.emails.send({
      from: "Soporte <onboarding@resend.dev>", // Cambiar a tu dominio verificado cuando pases a producción
      to: [email],
      subject: `Restablecer contraseña - ${clubName}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;">
            
            ${logoHtml}
            
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Recuperá tu acceso</h1>
            
            <p style="color: #666; line-height: 1.5; margin-bottom: 30px;">
              Recibimos una solicitud para restablecer tu contraseña en <strong>${clubName}</strong>. 
              Hacé clic en el botón de abajo para crear una nueva.
            </p>
            
            <a href="${recoveryLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Restablecer contraseña
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Si no solicitaste este cambio, podés ignorar este correo tranquilamente. El enlace expirará pronto.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

            <div style="text-align: center;">
              <p style="color: #888; font-size: 12px; margin-bottom: 10px;">
                Gestión inteligente provista por
              </p>
              <a href="https://versori.com.ar" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                 <img src="https://grvvtnolwqoyytksaylu.supabase.co/storage/v1/object/public/branding-versori/VERSORI.png" alt="Versori" style="height: 20px; vertical-align: middle;" />
                 <span style="color: #000; font-weight: bold; font-size: 16px; vertical-align: middle;">VERSORI</span>
              </a>
            </div>

          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending recovery email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
