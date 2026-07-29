import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL");
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("JWT_SECRET") || "your-fallback-secret-key";

serve(async (req) => {
  try {
    const { record } = await req.json();
    
    if (!record || !record.id || !record.email) {
      return new Response("Invalid payload", { status: 400 });
    }

    if (record.status !== "pending") {
      return new Response("User is not pending", { status: 200 });
    }

    // Generate a time-limited token (48 hours)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ userId: record.id, email: record.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("48h")
      .sign(secret);

    // Build the approval link using the known project URL
    const approveLink = `https://kvebuwivvbfzxrnyirbp.supabase.co/functions/v1/approve-access?token=${token}`;

    if (!RESEND_API_KEY || !OWNER_EMAIL) {
      console.log("Missing RESEND_API_KEY or OWNER_EMAIL. Fallback: log link.");
      console.log("Approval Link:", approveLink);
      return new Response(JSON.stringify({ message: "Simulated email sent", approveLink }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send email using Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "IEEE Attend <onboarding@resend.dev>",
        to: [OWNER_EMAIL],
        subject: "New Access Request - IEEE Attend",
        html: `
          <h2>New Access Request</h2>
          <p>User <strong>${record.email}</strong> has requested access to the IEEE Attend platform.</p>
          <p>Click the link below to approve this request (valid for 48 hours):</p>
          <a href="${approveLink}" style="display:inline-block;padding:10px 20px;background:#00D4FF;color:#080C14;text-decoration:none;border-radius:5px;font-weight:bold;">Approve Access</a>
        `,
      }),
    });

    if (res.ok) {
      return new Response(JSON.stringify({ message: "Email sent" }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const err = await res.text();
      throw new Error(`Resend API error: ${err}`);
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
