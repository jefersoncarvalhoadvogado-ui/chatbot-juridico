import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

const historicos = new Map<string, { role: "user" | "assistant"; content: string }[]>();

export async function processarMensagem(telefone: string, mensagem: string) {
  const historico = historicos.get(telefone) || [];

  historico.push({ role: "user", content: mensagem });

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: historico,
  });

  const resposta = response.content[0].type === "text" ? response.content[0].text : "";

  historico.push({ role: "assistant", content: resposta });
  historicos.set(telefone, historico);

  const leadMatch = resposta.match(/\[LEAD:(.*?)\]/);
  const leadData = leadMatch ? JSON.parse(leadMatch[1]) : null;

  return { resposta, leadData };
}
