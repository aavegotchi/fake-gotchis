import fs from "fs";
import path from "path";

// Define basic types for the input data structures to ensure type safety.
interface ContractHolder {
  tokens: {
    ownerAddress: string;
  };
}

interface SafeHolder {
  safeAddress: string;
}

async function getUniqueOwnerAddresses() {
  console.log("Starting to gather and deduplicate owner addresses...");

  // Define file paths
  const basePath = path.join(__dirname, "cloneData");
  const cardContractHoldersFile = path.join(
    basePath,
    "FGCard",
    "fakegotchiCardContractHoldersWithOwners.json"
  );
  const cardSafeFile = path.join(basePath, "FGCard", "gotchiCardsSafe.json");
  const nftContractHoldersFile = path.join(
    basePath,
    "FGNFT",
    "fakeGotchisNFTContractHoldersWithOwners.json"
  );
  const nftSafeFile = path.join(basePath, "FGNFT", "gotchisNFTSafe.json");
  const outputFile = path.join(basePath, "uniqueOwnerAddresses.json");

  const allAddresses = new Set<string>();

  try {
    // A hardcoded list of additional addresses to include
    const additionalAddresses = [
      "0xc46d3c9d93febdd5027c9b696fe576dc654c66de",
      "0x53a75d41bfc6b5f9e4d4f9769eb12cf58904f37a",
      "0x6865ae680c92bf047d08aa7f40ca2ec5a4f01c5a",
      "0x000023a3af6232d20a209db7a3fd3375a082a4f0",
      "0x0d235f7b57ed4e4ca3d6189f1ac1e13360a1a769",
      "0x0681320ba86457f686cb0a0e664ad23c8ab77ec0",
      "0xdcf4dbd159afc0fd71bcf1bfa97ccf23646eabc0",
      "0x8048ea1029f30beea23b0fef544fd3538692ba23",
      "0x8c3fb88a4b91a2ba45f5d1c3e6bfc7f97bfdb557",
      "0x2ad6ac3cc15ab4bdbb17eb4340b08708cbcd1ae0",
      "0xe237122dbca1001a9a3c1ab42cb8ae0c7bffc338",
      "0xdbc859fad41990f35fb8a8879bcadb40eef3a340",
      "0x3c2b45d1a4accb2c639c35bd0106d45c20424e8e",
      "0x939b67f6f6be63e09b0258621c5a24eecb92631c",
      "0x55217dfc9146d3d02d07af11a056b8baffe7aaaf",
      "0x6fb7e0aafba16396ad6c1046027717bca25f821f",
      "0xfe7368b146ede3b816f127b14ab8ab2436f660a4",
      "0xfb51901e2427c70072e8067722c447b410550e8a",
      "0x1c192acb0bc91611425f640e587368c25fcc4819",
      "0xaa2a5d382fb27e73b52c78aeb738a8edeb9eb6de",
      "0x96c41aa08d8effdfd86697f6dece1bb889b27004",
      "0x6759eed797ffaaca7edfc5bd74e7839f1ed0fba4",
      "0x3d3bef5f85a667e0b28db33668ce1929089e5e1a",
      "0xfe793d34d6d6ff83b0e5dc4cc0c530ac366a9633",
      "0xa421ed8a4e3cfbfbfd2f621b27bd3c27d71c8b97",
      "0x5ed1383c2c9b77acab1b56405f6790a6db7c4219",
      "0x1d86852b823775267ee60d98cbcda9e8d5c2faa7",
      "0xa44c8e0ecaefe668947154ee2b803bd4e6310efe",
      "0x75c8866f47293636f1c32ecbcd9168857dbefc56",
      "0xa3ee89bef93c68b39d404282e2d894cef52b99b1",
      "0xfe4b96f1860c5a2a09cd4bd5c341632c9e9486e6",
      "0x085b40116bc8d7f9d8119ae381e2dbe81369c02b",
      "0x0df9b09099b89ead526f611be087f800d665a906",
      "0x1052afd68dadd4165dc300836f65656c6ed574ac",
      "0x19585f0e0cf5a84c9086de35e86b649fdfe940bd",
      "0x2d498004aadcd8fcef1f69674758f34b3d4722cc",
      "0x376184461aaa5bd445cd52924fdf29e8e4b86900",
      "0x753185c55efcf983e28b5b8961c9b1f9a0cdcb48",
      "0xbfbc49b7365befd1fd87a6af43c86754cd8dfd0f",
      "0xe8bc19e131dcf57c2beb7af337a4e1dd13aa211e",
      "0x11f9c4b62b5d04d9c67641d5643a41a405e0b938",
      "0x27625d6c7c8356d21a55c0c917a5fa324db24035",
      "0x2c75b1e0b291f3c8aab54bec92a53fe11af0022f",
      "0x3b31fa93aa8bdca9e9ac1ea8de56cae53140c4a5",
      "0x66d3bccc92c47e0751cb63625b6594886daa7b80",
      "0x67fd490fd5e17e39cfa76956d062bbefdc852d34",
      "0x9510d77f70cf73fe19bd585d4ef0260b7e06a049",
      "0xa97946357a1f6c251b9d257833ab0233ed863527",
      "0xe52405604bf644349f57b36ca6e85cf095fab8da",
      "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63",
      "0xD5543237C656f25EEA69f1E247b8Fa59ba353306",
      "0x6c723cac1E35FE29a175b287AE242d424c52c1CE",
      "0xa85f5a59a71842fddaabd4c2cd373300a31750d8",
      "0xd5724BCA82423D5792C676cd453c1Bf66151dC04",
      "0x091bec7974cde13696ae3d72a96e1cb8e5e7207e",
      "0x062493ccc0cab27766e93faab1de50ef4d2e13f5",
      "0x14cab7829b03d075c4ae1acf4f9156235ce99405",
      "0x4e52b73aa28b7ff84d88ea3a90c0668f46043450",
      "0xe53cf7d7483b099023f495f9efb7aed98a9fc1e0",
      "0x6e3451367d1498487699dd70d6261089bddf205e",
      "0xf1d1d61eedda7a10b494af7af87d932ac910f3c5",
      "0xabcbaad23ebb454f9aeb55a92ec2e6e1548ef586",
      "0x381efc488858b5daa8aea64650bce50c83108c6d",
      "0xbc3b05203dcdf58dbeef09d43598602c527e35f1",
      "0x82fb16fe3b5925dc4e648e05a317fadd4f87b863",
      "0x738975e70542b21c97baa167722921c8131d8d61",
      "0x319e73f78a597708540f54f7c03f8a5185b0a9b8",
      "0x4e7a10ae6565379908ccdc9b602b9c81314dca13",
    ];

    for (const address of additionalAddresses) {
      allAddresses.add(address.toLowerCase()); // Standardize to lowercase
    }
    console.log(
      `Added ${additionalAddresses.length} addresses from the hardcoded list.`
    );

    // Process fakegotchiCardContractHoldersWithOwners.json
    const cardContractHolders: ContractHolder[] = JSON.parse(
      fs.readFileSync(cardContractHoldersFile, "utf8")
    );
    for (const holder of cardContractHolders) {
      if (holder.tokens && holder.tokens.ownerAddress) {
        allAddresses.add(holder.tokens.ownerAddress.toLowerCase());
      }
    }
    console.log(
      `Processed ${cardContractHolders.length} entries from fakegotchiCardContractHoldersWithOwners.json`
    );

    // Process gotchiCardsSafe.json
    const cardSafes: SafeHolder[] = JSON.parse(
      fs.readFileSync(cardSafeFile, "utf8")
    );
    for (const safe of cardSafes) {
      if (safe.safeAddress) {
        allAddresses.add(safe.safeAddress.toLowerCase());
      }
    }
    console.log(
      `Processed ${cardSafes.length} entries from gotchiCardsSafe.json`
    );

    // Process fakeGotchisNFTContractHoldersWithOwners.json
    const nftContractHolders: ContractHolder[] = JSON.parse(
      fs.readFileSync(nftContractHoldersFile, "utf8")
    );
    for (const holder of nftContractHolders) {
      if (holder.tokens && holder.tokens.ownerAddress) {
        allAddresses.add(holder.tokens.ownerAddress.toLowerCase());
      }
    }
    console.log(
      `Processed ${nftContractHolders.length} entries from fakeGotchisNFTContractHoldersWithOwners.json`
    );

    // Process gotchisNFTSafe.json
    const nftSafes: SafeHolder[] = JSON.parse(
      fs.readFileSync(nftSafeFile, "utf8")
    );
    for (const safe of nftSafes) {
      if (safe.safeAddress) {
        allAddresses.add(safe.safeAddress.toLowerCase());
      }
    }
    console.log(
      `Processed ${nftSafes.length} entries from gotchisNFTSafe.json`
    );

    // Convert Set to Array for the final output
    const uniqueAddresses = Array.from(allAddresses);

    // Write the unique addresses to the output file
    fs.writeFileSync(outputFile, JSON.stringify(uniqueAddresses, null, 2));

    console.log(
      `\nSuccessfully gathered all addresses. Found ${uniqueAddresses.length} unique addresses.`
    );
    console.log(`Results have been saved to: ${outputFile}`);
  } catch (error) {
    console.error("An error occurred while processing the files:", error);
  }
}

// Execute the function
getUniqueOwnerAddresses();
