import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";
import { FakeGotchisNFTFacet__factory } from "../../../typechain-types";

const gotchichainBridgeAddress = "0xB8133C7CF766f29d68b0cC470ED8F0B65eB996E6";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "FakeGotchisNFTFacet",
      addSelectors: [
        `function setLayerZeroBridgeAddress(address _newLayerZeroBridge) external onlyOwner`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface = new ethers.utils.Interface(
    FakeGotchisNFTFacet__factory.abi
  );

  const calldata = iface.encodeFunctionData("setLayerZeroBridgeAddress", [
    gotchichainBridgeAddress,
  ]);

  const c = await varsForNetwork(ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.fakeGotchiArt, ethers),
    diamondAddress: c.fakeGotchiArt,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: c.fakeGotchiArt,
    initCalldata: calldata
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
