//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { MetadataFacet } from "../../../typechain-types";

const gasPrice = 100000000000;

async function setAavegotchiAddress() {
  const accounts = await ethers.getSigners();
  let signer: any;

  const c = await varsForNetwork(ethers);

  console.log("c:", c);

  console.log("account:", accounts[0]);

  const metadataFacet = (await ethers.getContractAt(
    "MetadataFacet",
    c.fakeGotchiArt,
    accounts[0]
  )) as MetadataFacet;

  // deploy DiamondCutFacet

  const publisher = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  //   if (testing) {
  //     await hardhat.network.provider.request({
  //       method: "hardhat_impersonateAccount",
  //       params: [publisher],
  //     });
  //     signer = await ethers.provider.getSigner(publisher);
  //   } else if (
  //     hardhat.network.name === "matic" ||
  //     hardhat.network.name === "mumbai"
  //   ) {
  //     signer = accounts[0];
  //   } else {
  //     throw Error("Incorrect network selected");
  //   }

  console.log("Setting operator");

  const tx = await metadataFacet.togglePublishingOperator(
    "0x94cb5C277FCC64C274Bd30847f0821077B231022",
    true
  );

  await tx.wait();
  console.log("Address set");

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
  setAavegotchiAddress()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
