# Plano: variações, checkout completo, status do pedido, Stripe e cupons

Você escolheu **Stripe real** e **pedidos em banco real**, então vou ativar o Lovable Cloud (backend) e a integração de pagamentos Stripe. Os cupons não foram especificados — usarei um conjunto padrão (editável depois):

- `BEMVINDO10` — 10% de desconto no subtotal
- `FRETEGRATIS` — zera o frete
- `VERAO50` — R$ 50 de desconto (pedidos acima de R$ 200)

## 1. Backend (Lovable Cloud)
- Ativar Cloud.
- Tabela `orders`: número do pedido (público, ex. `FSH-XXXXXX`), itens (jsonb), subtotal, desconto, frete, total, cupom, dados de endereço, status (`pending` → `paid` → `enviado` → `entregue`), `stripe_session_id`, timestamps.
- Tabela `coupons`: código, tipo (percent/fixed/free_shipping), valor, mínimo, ativo.
- RLS: leitura pública apenas por `order_number` (consulta de status sem login); escrita via server functions/webhook com service role.
- GRANTs adequados (anon SELECT restrito, service_role full).

## 2. Variações de produto (tamanho / cor)
- Estender `src/lib/products.ts` com `sizes` e `colors` por produto.
- Na grade de produtos: seletor de tamanho/cor antes de "Adicionar". Sem seleção obrigatória → bloqueia com feedback.
- `CartItem` passa a ter `size`/`color`; chave do item no carrinho considera variação (mesmo produto, variações diferentes = linhas separadas). Persistência no localStorage mantida.
- CartDrawer e checkout exibem a variação escolhida.

## 3. Checkout — endereço, CEP, máscaras, validação inline
- Formulário completo: nome, e-mail, CEP, rua, número, complemento, bairro, cidade, UF.
- Máscaras (CEP `00000-000`, telefone) e validação Zod com mensagens inline por campo.
- Autopreenchimento por CEP via ViaCEP; erro inline se CEP inválido.
- Bloqueia avanço ao pagamento enquanto houver erros.

## 4. Cupom
- Campo de cupom no resumo; valida contra a tabela `coupons` (server function).
- Recalcula subtotal, desconto, frete e total em tempo real; feedback de cupom inválido/expirado.

## 5. Pagamento Stripe
- Ativar pagamentos Stripe (Lovable-managed).
- Criar produto/checkout dinâmico pelo total final (itens + frete − desconto).
- Server function cria a sessão de checkout; cria o pedido como `pending`.
- Webhook confirma pagamento → marca pedido `paid` → tela de confirmação com número do pedido e PDF.

## 6. Página de status do pedido
- Rota `/pedido` (e `/pedido/$numero`): campo para digitar o número e consultar.
- Mostra itens (com variação), subtotal, desconto, frete, total e linha do tempo de andamento (Pago → Em separação → Enviado → Entregue).
- Leitura pública por número do pedido.

## Notas técnicas
- Pagamentos exigem plano **Pro**. Se a ativação do Stripe falhar por plano, faço o restante (variações, validação, cupom, status, pedidos no banco) e deixo o pagamento pronto para plugar.
- Server functions (`createServerFn`) para criar pedido, validar cupom e criar sessão Stripe; webhook em `src/routes/api/public/` para confirmação.
- `cart-pdf.ts` atualizado para incluir variações, desconto e número do pedido.

Posso começar pela ativação do Cloud e do Stripe e seguir a ordem acima.