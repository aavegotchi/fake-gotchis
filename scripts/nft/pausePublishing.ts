import { ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { MetadataFacet } from "../../typechain-types";
import { diamondOwner, gasPrice } from "../helperFunctions";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function pausePublishing() {
  const c = await varsForNetwork(ethers);

  const owner = await diamondOwner(c.fakeGotchiArt, ethers);

  console.log("owner:", owner);

  let cardFacet = (await ethers.getContractAt(
    "MetadataFacet",
    c.fakeGotchiArt,
    new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0")
  )) as MetadataFacet;

  const tx = await cardFacet.togglePublishingPaused(false, {
    gasPrice: gasPrice,
  });
  await tx.wait();
  console.log("publishing adjusted: ", tx.hash);
}

if (require.main === module) {
  pausePublishing()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
