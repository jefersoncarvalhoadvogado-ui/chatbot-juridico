import { NextRequest } from "next/server";
import { processarMensagem } from "@/lib/gemini";
import { enviarMensagem } from "@/lib/whatsapp";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("BODY RECEBIDO:", JSON.stringify(body));
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  console.log("MESSAGE:", JSON.stringify(message));

  if (!message || message.type !== "text") {
    console.log("FILTRADO - tipo:", message?.type);
    return Response.json({ ok: true });
  }

  const telefone = message.from;
  const texto = message.text.body;
  console.log("PROCESSANDO:", telefone, texto);

  try {
    const { resposta, leadData } = await processarMensagem(telefone, texto);
    console.log("RESPOSTA CLAUDE:", resposta);
    await enviarMensagem(telefone, resposta);
    console.log("MENSAGEM ENVIADA");
  } catch (error) {
    console.error("ERRO:", error);
  }

  return Response.json({ ok: true });
}
