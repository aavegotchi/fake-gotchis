import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";

const metadata = `tuple(
address publisher,
    uint16[2] royalty,
    uint16 editions,
    uint32 flagCount,
    uint32 likeCount,
    address artist,
    uint40 createdAt,
    uint8 status,
    bool minted,
    string name,
    string description,
    string externalLink,
    string artistName,
    string publisherName,
    string fileHash,
    string fileType,
    string thumbnailHash,
    string thumbnailType,
)`;
export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MetadataFacet",
      addSelectors: [
        `function getMetadataIdCounter() public view returns (uint256)`,
        `function getMetadataBatch(uint256[] memory _ids) external view returns (${metadata}[] memory)`,
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
