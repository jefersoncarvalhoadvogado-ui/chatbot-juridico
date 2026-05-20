const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

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
  const historico = historicos.get(telefone) || [];

  historico.push({ role: "user", content: mensagem });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...historico,
      ],
    }),
  });

  const data = await response.json();
  const resposta = data.choices[0].message.content;

  historico.push({ role: "assistant", content: resposta });
  historicos.set(telefone, historico);

  const leadMatch = resposta.match(/\[LEAD:(.*?)\]/);
  let leadData = null;
  if (leadMatch) {
    try {
      leadData = JSON.parse(leadMatch[1]);
    } catch {}
  }

  return { resposta: resposta.replace(/\[LEAD:.*?\]/g, "").trim(), leadData };
}
