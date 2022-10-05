//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { FakeGotchisCardFacet } from "../../typechain-types";

const gasPrice = 100000000000;

async function transferOwner() {
  const accounts = await ethers.getSigners();

  //mumbai cards diamond
  const diamondAddress = "0x118c19F39a4Ad9032B7b7b228A2Cd927d3FddA13";
  let currentOwner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  let signer: any;

  const c = await varsForNetwork(ethers);

  // deploy DiamondCutFacet

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (
    hardhat.network.name === "matic" ||
    hardhat.network.name === "mumbai"
  ) {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const ghstAddress = "0x20d0A1ce31f8e8A77b291f25c5fbED007Adde932";
  const ghst = await ethers.getContractAt(
    "IERC20Mintable",
    c.ghstAddress,
    signer
  );

  console.log("mint GHST");
  await ghst.mint();

  const balance = await ghst.balanceOf(currentOwner);
  console.log("balance:", balance.toString());

  const cardsFacet = (await ethers.getContractAt(
    "FakeGotchisCardFacet",
    c.fakeGotchiCards,
    signer
  )) as FakeGotchisCardFacet;

  //   let tx = await cardsFacet.setAavegotchiAddress(ethers.constants.AddressZero);

  //   await tx.wait();
  //   console.log("Approving");
  //   tx = await cardsFacet.setApprovalForAll(diamondAddress, true);
  //   await tx.wait();

  //   console.log("Transferring");
  //   let tx = await cardsFacet.safeTransferFrom(
  //     "0x94cb5C277FCC64C274Bd30847f0821077B231022",
  //     "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7",
  //     0,
  //     100,
  //     []
  //   );

  //   await tx.wait();

  //   const balance = await cardsFacet.balanceOf(
  //     "0x6f839eb531F94D8A431627687Bd6E3aF50bB5824",
  //     0
  //   );

  //   console.log("balance:", balance.toString());
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
