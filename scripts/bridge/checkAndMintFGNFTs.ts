import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../constants";
import { MetadataFacet } from "../../typechain-types";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";

import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function mintPendingNfts() {
  const c = await varsForNetwork(ethers);
  // await mine();
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

  const pendingMetadata = [
    // 21, 363, 415, 423, 425, 462,
    478, 499, 506, 507, 508, 509, 510,
  ];

  // for (const id of metadataIds) {
  //   console.log("id:", id);
  //   const data = await metadataFacet.getMetadata(id);
  //   //if status is 0, add to pendingMetadata
  //   if (data.status === 0 && data.minted === false) {
  //     pendingMetadata.push(id);
  //   }
  // }

  console.log("pendingMetadata:", pendingMetadata);
  console.log("pendingMetadata.length:", pendingMetadata.length);

  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    metadataFacet = await impersonate(owner, metadataFacet, ethers, network);
  } else {
    metadataFacet = metadataFacet.connect(signer);
  }

  for (const id of pendingMetadata) {
    console.log("id:", id);
    const tx = await metadataFacet.mint(id, {
      gasPrice: gasPrice,
    });
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
