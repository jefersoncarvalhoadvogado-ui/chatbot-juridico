import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `Você é o assistente virtual do escritório Jeferson Carvalho Advocacia,
especializado em Direito Previdenciário na Bahia.

OBJETIVO: Qualificar o lead em até 6 mensagens coletando:
1. Nome completo
2. Tipo de problema: aposentadoria / BPC / auxílio-doença / pensão por morte / outro
3. Situação: nunca requereu / foi negado / está em análise / quer revisar benefício
4. Já tem advogado? (sim/não)
5. Cidade

REGRAS:
- Uma pergunta por mensagem
- Seja acolhedor e direto
- Nunca diga se a pessoa tem ou não tem direito a benefício
- Se o assunto não for previdenciário, diga que o escritório é especializado
- Ao finalizar, diga que um advogado entrará em contato em até 24h

QUANDO TIVER TODOS OS DADOS, adicione ao final da resposta:
[LEAD:{"nome":"...","tipo":"...","situacao":"...","advogado":"...","cidade":"..."}]`;

const historicos = new Map<string, any[]>();

export async function processarMensagem(telefone: string, mensagem: string) {
  const model = genAI.getGenerativeModel({
    model:gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const historico = historicos.get(telefone) || [];
  const chat = model.startChat({ history: historico });
  const result = await chat.sendMessage(mensagem);
  const resposta = result.response.text();

  historicos.set(telefone, [
    ...historico,
    { role: "user", parts: [{ text: mensagem }] },
    { role: "model", parts: [{ text: resposta }] },
  ]);

  const leadMatch = resposta.match(/\[LEAD:(.*?)\]/);
  let leadData = null;
  if (leadMatch) {
    try {
      leadData = JSON.parse(leadMatch[1]);
    } catch {}
  }

  return { resposta: resposta.replace(/\[LEAD:.*?\]/g, "").trim(), leadData };
}
