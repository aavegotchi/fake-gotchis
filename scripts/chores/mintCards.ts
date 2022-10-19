//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { FakeGotchisCardFacet, OwnershipFacet } from "../../typechain-types";

const gasPrice = 100000000000;

async function mintCards() {
  const accounts = await ethers.getSigners();
  let signer: any;

  const c = await varsForNetwork(ethers);

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    c.fakeGotchiCards
  )) as OwnershipFacet;

  const currentOwner = await ownershipFacet.owner();

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

  const cardsFacet = (await ethers.getContractAt(
    "FakeGotchisCardFacet",
    c.fakeGotchiCards,
    signer
  )) as FakeGotchisCardFacet;

  const tx = await cardsFacet.startNewSeries(2535);

  await tx.wait();

  const bal = await cardsFacet.balanceOf(currentOwner, 0);

  console.log("bal:", bal, toString());

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
  mintCards()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
