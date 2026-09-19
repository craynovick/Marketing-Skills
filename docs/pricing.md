# Pricing page specification

## Hero

**Open skills. Your choice of infrastructure.**

Use every marketing skill free in your own stack, or let us run the workspace for you.

**Self-host for free** · **Start Managed Cloud — $6/month + usage**

“No lock-in: skill files stay portable Markdown, and you can export your workspace anytime.”

## Community / Self-Hosted

### $0/month

The complete open-source skill repository and self-hostable catalog. Bring your own LLM keys and run it on infrastructure you control.

- Full access to every open-source skill
- Self-hostable catalog and runner
- Bring your own OpenAI, Anthropic, Gemini, or compatible provider key
- Portable Markdown skills and local exports
- Community help through GitHub Issues and Discussions

CTA: **View on GitHub**

## Managed Cloud

### $6/month + usage

The hosted workspace for teams who want the skills without managing containers, servers, upgrades, or shared context.

- Turnkey web app—nothing to deploy or maintain
- Automatic skill updates
- Shared team workspaces
- Transparent metered model usage: pass-through tokens or prepaid credits
- Priority support and early access to newly curated skills

CTA: **Start Managed Cloud**

“The $6 fee covers the managed service. Model usage is shown separately before you pay.”

## Feature comparison

| Feature | Community / Self-Hosted | Managed Cloud |
|---|---:|---:|
| Price | $0 | $6/month + usage |
| Open-source skills | Full access | Full access |
| Where it runs | Your infrastructure | Our managed cloud |
| LLM credentials | Your provider keys | Managed usage balance or optional BYOK* |
| Infrastructure and updates | You manage them | Included |
| Team workspace | Your implementation | Included |
| Support | GitHub community | Priority support |
| New curated skills | Public release schedule | Early access |
| Exportable Markdown skills | Yes | Yes |

`*` State the final BYOK policy only once it is implemented; do not promise it in checkout beforehand.

## Cost estimator

**Monthly total = $6 managed hosting + metered model usage + applicable tax.**

| Line item | Example | Amount |
|---|---|---:|
| Managed Cloud base | One workspace for a month | $6.00 |
| Model usage | 3M input + 500K output tokens at the selected model’s displayed rates | $X.XX |
| Estimated monthly total | Base + actual usage above | $6.00 + $X.XX |

Controls: provider/model, input tokens, output tokens, and prepaid credits. Show the current per-million-token rate beside the selected model, timestamp it, and label the result “estimate, excluding tax.” Never hard-code rates in marketing copy.

“Set a monthly usage cap, receive threshold alerts, and inspect token use by workspace and skill. You approve any refill or overage policy in account settings.”

## FAQ

### When am I billed?

Managed Cloud is billed monthly in advance at $6. Usage is metered through the billing period and charged in arrears, unless you choose prepaid credits. Invoices separate the hosting fee from model usage.

### What happens if I cancel?

Your workspace remains available through the current paid hosting period. You can export skills and workspace data before closure. Unused prepaid-credit treatment follows the published credit policy for your jurisdiction.

### Are my API keys private?

In Community, keys stay in your own environment. Managed Cloud uses a managed balance by default. If BYOK is offered later, keys must be encrypted at rest, never exposed to browsers or logs, and used only for your model requests. We do not train foundation models on workspace content.

### Do credits roll over?

Prepaid credits roll over while Managed Cloud remains active, subject to a displayed expiration period and applicable law. Metered postpaid usage does not create a credit balance. Show the exact expiration date at purchase and in the billing portal.

### Why is usage separate from the $6 fee?

Hosting, updates, secure workspace operations, and support have predictable costs; model calls vary by model and volume. Separating them keeps the base price low and the variable portion visible.

### Can I self-host later?

Yes. The skills are open-source Markdown files. Export the workspace, run Community, and connect your own provider keys.

## Implementation guardrails

- Create one $6 monthly Stripe price before replacing the existing $29/$79 plans; decide migration and grandfathering first.
- Store input/output token counts, provider/model, request time, workspace, and skill run in a server-side immutable usage ledger.
- Enforce spend caps before model dispatch; never rely only on after-the-fact invoices.
- Show usage rates, credit expiry, and refund policy in checkout and invoices.
- Do not claim BYOK, rollover, or pass-through pricing until contracts, billing logic, and provider adapters implement them.
