import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  mumbaiFakeGotchisNFTDiamondAddress,
  mumbaiFakeGotchisUpgraderAddress,
} from "../../helperFunctions";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MetadataFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: mumbaiFakeGotchisUpgraderAddress,
    diamondAddress: mumbaiFakeGotchisNFTDiamondAddress,
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
