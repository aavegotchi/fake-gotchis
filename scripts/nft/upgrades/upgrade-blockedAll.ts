import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";
import { MetadataFacetInterface } from "../../../typechain-types/contracts/FakeGotchisNFTDiamond/facets/MetaDataFacet.sol/MetadataFacet";
import { MetadataFacet__factory } from "../../../typechain-types/factories/contracts/FakeGotchisNFTDiamond/facets/MetaDataFacet.sol";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MetadataFacet",
      addSelectors: [
        `function unblockAll() external`,
        `function isBlocked(address _address) external returns (bool)`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  let iface: MetadataFacetInterface = new ethers.utils.Interface(
    MetadataFacet__factory.abi
  ) as MetadataFacetInterface;

  const calldata = iface.encodeFunctionData("unblockAll");

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.fakeGotchiArt, ethers),
    diamondAddress: c.fakeGotchiArt,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initCalldata: calldata,
    initAddress: c.fakeGotchiArt,
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
