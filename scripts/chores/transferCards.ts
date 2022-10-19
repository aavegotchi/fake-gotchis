//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { FakeGotchisCardFacet } from "../../typechain-types";

const gasPrice = 100000000000;

async function transferOwner() {
  const accounts = await ethers.getSigners();

  const from = "0x8d46fd7160940d89da026d59b2e819208e714e82";
  const to = "0x8d46fd7160940d89da026d59b2e819208e714e82";
  let signer: any;

  const c = await varsForNetwork(ethers);

  // deploy DiamondCutFacet

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [from],
    });
    signer = await ethers.provider.getSigner(from);
  } else if (
    hardhat.network.name === "matic" ||
    hardhat.network.name === "mumbai"
  ) {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const cardsFacet = (await ethers.getContractAt(
    "FakeGotchisCardFacet",
    c.fakeGotchiCards,
    signer
  )) as FakeGotchisCardFacet;

  console.log("Approving");
  let tx = await cardsFacet.setApprovalForAll(c.fakeGotchiCards, true);
  await tx.wait();

  console.log("Transferring");
  tx = await cardsFacet.safeTransferFrom(from, to, 0, 100, []);

  await tx.wait();

  const balance = await cardsFacet.balanceOf(to, 0);

  console.log("balance:", balance.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  transferOwner()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployDiamond = transferOwner;
