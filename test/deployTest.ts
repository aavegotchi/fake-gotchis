import {
  impersonate,
  maticAavegotchiDiamondAddress,
} from "../scripts/helperFunctions";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamonds } from "../scripts/deployDiamonds";
import { BigNumberish, Signer } from "ethers";
import {
  FakeGotchiCardFacet,
  FakeGotchiNFTFacet,
  MetadataFacet,
} from "../typechain-types";
import { PromiseOrValue } from "../typechain-types/common";

describe("Deploy tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const cardCount = 2535;
  const testCardBalance = 1000;
  let cardFacet: FakeGotchiCardFacet;
  let nftFacet: FakeGotchiNFTFacet;
  let metadataFacet: MetadataFacet;
  let metadataFacetWithOwner: MetadataFacet;
  let metadataFacetWithUser: MetadataFacet;
  let accounts: Signer[];
  let cardSeriesId: any;

  before(async function () {
    this.timeout(20000000);

    const { cardDiamond, nftDiamond } = await deployDiamonds();

    accounts = await ethers.getSigners();
    const owner = await accounts[0].getAddress();

    cardFacet = (await ethers.getContractAt(
      "FakeGotchiCardFacet",
      cardDiamond
    )) as FakeGotchiCardFacet;

    nftFacet = (await ethers.getContractAt(
      "FakeGotchiNFTFacet",
      nftDiamond
    )) as FakeGotchiNFTFacet;

    metadataFacet = (await ethers.getContractAt(
      "MetadataFacet",
      nftDiamond
    )) as MetadataFacet;

    metadataFacetWithOwner = await impersonate(
      owner,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithUser = await impersonate(
      testAddress,
      metadataFacet,
      ethers,
      network
    );
  });

  it("Start new card series", async function () {
    const receipt = await (await cardFacet.startNewSeries(cardCount)).wait();
    const event = receipt!.events!.find(
      (event) => event.event === "NewSeriesStarted"
    );
    cardSeriesId = event!.args!.id;
    expect(cardCount).to.equal(event!.args!.amount);

    await (await cardFacet.sale(testAddress, testCardBalance)).wait();
    const cardBalance = await cardFacet.balanceOf(testAddress, cardSeriesId);
    expect(testCardBalance).to.equal(cardBalance);
  });

  it("Add, approve and mint metadata", async function () {
    const count = 200;
    const mData = {
      fileHash: "qwertyqwertyqwertyqwertyqwertyqw", //32 bytes
      name: ethers.utils.formatBytes32String("qwertyqwertyqwertyqwerty1"), //25 bytes
      publisher: testAddress,
      publisherName:
        "qwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwerty", //72 bytes
      externalLink:
        "qwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwerty", // 240bytes
      description:
        "qwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwerty", // 120bytes
      artist: ethers.constants.AddressZero,
      artistName:
        "qwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwertyqwerty", //72 bytes,
      royalty: [100, 0] as [
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BigNumberish>
      ],
      rarity: 500,
    };
    let receipt = await (
      await metadataFacetWithUser.addMetadata(mData, count)
    ).wait();
    let event = receipt!.events!.find(
      (event) => event.event === "MetadataActionLog"
    );
    const metadataId = event!.args!.id;
    expect(event!.args!.status).to.equal(0);

    receipt = await (
      await metadataFacetWithOwner.approveMetadata(metadataId)
    ).wait();
    event = receipt!.events!.find(
      (event) => event.event === "MetadataActionLog"
    );
    expect(event!.args!.status).to.equal(1);

    await (await metadataFacetWithUser.mint(metadataId)).wait();

    const balance = await nftFacet.balanceOf(testAddress);
    expect(balance).to.equal(count);
    const cardBalance = await cardFacet.balanceOf(testAddress, cardSeriesId);
    expect(cardBalance).to.equal(testCardBalance - count);
  });
});
