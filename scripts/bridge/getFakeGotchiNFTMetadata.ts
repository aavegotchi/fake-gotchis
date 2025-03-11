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

  console.log("Writing metadata to file...");
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadataMap, null, 2));
  console.log("Done!");
}

main();
