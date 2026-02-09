import { ethers } from "ethers";

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
const BASE_RPC = "https://mainnet.base.org";

let _provider;
function getProvider() {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(BASE_RPC);
  }
  return _provider;
}

/**
 * Check if a wallet holds any $MOLTBUSTER tokens.
 * Returns true if token gate is disabled (no env var) or wallet has balance > 0.
 */
export async function checkTokenBalance(walletAddress) {
  const tokenAddress = process.env.MOLTBUSTER_TOKEN_ADDRESS;
  if (!tokenAddress) {
    // Token gate disabled — allow all
    return { ok: true, balance: "0", gateEnabled: false };
  }

  try {
    const provider = getProvider();
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await token.balanceOf(walletAddress);
    const ok = balance > 0n;
    return {
      ok,
      balance: ethers.formatEther(balance),
      gateEnabled: true,
    };
  } catch (err) {
    // If RPC fails, don't block registration — log and allow
    console.error("Token balance check failed:", err.message);
    return { ok: true, balance: "unknown", gateEnabled: true, error: err.message };
  }
}
