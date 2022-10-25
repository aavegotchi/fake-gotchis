const { run } = require("hardhat");

async function verify() {
  await run("verify:verify", {
    apikey: process.env.POLYGON_API_KEY,
    contract: 'contracts/shared/OwnershipFacet.sol:OwnershipFacet',
    address: "0x7bEE64cC31464733Eb8070fFE61bF35F3ee7F551", // deployed address,
    // constructorArguments: [
    //   "",
    // ]
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
