//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { deployNftDiamond } from "../deploy";
import { ethers } from "hardhat";
import { mumbaiFakeGotchisCardDiamondAddress } from "../../helperFunctions";

export async function deployDiamonds() {
  const fakeGotchisCardDiamond = mumbaiFakeGotchisCardDiamondAddress;
  const fakeGotchisNftDiamond = await deployNftDiamond(fakeGotchisCardDiamond);

  const fakeGotchiCardFacet = await ethers.getContractAt(
    "FakeGotchisCardFacet",
    fakeGotchisCardDiamond
  );
  await (
    await fakeGotchiCardFacet.setFakeGotchisNftAddress(fakeGotchisNftDiamond)
  ).wait();

  return { fakeGotchisCardDiamond, fakeGotchisNftDiamond };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamonds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
