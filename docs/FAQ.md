# FAQ — ArcDeck PixFlow

**1) Isso é Pix de verdade?**  
Não. É uma simulação em testnet para demonstrar UX, rastreabilidade e conciliação onchain.

**2) Por que o gas aparece como USDC?**  
Na Arc Testnet o token nativo (gas) é USDC. Você precisa de USDC de testnet para executar transações.

**3) Criar invoice já gasta aBRL?**  
Não. A criação apenas registra e emite evento. O gasto ocorre no pagamento sandbox (transferFrom).

**4) Por que preciso de approve?**  
Porque o contrato precisa de permissão para mover seus aBRL via `transferFrom`.

**5) Como funcionam os decimais do aBRL?**  
`decimals=2`, em centavos. Ex.: `1000` = `R$ 10,00`.

**6) O que fica registrado no contrato?**  
Criação da cobrança, status (PENDING/PAID/CANCELLED), timestamps e eventos para conciliação.

**7) Posso usar split?**  
Sim. Você define recebedores e percentuais em bps (10000 = 100%). O restante vai para o merchant.

**8) Como provar no Twitter/X?**  
Compartilhe o recibo público `/r/:invoiceId` e o link da transação no explorer.

**9) Isso está pronto para produção?**  
É uma demo. Produção exige auditoria, controles de acesso, limites, indexação e integração bancária real.
