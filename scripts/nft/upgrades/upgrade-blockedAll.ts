import hardhat, { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../../helperFunctions";
import { MetadataFacet } from "../../../typechain-types";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MetadataFacet",
      addSelectors: [
        `function unblockAll() external`,
        `function checkBlocked() external returns (uint256[] memory metadataIds, address[] memory accounts, bool[] memory blocked)`,
        `function isBlocked(address _address) external returns (bool)`,
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

  // check blocked accounts
  console.log("Checking blocked accounts...");

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);
  let signer;
  const owner = await diamondOwner(c.fakeGotchiArt, ethers);
  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (
    hardhat.network.name === "matic" ||
    hardhat.network.name === "mumbai"
  ) {
    const accounts = await ethers.getSigners();
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }
  const metadataFacet = (await ethers.getContractAt(
    "MetadataFacet",
    c.fakeGotchiArt,
    signer
  )) as MetadataFacet;
  const res = await metadataFacet.checkBlocked();
  for (let i = 0; i < res.accounts.length; i++) {
    console.log(
      `${res.blocked[i] ? "Blocked" : "Unblocked"}: metadata id: ${
        res.metadataIds[i]
      }, account: ${res.accounts[i]}`
    );
  }

  console.log("Unblocking all blocked accounts...");
  await (await metadataFacet.unblockAll()).wait();

  console.log("Checking blocked accounts again...");
  const res2 = await metadataFacet.checkBlocked();
  for (let i = 0; i < res2.accounts.length; i++) {
    console.log(
      `${res2.blocked[i] ? "Blocked" : "Unblocked"}: metadata id: ${
        res2.metadataIds[i]
      }, account: ${res2.accounts[i]}`
    );
  }

  console.log("Testing declineMetadata...");
  const testMetadataId = 61;
  const testAccount = "0x38798bfB6016beEeae2b12ed1f7bA2c9bb49334f"; // This account is for metadata 61
  let isBlocked = await metadataFacet.isBlocked(testAccount);
  console.log(`${testAccount} is blocked : ${isBlocked}`);
  await (await metadataFacet.declineMetadata(testMetadataId, false)).wait();
  isBlocked = await metadataFacet.isBlocked(testAccount);
  console.log(
    `${testAccount} is blocked after declineMetadata with false: ${isBlocked}`
  );
  await (await metadataFacet.declineMetadata(testMetadataId, true)).wait();
  isBlocked = await metadataFacet.isBlocked(testAccount);
  console.log(
    `${testAccount} is blocked after declineMetadata with true: ${isBlocked}`
  );
  await (await metadataFacet.unblockSender(testAccount)).wait();
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
