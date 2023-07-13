import { ethers } from "hardhat";

const {
  LZ_ENDPOINT_ADDRESS_MUMBAI: lzEndpointAddressMumbai,
  NFT_DIAMOND_ADDRESS_MUMBAI: nftDiamondAddressMumbai,
  CARD_DIAMOND_ADDRESS_MUMBAI: cardDiamondAddressMumbai,
} = process.env;

async function main() {
  await deployBridgeNft();
  await deployBridgeCard();
}

async function deployBridgeNft() {
  if (!lzEndpointAddressMumbai) {
    throw new Error("LZ_ENDPOINT_ADDRESS_GOTCHICHAIN env variable not set");
  }

  if (!nftDiamondAddressMumbai) {
    throw new Error("NFT_DIAMOND_ADDRESS_GOTCHICHAIN env variable not set");
  }

  const minGasToStore = 50000;

  const BridgeGotchichainSide = await ethers.getContractFactory(
    "FakeGotchiBridgeGotchichainSide"
  );

  const bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
    minGasToStore,
    lzEndpointAddressMumbai,
    nftDiamondAddressMumbai
  );
  await bridgeGotchichainSide.deployed();

  console.log(
    "NFT BridgeGotchichainSide deployed to:",
    bridgeGotchichainSide.address
  );
  return bridgeGotchichainSide;
}

async function deployBridgeCard() {
  if (!lzEndpointAddressMumbai) {
    throw new Error("LZ_ENDPOINT_ADDRESS_GOTCHICHAIN env variable not set");
  }

  if (!cardDiamondAddressMumbai) {
    throw new Error("CARD_DIAMOND_ADDRESS_GOTCHICHAIN env variable not set");
  }

  const BridgeGotchichainSide = await ethers.getContractFactory(
    "FakeGotchiCardBridgeGotchichainSide"
  );

  const bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
    lzEndpointAddressMumbai,
    cardDiamondAddressMumbai
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
