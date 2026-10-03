import { ethers, network } from "hardhat";
import { getSelectors, impersonate } from "../scripts/helperFunctions";

export async function upgradeFixture(
  diamondAddress: string,
  facetName: string
) {
  if (network.name !== "hardhat") throw new Error("Fixture requires Hardhat");

  const facet = await (await ethers.getContractFactory(facetName)).deploy();
  await facet.deployed();
  const loupe = await ethers.getContractAt("IDiamondLoupe", diamondAddress);
  const owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  await network.provider.send("hardhat_setBalance", [
    owner,
    "0x100000000000000000000000",
  ]);
  const diamondCut = await impersonate(
    owner,
    await ethers.getContractAt("IDiamondCut", diamondAddress),
    ethers,
    network
  );
  const cut = [];
  for (const selector of getSelectors(facet)) {
    // Keep pause routing on the NFT facet, which emits DiamondPauseToggled.
    if (
      facetName === "MetadataFacet" &&
      selector === facet.interface.getSighash("toggleDiamondPause(bool)")
    )
      continue;
    cut.push({
      facetAddress: facet.address,
      action:
        (await loupe.facetAddress(selector)) === ethers.constants.AddressZero
          ? 0
          : 1,
      functionSelectors: [selector],
    });
  }
  await (
    await diamondCut.diamondCut(cut, ethers.constants.AddressZero, "0x")
  ).wait();
}
