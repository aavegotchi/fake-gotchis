import { Alchemy, Network } from "alchemy-sdk";
import fs, { existsSync } from "fs";
import { ethers } from "hardhat";
import { writeBlockNumber } from "./paths";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.MATIC_MAINNET,
};

export const excludedAddresses = [
  "0x0000000000000000000000000000000000000000",
  "0x0000000000000000000000000000000000000001",
  "0x000000000000000000000000000000000000dead",
  "0xffffffffffffffffffffffffffffffffffffffff",
];

export const vault = "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63";
export const gbmDiamond = "0xD5543237C656f25EEA69f1E247b8Fa59ba353306";
export const raffle1 = "0x6c723cac1E35FE29a175b287AE242d424c52c1CE";
export const raffle2 = "0xa85f5a59a71842fddaabd4c2cd373300a31750d8";
export const PC = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";

export const fgCardDir = `${__dirname}/cloneData/FGCard`;
export const fgNFTsDir = `${__dirname}/cloneData/FGNFT`;

const FILES = {
  //all normal fakegotchi card holders
  fakegotchiCardHolders: `${fgCardDir}/fakegotchiCardHolders.json`,
  //all contracts without owners holding fakegotchicards
  fakegotchiCardContractHolders: `${fgCardDir}/fakegotchiCardContractHolders.json`,
  //all contracts with owners holding fakegotchicards
  fakegotchiCardContractHoldersWithOwners: `${fgCardDir}/fakegotchiCardContractHoldersWithOwners.json`,
  //all safe contracts
  safeContractsGotchiCards: `${fgCardDir}/gotchiCardsSafe.json`,
  //all gbm contracts
  gbmContracts: `${fgCardDir}/gbmContractsGotchiCards.json`,

  //all fakegotchis nft holders
  fakeGotchisNFTHolders: `${fgNFTsDir}/fakeGotchisNFTHolders.json`,
  //all contracts without owners holding fakegotchis nfts
  fakeGotchisNFTContractHolders: `${fgNFTsDir}/fakeGotchisNFTContractHolders.json`,
  //all contracts with owners holding fakegotchis nfts
  fakeGotchisNFTContractHoldersWithOwners: `${fgNFTsDir}/fakeGotchisNFTContractHoldersWithOwners.json`,
  //all safe contracts
  safeContractsGotchisNFTs: `${fgNFTsDir}/gotchisNFTSafe.json`,
  //all gbm contracts
  gbmContractsGotchisNFTs: `${fgNFTsDir}/gbmContractsGotchisNFTs.json`,
};

const alchemy = new Alchemy(config);

interface TokenHolder {
  ownerAddress: string;
  tokenBalances: {
    tokenId: string;
    balance: string | number;
  }[];
}

interface SafeDetails {
  safeAddress: string;
  tokenBalances: {
    tokenId: string;
  }[];
}

interface ContractEOAHolder {
  contractOwner: string;
  tokens: TokenHolder;
}

const fakeGotchisCardDiamondAddress =
  "0x9f6BcC63e86D44c46e85564E9383E650dc0b56D7";
export const fakeGotchisNFTDiamond =
  "0xA4E3513c98b30d4D7cc578d2C328Bd550725D1D0";

async function main() {
  // Create all necessary directories
  const directories = [
    `${__dirname}/cloneData`,
    `${__dirname}/cloneData/FGCard`,
    `${__dirname}/cloneData/FGNFT`,
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Get holders data from Alchemy

  const blockNumber = await writeBlockNumber("fakegotchiCard", ethers);
  await writeBlockNumber("fakegotchiNFT", ethers);
  const [responseCards, responseNFTs] = await Promise.all([
    alchemy.nft.getOwnersForContract(fakeGotchisCardDiamondAddress, {
      withTokenBalances: true,
      block: blockNumber,
    }),
    alchemy.nft.getOwnersForContract(fakeGotchisNFTDiamond, {
      withTokenBalances: true,
      block: blockNumber,
    }),
  ]);

  const holders = responseCards.owners;

  //temporarily store card data in a file
  fs.writeFileSync(
    `${fgCardDir}/cardData.json`,
    JSON.stringify(responseCards, null, 2)
  );

  const holdersNFTs = responseNFTs.owners;

  const state = {
    contractHolders: [] as TokenHolder[],
    contractHoldersNFTs: [] as TokenHolder[],
    vaultHolders: [] as TokenHolder[],
    vaultHoldersNFTs: [] as TokenHolder[],
    contractEOAs: [] as ContractEOAHolder[],
    contractEOAsNFTs: [] as ContractEOAHolder[],
    existingData: {} as Record<string, TokenHolder>,
    existingDataNFTs: {} as Record<string, TokenHolder>,
    gnosisSafeContracts: [] as SafeDetails[],
    gnosisSafeContractsNFTs: [] as SafeDetails[],
    gbmContracts: [] as TokenHolder[],
    gbmContractsNFTs: [] as TokenHolder[],
  };

  // Load existing data
  if (existsSync(FILES.fakegotchiCardHolders)) {
    state.existingData = JSON.parse(
      fs.readFileSync(FILES.fakegotchiCardHolders, "utf8")
    );
  }

  if (existsSync(FILES.fakegotchiCardContractHolders)) {
    state.contractHolders = JSON.parse(
      fs.readFileSync(FILES.fakegotchiCardContractHolders, "utf8")
    );
  }

  if (existsSync(FILES.fakegotchiCardContractHoldersWithOwners)) {
    state.contractEOAs = JSON.parse(
      fs.readFileSync(FILES.fakegotchiCardContractHoldersWithOwners, "utf8")
    );
  }

  if (existsSync(FILES.safeContractsGotchiCards)) {
    state.gnosisSafeContracts = JSON.parse(
      fs.readFileSync(FILES.safeContractsGotchiCards, "utf8")
    );
  }

  if (existsSync(FILES.gbmContracts)) {
    state.gbmContracts = JSON.parse(
      fs.readFileSync(FILES.gbmContracts, "utf8")
    );
  }

  if (existsSync(FILES.fakeGotchisNFTHolders)) {
    state.existingDataNFTs = JSON.parse(
      fs.readFileSync(FILES.fakeGotchisNFTHolders, "utf8")
    );
  }

  if (existsSync(FILES.fakeGotchisNFTContractHolders)) {
    state.contractHoldersNFTs = JSON.parse(
      fs.readFileSync(FILES.fakeGotchisNFTContractHolders, "utf8")
    );
  }

  if (existsSync(FILES.fakeGotchisNFTContractHoldersWithOwners)) {
    state.contractEOAsNFTs = JSON.parse(
      fs.readFileSync(FILES.fakeGotchisNFTContractHoldersWithOwners, "utf8")
    );
  }

  if (existsSync(FILES.safeContractsGotchisNFTs)) {
    state.gnosisSafeContractsNFTs = JSON.parse(
      fs.readFileSync(FILES.safeContractsGotchisNFTs, "utf8")
    );
  }

  if (existsSync(FILES.gbmContractsGotchisNFTs)) {
    state.gbmContractsNFTs = JSON.parse(
      fs.readFileSync(FILES.gbmContractsGotchisNFTs, "utf8")
    );
  }

  console.log(`Processing ${holders.length} FG card holders`);
  await processHoldersWithRetry(holders, state, "card");

  console.log(`Processing ${holdersNFTs.length} FG NFT holders`);
  await processHoldersWithRetry(holdersNFTs, state, "nft");

  console.log("All processing complete!");
}

async function processHolder(
  holder: TokenHolder,
  state: any,
  type: "card" | "nft"
) {
  //convert tokenId from hex to decimal for FG Cards and NFTs
  holder.tokenBalances = holder.tokenBalances.map((tb) => ({
    ...tb,
    tokenId:
      typeof tb.tokenId === "string" && tb.tokenId.startsWith("0x")
        ? parseInt(tb.tokenId, 16).toString()
        : tb.tokenId.toString(),
  }));

  const { ownerAddress } = holder;

  // Skip excluded addresses using lowercase comparison
  //this is to avoid issues with addresses that have different case
  if (excludedAddresses.includes(ownerAddress.toLowerCase())) {
    return;
  }

  const data = type === "card" ? state.existingData : state.existingDataNFTs;

  // Check if holder is raffle1 or raffle2
  if (
    ownerAddress.toLowerCase() === raffle1.toLowerCase() ||
    ownerAddress.toLowerCase() === raffle2.toLowerCase()
  ) {
    // Assign tokens to PC address
    if (data[PC]) {
      // If PC already has tokens, merge them
      data[PC].tokenBalances = [
        ...data[PC].tokenBalances,
        ...holder.tokenBalances,
      ];
    } else {
      // If PC doesn't have tokens yet, create new entry
      data[PC] = {
        ownerAddress: PC,
        tokenBalances: holder.tokenBalances,
      };
    }
    return;
  }

  // Normal processing for other holders
  data[ownerAddress] = holder;

  if (ownerAddress.toLowerCase() === vault.toLowerCase()) {
    const holders =
      type === "card" ? state.vaultHolders : state.vaultHoldersNFTs;
    holders.push(holder);
    delete data[ownerAddress];
    return;
  }

  if (ownerAddress.toLowerCase() === gbmDiamond.toLowerCase()) {
    const holders =
      type === "card" ? state.gbmContracts : state.gbmContractsNFTs;
    holders.push(holder);
    delete data[ownerAddress];
    return;
  }

  const code = await ethers.provider.getCode(ownerAddress);
  if (code !== "0x") {
    const contractOwner = await getOwner(ownerAddress);
    if (contractOwner) {
      const eoaHolders =
        type === "card" ? state.contractEOAs : state.contractEOAsNFTs;
      eoaHolders.push({ contractOwner, tokens: holder });
    } else if (await isSafe(ownerAddress)) {
      const safeDetailsObject = {
        safeAddress: ownerAddress,
        tokenBalances: holder.tokenBalances,
      };
      const safeHolders =
        type === "card"
          ? state.gnosisSafeContracts
          : state.gnosisSafeContractsNFTs;
      safeHolders.push(safeDetailsObject);
    } else {
      const contractHolders =
        type === "card" ? state.contractHolders : state.contractHoldersNFTs;
      contractHolders.push(holder);
    }
    delete data[ownerAddress];
  }
}

function writeFiles(state: any, type: "card" | "nft") {
  if (type === "card") {
    fs.writeFileSync(
      FILES.fakegotchiCardHolders,
      JSON.stringify(state.existingData, null, 2)
    );
    fs.writeFileSync(
      FILES.fakegotchiCardContractHolders,
      JSON.stringify(state.contractHolders, null, 2)
    );
    fs.writeFileSync(
      FILES.fakegotchiCardContractHoldersWithOwners,
      JSON.stringify(state.contractEOAs, null, 2)
    );
    fs.writeFileSync(
      FILES.safeContractsGotchiCards,
      JSON.stringify(state.gnosisSafeContracts, null, 2)
    );
    fs.writeFileSync(
      FILES.gbmContracts,
      JSON.stringify(state.gbmContracts, null, 2)
    );
  } else {
    fs.writeFileSync(
      FILES.fakeGotchisNFTHolders,
      JSON.stringify(state.existingDataNFTs, null, 2)
    );
    fs.writeFileSync(
      FILES.fakeGotchisNFTContractHolders,
      JSON.stringify(state.contractHoldersNFTs, null, 2)
    );
    fs.writeFileSync(
      FILES.fakeGotchisNFTContractHoldersWithOwners,
      JSON.stringify(state.contractEOAsNFTs, null, 2)
    );
    fs.writeFileSync(
      FILES.safeContractsGotchisNFTs,
      JSON.stringify(state.gnosisSafeContractsNFTs, null, 2)
    );
    fs.writeFileSync(
      FILES.gbmContractsGotchisNFTs,
      JSON.stringify(state.gbmContractsNFTs, null, 2)
    );
  }

  //add some logs showing the number of holders in each category
  console.log(`Number of holders in vault: ${state.vaultHolders.length}`);
  console.log(`Number of unknown contracts: ${state.contractHolders.length}`);
  console.log(
    `Number of contracts with valid eoa : ${state.contractEOAs.length}`
  );
  console.log(`Number of safe contracts: ${state.gnosisSafeContracts.length}`);
}

//a simple fn that gets the owner of an arbitrary contract
//if the call fails return a mild error
export const getOwner = async (contractAddress: string) => {
  const owner = await ethers.getContractAt("OwnershipFacet", contractAddress);
  try {
    return await owner.owner();
  } catch (error) {
    console.log(`Unknown Contract: ${contractAddress}`);
    return "";
  }
};

export const isSafe = async (contractAddress: string): Promise<boolean> => {
  try {
    const safe = await ethers.getContractAt("ISafe", contractAddress);
    const version = await safe.VERSION();
    return version === "1.3.0";
  } catch (error) {
    return false;
  }
};

// Add retry functionality for processing holders
async function processHoldersWithRetry(
  holders: TokenHolder[],
  state: any,
  type: "card" | "nft",
  startIndex = 0,
  batchSize = 10
) {
  const maxRetries = 3;
  const totalHolders = holders.length;

  const progressFile = `${__dirname}/cloneData/${type}_progress.json`;

  // Load progress if it exists
  let currentIndex = startIndex;
  if (existsSync(progressFile)) {
    try {
      const progress = JSON.parse(fs.readFileSync(progressFile, "utf8"));
      currentIndex = progress.currentIndex;
      console.log(`Resuming from index ${currentIndex}`);
    } catch (error) {
      console.log(`Error reading progress file: ${error}`);
    }
  }

  while (currentIndex < totalHolders) {
    const endIndex = Math.min(currentIndex + batchSize, totalHolders);
    console.log(
      `Processing batch ${currentIndex} to ${
        endIndex - 1
      } of ${totalHolders} ${type} holders`
    );

    for (let i = currentIndex; i < endIndex; i++) {
      let retries = 0;
      let success = false;

      while (!success && retries < maxRetries) {
        try {
          await processHolder(holders[i], state, type);
          success = true;
        } catch (error) {
          retries++;
          console.log(
            `Error processing holder ${i}, retry ${retries}: ${error}`
          );

          if (retries >= maxRetries) {
            console.log(
              `Failed to process holder ${i} after ${maxRetries} retries`
            );
          } else {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
          }
        }
      }

      // Save progress after each holder
      fs.writeFileSync(progressFile, JSON.stringify({ currentIndex: i + 1 }));
      console.log(`Processed ${i + 1} of ${totalHolders} ${type} holders`);
    }

    // Write files after each batch
    writeFiles(state, type);
    currentIndex = endIndex;
  }

  // Clean up progress file when done
  if (existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
