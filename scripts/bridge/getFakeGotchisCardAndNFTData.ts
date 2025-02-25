import { Alchemy, Network } from "alchemy-sdk";
import fs, { existsSync } from "fs";
import { ethers } from "hardhat";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.MATIC_MAINNET,
};

export const excludedAddresses = [
  "0x0000000000000000000000000000000000000000",
  "0x0000000000000000000000000000000000000001",
  "0x000000000000000000000000000000000000dEaD",
  "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
];

export const vault = "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63";

const FILES = {
  //all normal fakegotchi card holders
  fakegotchiCardHolders: `${__dirname}/cloneData/fakegotchiCardHolders.json`,
  //all contracts without owners holding fakegotchicards
  fakegotchiCardContractHolders: `${__dirname}/cloneData/fakegotchiCardContractHolders.json`,
  //all contracts with owners holding fakegotchicards
  fakegotchiCardContractHoldersWithOwners: `${__dirname}/cloneData/fakegotchiCardContractHoldersWithOwners.json`,

  //all fakegotchis nft holders
  fakeGotchisNFTHolders: `${__dirname}/cloneData/fakeGotchisNFTHolders.json`,
  //all contracts without owners holding fakegotchis nfts
  fakeGotchisNFTContractHolders: `${__dirname}/cloneData/fakeGotchisNFTContractHolders.json`,
  //all contracts with owners holding fakegotchis nfts
  fakeGotchisNFTContractHoldersWithOwners: `${__dirname}/cloneData/fakeGotchisNFTContractHoldersWithOwners.json`,
};

const alchemy = new Alchemy(config);

interface TokenHolder {
  ownerAddress: string;
  tokenBalances: {
    tokenId: string;
    balance: string;
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
  // Create data directory if it doesn't exist
  if (!fs.existsSync(`${__dirname}/cloneData`)) {
    fs.mkdirSync(`${__dirname}/cloneData`, { recursive: true });
  }

  // Get holders data from Alchemy
  const [responseCards, responseNFTs] = await Promise.all([
    alchemy.nft.getOwnersForContract(fakeGotchisCardDiamondAddress, {
      withTokenBalances: true,
    }),
    alchemy.nft.getOwnersForContract(fakeGotchisNFTDiamond, {
      withTokenBalances: true,
    }),
  ]);

  const holders = responseCards.owners;
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

  console.log(`Processing ${holders.length} FG card holders`);
  console.log(`Processing ${holdersNFTs.length} FG NFT holders`);

  // Process card holders
  for (let i = 0; i < holders.length; i++) {
    await processHolder(holders[i], state, "card");
    console.log(`Processed ${i + 1} of ${holders.length} FG card holders`);
    writeFiles(state, "card");
  }

  // Process NFT holders
  for (let i = 0; i < holdersNFTs.length; i++) {
    await processHolder(holdersNFTs[i], state, "nft");
    console.log(`Processed ${i + 1} of ${holdersNFTs.length} FG NFT holders`);
    writeFiles(state, "nft");
  }
}

async function processHolder(
  holder: TokenHolder,
  state: any,
  type: "card" | "nft"
) {
  const { ownerAddress } = holder;

  //skip excluded addresses
  if (excludedAddresses.includes(ownerAddress)) {
    return;
  }

  const data = type === "card" ? state.existingData : state.existingDataNFTs;
  data[ownerAddress] = holder;

  if (ownerAddress.toLowerCase() === vault.toLowerCase()) {
    const holders =
      type === "card" ? state.vaultHolders : state.vaultHoldersNFTs;
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
  }
}

//a simple fn that gets the owner of an arbitrary contract
//if the call fails return a mild error
export const getOwner = async (contractAddress: string) => {
  const owner = await ethers.getContractAt("OwnershipFacet", contractAddress);
  try {
    return await owner.owner();
  } catch (error) {
    console.log(`Error getting owner of ${contractAddress}: ${error}`);
    return "";
  }
};
if (require.main === module) {
  main();
}
