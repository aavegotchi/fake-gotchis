import { Contract } from "@ethersproject/contracts";
import { OwnershipFacet } from "../typechain-types";

export const gasPrice = 80000000000;

export async function impersonate(
  address: string,
  contract: any,
  ethers: any,
  network: any
) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  let signer = await ethers.getSigner(address);
  contract = contract.connect(signer);
  return contract;
}

export async function resetChain(hre: any) {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.MATIC_URL,
        },
      },
    ],
  });
}

export function getSelectors(contract: Contract) {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = signatures.reduce((acc: string[], val: string) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  return selectors;
}

export function getSighashes(selectors: string[], ethers: any): string[] {
  if (selectors.length === 0) return [];
  const sighashes: string[] = [];
  selectors.forEach((selector) => {
    if (selector !== "") sighashes.push(getSelector(selector, ethers));
  });
  return sighashes;
}

export function getSelector(func: string, ethers: any) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

export const maticAavegotchiDiamondAddress =
  "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

export const mumbaiFakeGotchisNFTDiamondAddress =
  "0xBB7A12066dBE611C0F8e8BD1e80f1d6ffD1F4D21";
export const mumbaiFakeGotchisCardDiamondAddress =
  "0x118c19F39a4Ad9032B7b7b228A2Cd927d3FddA13";
export const mumbaiFakeGotchisUpgraderAddress =
  "0x94cb5C277FCC64C274Bd30847f0821077B231022";

export const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

export async function diamondOwner(address: string, ethers: any) {
  return await (await ethers.getContractAt("OwnershipFacet", address)).owner();
}
