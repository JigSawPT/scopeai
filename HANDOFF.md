# ScopeAI — Handoff Completo (2026-08-11)

Documento de transferência de contexto. Todo o trabalho de 2026-08-10/11 está resumido aqui com links, números e estado verificado.

---

## 1. O Projeto

**ScopeAI** — inteligência competitiva autónoma para pequenas empresas e agências. 3 agentes Gemini 2.5 Flash (Investigator → Analyst → Writer) com Google Search grounding, pipeline de ~3 min, relatório citado, telemetria ao vivo, Stripe para pagamento.

- **Competição:** Build with Gemini XPRIZE — categoria Small Business Services
- **Prazo:** 17 de agosto de 2026, 13:00 PDT
- **Produção:** https://scopeai-746706977308.us-central1.run.app
- **Demo (corre o pipeline real):** https://scopeai-746706977308.us-central1.run.app/demo
- **Repo (público):** https://github.com/JigSawPT/scopeai
- **Vídeo self-hosted:** https://scopeai-video-746706977308.us-central1.run.app

## 2. Estado da Submissão (checklist em `xprize_submission_checklist.md`)

| Item | Estado |
|---|---|
| Repo partilhado com juízes | COMPLETE — repo público (verificado via API) |
| Vídeo 3 min | PARTIAL — MP4 pronto (15MB), falta upload YouTube (~3 min) |
| Narrativa escrita | COMPLETE — `xprize_narrative.md` |
| Evidência financeira | PARTIAL — P&L real em `xprize_pnl_template.csv`, falta anexar export Stripe |
| Fatura GCP | PENDING — export de 1 clique no console |
| Produto/telemetria | VERIFIED LIVE — E2E re-verificado 11/08 |
| Evidência de clientes | PENDING — 0 clientes, 0 respostas ao outreach |

## 3. Código — Alterações Feitas e Deployed (revisões 00010-00012)

**Segurança:**
- `src/lib/agents/types.ts` — `access_token` adicionado a OrderRequest
- `src/app/api/logs/route.ts` — relatórios novos exigem token privado (401 sem, 404 errado); relatórios antigos (pré-token) mantêm acesso público
- `src/app/api/webhook/route.ts` — guarda de idempotência (retries do Stripe não duplicam pipeline)

**Anti-abuso de custos:**
- `src/app/api/analyze/route.ts` — demo bloqueada a 3 cenários fixos (`demo_id`), cooldown 15 min por IP

**Validação de input:**
- `src/app/api/checkout/route.ts` — campos obrigatórios, email válido, limites de concorrentes por tier (1/3/5), token no success_url

**Honestidade comercial (removidas promessas falsas: PDF, email, 24h, monitorização trimestral, CSV, refund garantido, links Termos/Privacidade):**
- `src/app/page.tsx`, `src/app/order/page.tsx`, `src/app/layout.tsx`, `src/lib/stripe.ts`, `src/app/report/[id]/page.tsx`

**Prova de output:**
- `src/app/page.tsx` — secção "See Real Generated Output" com 3 relatórios reais (HubSpot 63 fontes, Shopify 49, Notion 44)

**Verificado em produção:**
- Pipeline demo completo: ~150s, 42 fontes ✓
- Token: sem token → 401, token errado → 404 (ordens novas) ✓
- Legacy: 3 relatórios de amostra acessíveis ✓
- Checkout: sessão Stripe criada com token na URL (custo $0) ✓
- Cold start com scale-to-zero: 0.7s ✓
- `tsc`, `lint` (0 erros), `build` ✓

## 4. Custo Real (nunca tocou no cartão)

- Conta de faturação: `010CD1-58E5B1-15E14C` (moeda EUR, nome "Minha conta de faturamento")
- Projeto: `digital-proton-422716-p4`
- **€150 de oferta Google** — cobre todos os custos; o cartão só seria contactado se excedesse
- Gasto lifetime: **~$2.70** ($1.74 taxa Stripe do teste reembolsado + ~$1 Cloud Run)
- **`min-instance = 0` aplicado (revisão 00012)** — Cloud Run escala a zero quando parado; custo fixo de ~$75/mês eliminado
- Tentativa de alerta de orçamento €10: bloqueado por permissões (fazer no console se quiser: https://console.cloud.google.com/billing/010CD1-58E5B1-15E14C/budgets)

## 5. Outreach (verificado em inbox 11/08)

**9 mensagens diretas enviadas e confirmadas (0 respostas):**
Katelyn Bourgoin, Andrea Nwachukwu (Kalungi), Peep Laja, James Hawkins (PostHog), Zeh Fernandes (Resend), Chris Frantz (Loops), Raquel Reis (Octoboard), Steven Tey (Dub), Jen Spencer (Booth)

**7 pedidos de ligação pendentes (lote 1):** Foundation, Single Grain, Bay Leaf, Hey Digital, KyLeads, WooRank, Linear

**Verificação de identidade:** 20+ outros candidatos rejeitados automaticamente — 9 perfis 404, 4 pessoas erradas com o mesmo nome, 3 cargos mudados. **Nenhuma mensagem enviada a pessoa errada. Nenhum testemunho inventado.**

**Limitação:** LinkedIn bloqueia a automação de mensagens após ~2-3 envios (editor não renderiza). Follow-ups devem ser enviados manualmente.

## 6. Ficheiros-Chave

| Ficheiro | Para quê |
|---|---|
| `youtube_upload_ready.md` | Metadados do vídeo prontos a colar (upload ~3 min) |
| `linkedin_followups.md` | 9 mensagens de follow-up prontas a enviar (~10 min) |
| `SUBMISSION.md` | Campos Devpost prontos a copiar |
| `xprize_submission_checklist.md` | Estado oficial da submissão |
| `xprize_pnl_template.csv` | P&L real (lifetime $2.70) |
| `xprize_narrative.md` | Narrativa 500-1000 palavras, números medidos |
| `marketing_content.md` | 7 posts prontos (Reddit, IH, LinkedIn, HN, X) |
| `community-research-report.md` | Pesquisa de canais com prioridades |
| `customer_outreach.md` | Templates honestos de mensagens (revistos) |
| `sample_reports.json` | Metadados dos 5 relatórios de amostra |
| `prospects_50.json` / `ci_prospects_50.json` | Listas de prospects — **desatualizadas, revalidar antes de usar** |
| `scripts/linkedin-batch2.mjs`, `linkedin-batch3.mjs` | Automação com verificação de identidade (reutilizável) |

## 7. Ações do Dono (só humano, ~20 min total)

1. **Upload YouTube** (3 min): `videos\scopeai-xprize-demo\renders\scopeai-xprize-demo_2026-08-10_12-03-10.mp4` → metadados em `youtube_upload_ready.md`
2. **PDF fatura GCP** (1 clique): https://console.cloud.google.com/billing/010CD1-58E5B1-15E14C/documents?project=digital-proton-422716-p4
3. **9 follow-ups LinkedIn** (10 min): `linkedin_followups.md` — maior probabilidade de gerar resposta
4. **Submeter Devpost** antes de 17/08 13:00 PDT: campos em `SUBMISSION.md`

## 8. Recomendação Estratégica

- **Submeter à mesma** — custo $0, 20 min; o prémio é o retorno real (receita até dia 17 é improvável e não é gate)
- **Proposta de conversão:** "brief gratuito sobre os concorrentes do próprio lead" — o relatório é a demo e o argumento de venda (exigiria ~$3-5 de API, autorização pendente)
- **HN/Product Hunt:** viáveis e gratuitos, exigem contas tuas; o post de HN já está escrito (`marketing_content.md`); ajustar cooldown da demo durante o lançamento
- **Integridade mantida:** sem testemunhos falsos, sem P&L inventado, sem relatórios fabricados — números todos medidos do sistema vivo

## 9. Notas de Risco

- `prospects_50.json` tem URLs mortas/pessoas erradas — revalidar sempre antes de enviar
- Relatório de amostra do Calendly tem 0 fontes — NÃO usar em marketing
- Relatórios antigos (pré-token) são públicos por design — conteúdo é informação pública de empresas conhecidas
- Pós-competição: rolar chaves Stripe e apagar `GEMINI_API_KEY` do ambiente
