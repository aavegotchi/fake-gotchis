import { HardhatEthersHelpers } from "hardhat/types";

export interface Constants {
  aavegotchiDiamond: string;
  realmDiamond: string;
  installationDiamond: string;
  tileDiamond: string;
  ghstAddress: string;
  fakeGotchiCards: string;
  fakeGotchiArt: string;
}

interface NetworkToConstants {
  [network: number]: Constants;
}

export interface Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

function varsByChainId(chainId: number) {
  if ([137, 80001].includes(chainId)) return networkToVars[chainId];
  else return networkToVars[137];
}

export async function varsForNetwork(ethers: HardhatEthersHelpers) {
  return varsByChainId((await ethers.provider.getNetwork()).chainId);
}

export const maticVars: Constants = {
  aavegotchiDiamond: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  realmDiamond: "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11",
  installationDiamond: "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A",
  tileDiamond: "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355",
  ghstAddress: "",
  fakeGotchiCards: "",
  fakeGotchiArt: "",
};

const mumbaiVars: Constants = {
  aavegotchiDiamond: "0x14B55C7862023c9f2aEfCA1EB5a606465dA034B0",
  realmDiamond: "0x726F201A9aB38cD56D60ee392165F1434C4F193D",
  installationDiamond: "0x663aeA831087487d2944ce44836F419A35Ee005A",
  tileDiamond: "0xDd8947D7F6705136e5A12971231D134E80DFC15d",
  ghstAddress: "0x20d0A1ce31f8e8A77b291f25c5fbED007Adde932",
  fakeGotchiCards: "0x9E282FE4a0be6A0C4B9f7d9fEF10547da35c52EA",
  fakeGotchiArt: "0x330088c3372f4F78cF023DF16E1e1564109191dc",
};

const networkToVars: NetworkToConstants = {
  137: maticVars,
  80001: mumbaiVars,
  100: maticVars, //update
};

export const gasPrice = 75000000000;

export const aavegotchiDAOAddress =
  "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";
export const pixelcraftAddress = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";

export const proxyAdminAddress = "0xB549125b4A2F3c1B4319b798EcDC72b04315dF2D";

export const ecosystemVesting = "0x7e07313B4FF259743C0c84eA3d5e741D2b0d07c3";
export const gameplayVesting = "0x3fB6C2A83d2FfFe94e0b912b612fB100047cc176";

export const DOMAIN_TYPES = [
  {
    name: "name",
    type: "string",
  },
  {
    name: "version",
    type: "string",
  },
  {
    name: "chainId",
    type: "uint256",
  },
  {
    name: "verifyingContract",
    type: "address",
  },
];

export const PERMIT_TYPES = {
  //EIP712Domain: DOMAIN_TYPES,
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};
