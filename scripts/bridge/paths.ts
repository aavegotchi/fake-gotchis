export const DATA_DIR = `${__dirname}/cloneData`;
export const BLOCKNUMBERFILE = `${DATA_DIR}/blockNumber.json`;
export let BLOCK_NUMBER = 73121283; //leave this blank to use latest block number

import fs from "fs";

interface BlockNumber {
  fakegotchiCard: number;
  fakegotchiNFT: number;
  fakegotchiNFTMetadata: number;
}

export async function writeBlockNumber(
  assetType: "fakegotchiCard" | "fakegotchiNFT" | "fakegotchiNFTMetadata",
  ethers: any
) {
  let blockNumber = await ethers.provider.getBlockNumber();
  if (BLOCK_NUMBER) {
    blockNumber = BLOCK_NUMBER;
  }
  console.log(
    `Using anchor Block number for ${assetType} data: ${blockNumber}`
  );
  //create the file if it doesn't exist
  //create the directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BLOCKNUMBERFILE)) {
    fs.writeFileSync(
      BLOCKNUMBERFILE,
      JSON.stringify({ [assetType]: blockNumber }, null, 2)
    );
  }
  //read the file and only update the assetType block number
  const blockNumberObject: BlockNumber = JSON.parse(
    fs.readFileSync(BLOCKNUMBERFILE, "utf8")
  );
  //direct update the block number
  blockNumberObject[assetType] = blockNumber;
  fs.writeFileSync(BLOCKNUMBERFILE, JSON.stringify(blockNumberObject, null, 2));
  return blockNumber;
}

export async function isRealContract(
  provider: any,
  addr: string
): Promise<boolean> {
  const code = await provider.getCode(addr);

  // No code at all → definitely an EOA
  if (code === "0x") return false;

  // 7702 stub: 34 bytes and starts with 0xef0100
  if (code.slice(2, 8) === "ef0100") {
    console.log("7702 stub");
    return false;
  }

  // Anything else is a normal contract
  return true;
}
