import { ethers, network } from "hardhat";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { maticVars } from "../../constants";
import { gasPrice, impersonate } from "../helperFunctions";

import { mine } from "@nomicfoundation/hardhat-network-helpers";

export async function lockDiamonds() {
  let signer;

  const testing = ["hardhat", "localhost"].includes(network.name);
  let FGCard = await ethers.getContractAt(
    "FakeGotchisCardFacet",
    maticVars.fakeGotchiCards
  );
  let FGNFT = await ethers.getContractAt(
    "FakeGotchisNFTFacet",
    maticVars.fakeGotchiArt
  );

  if (testing) {
    await mine();

    const FGcardowner = await getOwner(maticVars.fakeGotchiCards);
    FGCard = await ethers.getContractAt(
      "FakeGotchisCardFacet",
      maticVars.fakeGotchiCards
    );
    FGCard = await impersonate(FGcardowner, FGCard, ethers, network);

    const FGNFTowner = await getOwner(maticVars.fakeGotchiArt);
    FGNFT = await ethers.getContractAt(
      "FakeGotchisNFTFacet",
      maticVars.fakeGotchiArt
    );
    FGNFT = await impersonate(FGNFTowner, FGNFT, ethers, network);
  } else if (network.name === "matic") {
    //item manager - ledger
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  } else throw Error("Incorrect network selected");

  console.log("Pausing FGCard Diamond");

  let tx = await FGCard.connect(signer!).toggleDiamondPause(true, {
    gasPrice: gasPrice,
  });
  await tx.wait();
  console.log("FakeGotchis Card diamond paused at txn", tx.hash);

  console.log("Pausing FGNFT Diamond");

  tx = await FGNFT.connect(signer!).toggleDiamondPause(true, {
    gasPrice: gasPrice,
  });
  await tx.wait();
  console.log("FakeGotchis NFT diamond paused at txn", tx.hash);
  console.log("Diamonds paused");
}

async function getOwner(address: string) {
  const ownershipFacet = await ethers.getContractAt("OwnershipFacet", address);
  const owner = await ownershipFacet.owner();
  return owner;
}

if (require.main === module) {
  lockDiamonds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
