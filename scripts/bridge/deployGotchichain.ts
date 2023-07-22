import { ethers } from "hardhat";
import { deployDiamonds } from "../deployDiamonds";

const lzEndpointAddressGotchichain =
  process.env.LZ_ENDPOINT_ADDRESS_GOTCHICHAIN;

// validate env variables

async function main() {
  const { fakeGotchisCardDiamond, fakeGotchisNftDiamond } =
    await deployDiamonds();
  await deployBridgeNft(fakeGotchisNftDiamond);
  await deployBridgeCard(fakeGotchisCardDiamond);
}

async function deployBridgeNft(nftDiamond: string) {
  if (!lzEndpointAddressGotchichain) {
    throw new Error("LZ_ENDPOINT_ADDRESS_GOTCHICHAIN env variable not set");
  }

  const minGasToStore = 50000;

  const BridgeGotchichainSide = await ethers.getContractFactory(
    "FakeGotchiBridgeGotchichainSide"
  );

  const bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
    minGasToStore,
    lzEndpointAddressGotchichain,
    nftDiamond
  );
  await bridgeGotchichainSide.deployed();

  console.log(
    "NFT BridgeGotchichainSide deployed to:",
    bridgeGotchichainSide.address
  );
  return bridgeGotchichainSide;
}

async function deployBridgeCard(cardDiamond: string) {
  if (!lzEndpointAddressGotchichain) {
    throw new Error("LZ_ENDPOINT_ADDRESS_GOTCHICHAIN env variable not set");
  }

  const BridgeGotchichainSide = await ethers.getContractFactory(
    "FakeGotchiCardBridgeGotchichainSide"
  );

  const bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
    lzEndpointAddressGotchichain,
    cardDiamond
  );
  await bridgeGotchichainSide.deployed();

  console.log(
    "Card BridgeGotchichainSide deployed to:",
    bridgeGotchichainSide.address
  );
  return bridgeGotchichainSide;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
