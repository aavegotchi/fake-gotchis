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
  // confirm interfaces
  const loupe = (await ethers.getContractAt(
    "DiamondLoupeFacet",
    mumbaiFakeGotchisNFTDiamondAddress
  )) as DiamondLoupeFacet;
  console.log(
    "MultiRoyalty supported:",
    await loupe.supportsInterface("0x24d34933")
  );
  console.log(
    "ERC2981 supported:",
    await loupe.supportsInterface("0x2a55205a")
  );

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "FakeGotchisNFTFacet",
      addSelectors: [
        "function multiRoyaltyInfo(uint256 _tokenId, uint256 _salePrice) external view",
        "function updateInterfaces() external",
      ],
      removeSelectors: [
        "function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view",
      ],
    },
    {
      facetName: "MetadataFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: FakeGotchisNFTFacetInterface = new ethers.utils.Interface(
    FakeGotchisNFTFacet__factory.abi
  ) as FakeGotchisNFTFacetInterface;
  //@ts-ignore
  const payload = iface.encodeFunctionData("updateInterfaces", []);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: mumbaiFakeGotchisUpgraderAddress,
    diamondAddress: mumbaiFakeGotchisNFTDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: mumbaiFakeGotchisNFTDiamondAddress,
    initCalldata: payload,
  };

  await run("deployUpgrade", args);

  console.log(
    "MultiRoyalty supported:",
    await loupe.supportsInterface("0x24d34933")
  );
  console.log(
    "ERC2981 supported:",
    await loupe.supportsInterface("0x2a55205a")
  );
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
