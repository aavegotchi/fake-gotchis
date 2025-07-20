import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../constants";
import { MetadataFacet } from "../../typechain-types";
import { diamondOwner, impersonate } from "../helperFunctions";

export async function mintPendingNfts() {
  const c = await varsForNetwork(ethers);

  const owner = await diamondOwner(c.fakeGotchiArt, ethers);

  console.log("owner:", owner);

  let metadataFacet = (await ethers.getContractAt(
    "MetadataFacet",
    c.fakeGotchiArt
  )) as MetadataFacet;

  const metadataCount = await metadataFacet.getMetadataIdCounter();

  const metadataCountNum = metadataCount.toNumber
    ? metadataCount.toNumber()
    : Number(metadataCount);
  const metadataIds = Array.from({ length: metadataCountNum }, (_, i) => i + 1);

  const pendingMetadata = [];

  for (const id of metadataIds) {
    console.log("id:", id);
    const data = await metadataFacet.getMetadata(id);
    //if status is 0, add to pendingMetadata
    if (data.status === 0 && data.minted === false) {
      pendingMetadata.push(id);
    }
  }

  console.log("pendingMetadata:", pendingMetadata);
  console.log("pendingMetadata.length:", pendingMetadata.length);

  const [signer] = await ethers.getSigners();
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    metadataFacet = await impersonate(owner, metadataFacet, ethers, network);
  } else {
    metadataFacet = metadataFacet.connect(signer);
  }

  for (const id of pendingMetadata) {
    console.log("id:", id);
    const tx = await metadataFacet.mint(id);
    await tx.wait();
    console.log("minted:", id);
  }
}

if (require.main === module) {
  mintPendingNfts()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
