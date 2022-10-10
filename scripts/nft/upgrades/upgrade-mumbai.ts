import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  mumbaiFakeGotchisNFTDiamondAddress,
  mumbaiFakeGotchisUpgraderAddress,
} from "../../helperFunctions";
import {
  DiamondLoupeFacet,
  FakeGotchisNFTFacet__factory,
} from "../../../typechain-types";
import { FakeGotchisNFTFacetInterface } from "../../../typechain-types/contracts/FakeGotchisNFTDiamond/facets/FakeGotchisNFTFacet";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "FakeGotchisNFTFacet",
      addSelectors: [],
      removeSelectors: ["function updateInterfaces() external"],
    },
    {
      facetName: "MetadataFacet",
      addSelectors: [
        "function addMetadata((string,string,string,string,string,address,string,uint256[2],uint256),uint256) external",
      ],
      removeSelectors: [
        "function addMetadata((string,string,address,string,string,string,address,string,uint256[2],uint256),uint256,uint256) external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: mumbaiFakeGotchisUpgraderAddress,
    diamondAddress: mumbaiFakeGotchisNFTDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
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
