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
      addSelectors: [
        `function batchGetMetadata(uint256[] memory _ids) external view returns (uint256[] memory metadataIds)`,
      ],
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

  // await run("deployUpgrade", args);

  const metadataFacet = await ethers.getContractAt(
    "MetadataFacet",
    c.fakeGotchiArt,
  );

  const erc1155Facet = await ethers.getContractAt(
    "FakeGotchisNFTFacet",
    c.fakeGotchiArt,
  );

  const totalSupply = await erc1155Facet.totalSupply();
  console.log(totalSupply);

  //an array from id 1 to totalSupply
  const metadata = await metadataFacet.batchGetMetadata(
    Array.from({ length: totalSupply.toNumber() }, (_, i) => i + 1),
  );
  console.log(metadata);
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
