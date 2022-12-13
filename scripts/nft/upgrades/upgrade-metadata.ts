import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";
import { FakeGotchisNFTFacet } from "../../../typechain-types";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "FakeGotchisNFTFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.fakeGotchiArt, ethers),
    diamondAddress: c.fakeGotchiArt,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args);

  const fakeGotchisNFTFacet = (await ethers.getContractAt(
    "FakeGotchisNFTFacet",
    c.fakeGotchiArt
  )) as FakeGotchisNFTFacet;
  const tokenUri = await fakeGotchisNFTFacet.tokenURI(644);
  console.log(tokenUri);
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
