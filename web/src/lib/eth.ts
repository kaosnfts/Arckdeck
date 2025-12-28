import { ethers } from "ethers";
import { ARC_TESTNET } from "../config/chain";

export function hasInjectedProvider() {
  return typeof window !== "undefined" && !!(window as any).ethereum;
}

export async function connectWallet() {
  if (!hasInjectedProvider()) throw new Error("Nenhuma carteira EVM detectada (MetaMask/Rabby).");
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  return { provider, signer, address, chainId: Number(network.chainId) };
}

export async function switchToArcTestnet() {
  if (!hasInjectedProvider()) throw new Error("Nenhuma carteira EVM detectada.");
  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_TESTNET.chainIdHex }] });
  } catch (err: any) {
    if (err?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: ARC_TESTNET.chainIdHex,
          chainName: ARC_TESTNET.name,
          rpcUrls: [ARC_TESTNET.rpcUrl],
          nativeCurrency: { name: ARC_TESTNET.nativeCurrencySymbol, symbol: ARC_TESTNET.nativeCurrencySymbol, decimals: ARC_TESTNET.nativeCurrencyDecimals },
          blockExplorerUrls: [ARC_TESTNET.explorer],
        }],
      });
    } else {
      throw err;
    }
  }
}

export function formatBRLFromCents(cents: bigint) {
  const v = Number(cents);
  const reais = (v / 100).toFixed(2).replace(".", ",");
  return `R$ ${reais}`;
}

export function parseCentsFromBRL(input: string): bigint {
  const cleaned = input.trim().replace(/[R$\s]/g, "").replace(".", "").replace(",", ".");
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) throw new Error("Valor inválido.");
  return BigInt(Math.round(num * 100));
}

export function randomBytes32(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

export function refToBytes32(text: string): string {
  const t = text.trim();
  if (!t) return ethers.ZeroHash;
  return ethers.keccak256(ethers.toUtf8Bytes(t));
}

export function isZeroAddress(a: string) {
  return /^0x0{40}$/i.test(a);
}
