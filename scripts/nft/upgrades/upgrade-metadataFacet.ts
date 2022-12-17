import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MetadataFacet",
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
