import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jwtVerify } from "https://deno.land/x/jose@v4.14.4/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("JWT_SECRET") || "your-fallback-secret-key";

serve(async (req) => {
  try {
    // We expect this to be a GET request with a ?token=... query parameter
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    // Verify token
    const secret = new TextEncoder().encode(JWT_SECRET);
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, secret);
      payload = verifiedPayload;
    } catch (err) {
      return new Response("Invalid or expired token. Please ask the user to request access again.", { status: 401 });
    }

    const { userId, email } = payload as { userId: string; email: string };

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    // Update the profile status to 'admin' using the service role key to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error } = await supabase
      .from("profiles")
      .update({ status: "admin" })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    // Return a success HTML page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Access Approved</title>
        <style>
          body { font-family: sans-serif; background: #080C14; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { text-align: center; padding: 2rem; border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.15); box-shadow: 0 0 20px rgba(0, 212, 255, 0.1); }
          h1 { color: #00D4FF; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Access Approved</h1>
          <p>User <strong>${email}</strong> has been successfully approved.</p>
          <p>They can now log in to the IEEE Attend admin portal.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
