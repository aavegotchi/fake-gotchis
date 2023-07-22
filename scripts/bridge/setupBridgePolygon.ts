import { ethers } from "hardhat";

const {
  LZ_CHAIN_ID_MUMBAI: lzChainIdMumbai,
  BRIDGE_NFT_POLYGON_ADDRESS: bridgeNFTPolygonAddress,
  BRIDGE_NFT_GOTCHICHAIN_ADDRESS: bridgeNFTGotchichainAddress,
  BRIDGE_CARD_POLYGON_ADDRESS: bridgeCardPolygonAddress,
  BRIDGE_CARD_GOTCHICHAIN_ADDRESS: bridgeCardGotchichainAddress,
  NFT_DIAMOND_ADDRESS_MUMBAI: nftDiamond,
  CARD_DIAMOND_ADDRESS_MUMBAI: cardDiamond,
 } = process.env;

async function main() {
  await setupBridgeNft();
  await setupBridgeCard();
}

async function setupBridgeNft() {
  if (!bridgeNFTPolygonAddress) {
    throw new Error("BRIDGE_NFT_POLYGON_ADDRESS env variable not set");
  }
  if (!nftDiamond) {
    throw new Error("NFT_DIAMOND_ADDRESS_MUMBAI env variable not set");
  }
  if (!lzChainIdMumbai) {
    throw new Error("LZ_CHAIN_ID_MUMBAI env variable not set");
  }
  if (!bridgeNFTGotchichainAddress) {
    throw new Error("BRIDGE_NFT_GOTCHICHAIN_ADDRESS env variable not set");
  }
  const bridgePolygonSide = await ethers.getContractAt(
    "FakeGotchiBridgePolygonSide",
    bridgeNFTPolygonAddress
  );

  const NFTFacet = await ethers.getContractAt("FakeGotchisNFTFacet", nftDiamond);

  console.log(`Setting trusted remote`);
  let tx = await bridgePolygonSide.setTrustedRemote(
    lzChainIdMumbai,
    ethers.utils.solidityPack(
      ["address", "address"],
      [bridgeNFTGotchichainAddress, bridgeNFTPolygonAddress]
    )
  );
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting min dst gas`);
  tx = await bridgePolygonSide.setMinDstGas(lzChainIdMumbai, 1, 35000);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting layer zero bridge address`);
  tx = await NFTFacet.setLayerZeroBridgeAddress(bridgePolygonSide.address);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();
}

async function setupBridgeCard() {
  if (!bridgeCardPolygonAddress) {
    throw new Error("BRIDGE_CARD_POLYGON_ADDRESS env variable not set");
  }
  if (!lzChainIdMumbai) {
    throw new Error("LZ_CHAIN_ID_MUMBAI env variable not set");
  }
  if (!cardDiamond) {
    throw new Error("CARD_DIAMOND_ADDRESS_MUMBAI env variable not set");
  }
  const bridgePolygonSide = await ethers.getContractAt(
    "FakeGotchiCardBridgePolygonSide",
    bridgeCardPolygonAddress
  );

  const cardFacet = await ethers.getContractAt("FakeGotchisCardFacet", cardDiamond);

  console.log(`Setting trusted remote`);
  let tx = await bridgePolygonSide.setTrustedRemote(
    lzChainIdMumbai,
    ethers.utils.solidityPack(
      ["address", "address"],
      [bridgeCardGotchichainAddress, bridgeCardPolygonAddress]
    )
  );
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting min dst gas`);
  tx = await bridgePolygonSide.setMinDstGas(lzChainIdMumbai, 1, 35000);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting use custom adapter params`);
  tx = await bridgePolygonSide.setUseCustomAdapterParams(true);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting layer zero bridge address`);
  tx = await cardFacet.setLayerZeroBridgeAddress(bridgePolygonSide.address);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
