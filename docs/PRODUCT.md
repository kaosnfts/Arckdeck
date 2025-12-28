# ArcDeck PixFlow — Documentação do Produto

## Visão geral

**ArcDeck PixFlow** é uma demo de fluxo de **cobrança usando Pix (simulado)** com **recibo público verificável onchain**, pensada para testes, conciliação por eventos e apresentações técnicas.

> Importante: isto **não** processa Pix real e não oferece serviços financeiros. É uma simulação para testnet.

## O que você consegue demonstrar

- **Criação de cobrança (invoice)** com valor e referência opcional.
- **Pagamento sandbox** (simulado) usando token **aBRL** (ERC-20 de teste).
- **Recibo público** via rota `/r/:invoiceId`, com status e timestamps verificáveis.
- **Conciliação por eventos** (InvoiceCreated, InvoicePaid, SplitPaid) para auditoria e export.

## Arquitetura (alto nível)

- **Aplicação web** (React + TypeScript) conectada via carteira EVM (EIP-1193).
- **ArcDeckBRL (aBRL)**: ERC-20 de teste com `decimals=2` (centavos).
- **ArcDeckInvoices**: registro de invoices, pagamento sandbox, split e eventos.

## Convenções

- aBRL: `decimals=2`  
  - `1000` = `R$ 10,00`
- Gas: **USDC** (token nativo da Arc Testnet)

## Fluxo recomendado (demo)

1. Conectar carteira e trocar para **Arc Testnet**
2. Garantir **USDC de testnet** para gas
3. Mint de **aBRL** (token de teste)
4. `approve` para o contrato de invoices
5. Criar cobrança e obter `invoiceId`
6. Pagar via sandbox e compartilhar:
   - link do **explorer** da transação
   - link do **recibo público** `/r/:invoiceId`
