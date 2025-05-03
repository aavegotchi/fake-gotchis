import { ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { MetadataFacet } from "../../typechain-types";
import { diamondOwner } from "../helperFunctions";

export async function pausePublishing() {
  const c = await varsForNetwork(ethers);

  const owner = await diamondOwner(c.fakeGotchiArt, ethers);

  console.log("owner:", owner);

  let cardFacet = (await ethers.getContractAt(
    "MetadataFacet",
    c.fakeGotchiArt,
    await (
      await ethers.getSigners()
    )[0]
  )) as MetadataFacet;

  const paused = await cardFacet.togglePublishingPaused();
  console.log("publishing paused:", paused);
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
