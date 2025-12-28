# Deploy no Remix — Passo a passo (Arc Testnet)

## 1) Configurar a rede na carteira
Adicione a Arc Testnet:

- RPC: https://rpc.testnet.arc.network
- Chain ID: 5042002
- Moeda (gas): USDC
- Explorer: https://testnet.arcscan.app

## 2) Obter USDC de testnet (gas)
Use o faucet da Circle:
https://faucet.circle.com/

Você precisa de USDC de testnet para qualquer transação (deploy, createInvoice, etc).

## 3) Deploy do ArcDeckBRL (aBRL)
1. Abra Remix: https://remix.ethereum.org
2. Crie `ArcDeckBRL.sol` e cole o arquivo da pasta `contracts/`
3. Compile com Solidity **0.8.20**
4. Em Deploy:
   - Environment: **Injected Provider**
   - Confirme que a carteira está na Arc Testnet
5. Deploy
6. Após deploy, execute `faucetMint(200000)` para obter R$ 2.000,00 em aBRL (decimals=2)

## 4) Deploy do ArcDeckInvoices
1. Crie `ArcDeckInvoices.sol` e cole o arquivo
2. Compile 0.8.20
3. Deploy

## 5) Conectar o frontend
Cole os endereços em:
- `web/src/config/contracts.ts`

Depois, rode:
```bash
cd web
npm install
npm run dev
```

## 6) Teste no app
1. Conecte carteira
2. Confira que você está na Arc Testnet
3. Crie cobrança (createInvoice) — precisa apenas de gas
4. Para pagar no simulador:
   - Faça Mint aBRL
   - Faça Approve para o contrato de invoices
   - Pague (paySandbox)
