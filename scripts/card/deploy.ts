//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "hardhat";
import { DiamondCutFacet, OwnershipFacet } from "../../typechain-types";
import { gasPrice } from "../helperFunctions";

const { getSelectors, FacetCutAction } = require("../libraries/diamond");

export async function deployCardDiamond() {
  console.log("Deploying Card Diamond contracts\n");

  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy({
    gasPrice: gasPrice,
  });
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("CardDiamond");
  const diamond = await Diamond.deploy(
    deployerAddress,
    diamondCutFacet.address,
    { gasPrice: gasPrice }
  );
  await diamond.deployed();
  console.log("Card Diamond deployed:", diamond.address);

  // deploy DiamondInit
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy({ gasPrice: gasPrice });
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  console.log("Deploying facets for Card Diamond\n");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "FakeGotchiCardFacet",
  ];
  const cut = [];
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy({
      gasPrice: gasPrice,
    });
    await facet.deployed();
    console.log(`${FacetName} deployed: ${facet.address}`);
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);

  // call to init function
  const functionCall = diamondInit.interface.encodeFunctionData("init");
  const tx = await diamondCut.diamondCut(
    cut,
    diamondInit.address,
    functionCall,
    { gasPrice: gasPrice }
  );
  console.log("Card Diamond cut tx: ", tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("Completed diamond cut");

  const ownershipFacet = await ethers.getContractAt(
    "OwnershipFacet",
    diamond.address
  );
  const diamondOwner = await ownershipFacet.owner();
  console.log("Card Diamond owner is:", diamondOwner);

  if (diamondOwner !== deployerAddress) {
    throw new Error(
      `Card Diamond owner ${diamondOwner} is not deployer address ${deployerAddress}!`
    );
  }

  return diamond.address;
}
