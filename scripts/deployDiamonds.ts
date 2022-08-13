//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { deployCardDiamond } from "./card/deploy";
import { deployNftDiamond } from "./nft/deploy";
import { ethers } from "hardhat";

export async function deployDiamonds() {
  const cardDiamond = await deployCardDiamond();
  const nftDiamond = await deployNftDiamond(cardDiamond);

  const fakeGotchiCardFacet = await ethers.getContractAt(
    "FakeGotchiCardFacet",
    cardDiamond
  );
  await (await fakeGotchiCardFacet.setNftAddress(nftDiamond)).wait();

  return { cardDiamond, nftDiamond };
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
