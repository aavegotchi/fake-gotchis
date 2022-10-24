import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../constants";
import { FakeGotchisCardFacet } from "../../typechain-types";
import { diamondOwner, impersonate } from "../helperFunctions";

export async function updateURI() {
  const c = await varsForNetwork(ethers);

  const owner = await diamondOwner(c.fakeGotchiCards, ethers);

  console.log("owner:", owner);

  let cardFacet = (await ethers.getContractAt(
    "FakeGotchisCardFacet",
    c.fakeGotchiCards,
    await (
      await ethers.getSigners()
    )[0]
  )) as FakeGotchisCardFacet;

  const uri = await cardFacet.uri(0);
  console.log("uri:", uri);

  if (network.name === "hardhat") {
    cardFacet = await impersonate(owner, cardFacet, ethers, network);
  }

  //   const tx = await cardFacet.setBaseURI(
  //     "https://app.aavegotchi.com/metadata/fakecards/"
  //   );
  //   await tx.wait();

  //   const after = await cardFacet.uri(0);
  //   console.log("uri:", after);
}

if (require.main === module) {
  updateURI()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
