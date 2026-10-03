import { ethers, network } from "hardhat";

export async function actionEligibilityFixture(
  ghstHolders: string[],
  gotchiOwners: string[],
  renter = ethers.constants.AddressZero
) {
  if (network.name !== "hardhat") throw new Error("Fixture requires Hardhat");
  // External balances and lending state changed after the historical tests were written.
  const source = `pragma solidity ^0.8.0;
    contract ActionEligibilityFixture {
      mapping(address => uint256) public balanceOf;
      mapping(address => uint32[]) private tokens;
      mapping(uint32 => bool) public isAavegotchiLent;
      constructor(address[] memory holders, address[] memory owners, address renter) {
        for (uint32 i; i < holders.length; i++) balanceOf[holders[i]] = 100 ether;
        for (uint32 i; i < owners.length; i++) tokens[owners[i]].push(i + 1);
        uint32 rentedId = uint32(owners.length) + 1;
        tokens[renter].push(rentedId);
        isAavegotchiLent[rentedId] = true;
      }
      function tokenIdsOfOwner(address owner) external view returns (uint32[] memory) {
        return tokens[owner];
      }
    }`;
  const output = JSON.parse(
    require("solc").compile(
      JSON.stringify({
        language: "Solidity",
        sources: { "Fixture.sol": { content: source } },
        settings: {
          evmVersion: "paris",
          outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
      })
    )
  ).contracts["Fixture.sol"].ActionEligibilityFixture;
  const fixture = await new ethers.ContractFactory(
    output.abi,
    output.evm.bytecode.object,
    (
      await ethers.getSigners()
    )[0]
  ).deploy(ghstHolders, gotchiOwners, renter);
  await fixture.deployed();
  return fixture;
}
