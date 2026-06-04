export const CHAIN_ID = 1336;
export const CHAIN_NAME = "Kii Testnet Oro";
export const RPC_URL = "https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/";
export const EXPLORER_URL = "https://explorer.kiichain.io/";

export const MASTER_ROUTER_ADDRESS = "0x26DF8853e4a25Ad215D886C0052E1203F8b9dd92";

export const POOL_REGISTRY: Record<string, { tokenAddress: string; poolAddress: string }> = {
  USDC: {
    tokenAddress: "0xc9C3DaE87b18C0E4CEedeEF8e161Cd67d3bEE395",
    poolAddress: MASTER_ROUTER_ADDRESS,
  },
  USDT: {
    tokenAddress: "0xA13A30Aa918C43C463b3Ea3c3b53DDc0646510C9",
    poolAddress: MASTER_ROUTER_ADDRESS,
  },
  wBTC: {
    tokenAddress: "0x3495125a90fFD5c9301FAd2C61f637d0C317C826",
    poolAddress: MASTER_ROUTER_ADDRESS,
  },
  sKII: {
    tokenAddress: "0xc150f249A847b28f579fdA1984e81a494b9E262F",
    poolAddress: "0x234FAE5cc64b81826452A28BE0eb6aC530044C01",
  },
};
