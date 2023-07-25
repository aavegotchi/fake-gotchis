import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";
import { FakeGotchisCardFacet__factory } from "../../../typechain-types";

const gotchichainBridgeAddress = "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "FakeGotchisCardFacet",
      addSelectors: [
        `function setLayerZeroBridgeAddress(address _newLayerZeroBridge) external onlyOwner`,
        `function safeBatchTransferTo(address _from, address[] calldata _to, uint256[] calldata _ids, uint256[] calldata _amounts, bytes calldata _data) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface = new ethers.utils.Interface(
    FakeGotchisCardFacet__factory.abi
  );

  const calldata = iface.encodeFunctionData("setLayerZeroBridgeAddress", [
    gotchichainBridgeAddress,
  ]);

  const c = await varsForNetwork(ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.fakeGotchiCards, ethers),
    diamondAddress: c.fakeGotchiCards,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: c.fakeGotchiCards,
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
