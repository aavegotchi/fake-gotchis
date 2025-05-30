import { varsForNetwork } from "../../constants";
import { ethers } from "hardhat";
import { MetadataStructOutput } from "../../typechain-types/contracts/FakeGotchisNFTDiamond/facets/MetaDataFacet.sol/MetadataFacet";
import fs from "fs";
import { fgNFTsDir } from "./getFakeGotchisCardAndNFTData";

interface Metadata {
  publisher: string;
  royalty: [number, number];
  editions: number;
  flagCount: number;
  likeCount: number;
  artist: string;
  createdAt: number;
  status: number;
  minted: boolean;
  name: string;
  description: string;
  externalLink: string;
  artistName: string;
  publisherName: string;
  fileHash: string;
  fileType: string;
  thumbnailHash: string;
  thumbnailType: string;
}

interface MetadataMap {
  [key: number]: Metadata;
}

function mapMetadataToInterface(
  metadata: MetadataStructOutput,
  id: number
): [number, Metadata] {
  return [
    id,
    {
      publisher: metadata[0],
      royalty: metadata[1],
      editions: metadata[2],
      flagCount: metadata[3],
      likeCount: metadata[4],
      artist: metadata[5],
      createdAt: metadata[6],
      status: metadata[7],
      minted: metadata[8],
      name: metadata[9],
      description: metadata[10],
      externalLink: metadata[11],
      artistName: metadata[12],
      publisherName: metadata[13],
      fileHash: metadata[14],
      fileType: metadata[15],
      thumbnailHash: metadata[16],
      thumbnailType: metadata[17],
    },
  ];
}

async function fetchMetadataBatch(
  metadataFacet: any,
  start: number,
  size: number
) {
  const ids = Array.from({ length: size }, (_, j) => start + j);
  const batch = await metadataFacet.getMetadataBatch(ids);
  return batch.map((metadata: MetadataStructOutput, index: number) =>
    mapMetadataToInterface(metadata, ids[index])
  );
}

async function main() {
  console.log("Starting metadata fetch...");

  const c = await varsForNetwork(ethers);
  const METADATA_FILE = `${fgNFTsDir}/gotchiNFTMetadata.json`;

  const metadataFacet = await ethers.getContractAt(
    "MetadataFacet",
    c.fakeGotchiArt
  );

  const batchSize = 200;
  const counter = (await metadataFacet.getMetadataIdCounter()).toNumber();
  const totalBatches = Math.ceil(counter / batchSize);
  const lastBatchSize = counter % batchSize || batchSize;

  console.log(`Found ${counter} total metadata entries`);
  console.log(
    `Will fetch in ${totalBatches} batches of ${batchSize} (last batch: ${lastBatchSize})`
  );

  const metadataMap: MetadataMap = {};

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize + 1;
    const currentBatchSize = i === totalBatches - 1 ? lastBatchSize : batchSize;
    console.log(
      `Fetching batch ${i + 1}/${totalBatches} (IDs ${start} to ${
        start + currentBatchSize - 1
      })`
    );

    const batchResults = await fetchMetadataBatch(
      metadataFacet,
      start,
      currentBatchSize
    );
    batchResults.forEach(([id, metadata]: [number, Metadata]) => {
      metadataMap[id] = metadata;
    });
  }

  console.log("\nFetching on-chain metadata order for all tokens...");
  const erc1155Facet = await ethers.getContractAt(
    "FakeGotchisNFTFacet",
    c.fakeGotchiArt
  );

  const totalSupplyBN = await erc1155Facet.totalSupply();
  const totalSupply = totalSupplyBN.toNumber();
  console.log(`Fetching metadata IDs for ${totalSupply} tokens`);

  // Get metadataId for each token ID (from 1 to totalSupply)
  // Note: Smart contract functions usually return BigNumber, so conversion to number is needed.
  const allOnChainMetadataIds_BN = await metadataFacet.batchGetMetadata(
    Array.from({ length: totalSupply }, (_, i) => i + 1)
  );
  const allOnChainMetadataIds = allOnChainMetadataIds_BN.map((idBN) =>
    idBN.toNumber()
  );

  console.log("Filtering metadata IDs to get unique, ordered sequence...");
  const uniqueOrderedMetadataIds: number[] = [];
  if (allOnChainMetadataIds.length > 0) {
    uniqueOrderedMetadataIds.push(allOnChainMetadataIds[0]);
    for (let idx = 1; idx < allOnChainMetadataIds.length; idx++) {
      if (allOnChainMetadataIds[idx] !== allOnChainMetadataIds[idx - 1]) {
        uniqueOrderedMetadataIds.push(allOnChainMetadataIds[idx]);
      }
    }
  }
  console.log(uniqueOrderedMetadataIds);
  console.log(
    `Found ${uniqueOrderedMetadataIds.length} unique metadata IDs in the on-chain sequence.`
  );

  // Prepare the final data for JSON: an array of [id, metadata] pairs, ordered by uniqueOrderedMetadataIds
  const orderedMetadataArray: Array<[number, Metadata]> = [];
  for (const id of uniqueOrderedMetadataIds) {
    const metadata = metadataMap[id];
    if (metadata) {
      orderedMetadataArray.push([id, metadata]);
    } else {
      // This case should ideally not happen if metadataMap was populated correctly for all IDs in allOnChainMetadataIds
      console.warn(
        `Warning: Metadata ID ${id} from unique ordered list not found in fetched metadataMap. This item will be skipped.`
      );
    }
  }

  console.log("\nWriting ordered metadata array to file...");
  fs.writeFileSync(
    METADATA_FILE,
    JSON.stringify(orderedMetadataArray, null, 2)
  );
  console.log("Done!");
}

main();
