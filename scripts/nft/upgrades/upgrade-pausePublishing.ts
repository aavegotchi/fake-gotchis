import { ethers, run } from "hardhat";
import { maticVars, varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";
import { MetadataFacetInterface } from "../../../typechain-types/contracts/FakeGotchisNFTDiamond/facets/MetaDataFacet.sol/MetadataFacet";
import { MetadataFacet__factory } from "../../../typechain-types";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MetadataFacet",
      addSelectors: [`function togglePublishingPaused(bool _paused) external`],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  let iface: MetadataFacetInterface = new ethers.utils.Interface(
    MetadataFacet__factory.abi
  ) as MetadataFacetInterface;

  const calldata = iface.encodeFunctionData("togglePublishingPaused", [true]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.fakeGotchiArt, ethers),
    diamondAddress: c.fakeGotchiArt,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticVars.fakeGotchiArt,
    initCalldata: calldata,
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
