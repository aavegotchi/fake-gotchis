import { impersonate } from "../scripts/helperFunctions";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamonds } from "../scripts/deployDiamonds";
import { BigNumberish, Signer } from "ethers";
import {
  FakeGotchisCardFacet,
  FakeGotchisNFTFacet,
  MetadataFacet,
} from "../typechain-types";
import { PromiseOrValue } from "../typechain-types/common";

describe("Deploy tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const cardCount = 2535;
  const testCardBalance = 1000;
  let fakeGotchisCardDiamond: any;
  let fakeGotchisNftDiamond: any;
  let cardFacet: FakeGotchisCardFacet;
  let nftFacet: FakeGotchisNFTFacet;
  let metadataFacet: MetadataFacet;
  let metadataFacetWithOwner: MetadataFacet;
  let metadataFacetWithUser: MetadataFacet;
  let accounts: Signer[];
  let cardSeriesId: any;

  before(async function () {
    this.timeout(20000000);

    const diamonds = await deployDiamonds();
    fakeGotchisCardDiamond = diamonds.fakeGotchisCardDiamond;
    fakeGotchisNftDiamond = diamonds.fakeGotchisNftDiamond;

    accounts = await ethers.getSigners();
    const owner = await accounts[0].getAddress();

    cardFacet = (await ethers.getContractAt(
      "FakeGotchisCardFacet",
      fakeGotchisCardDiamond
    )) as FakeGotchisCardFacet;

    nftFacet = (await ethers.getContractAt(
      "FakeGotchisNFTFacet",
      fakeGotchisNftDiamond
    )) as FakeGotchisNFTFacet;

    metadataFacet = (await ethers.getContractAt(
      "MetadataFacet",
      fakeGotchisNftDiamond
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

    await (
      await cardFacet.safeTransferFromDiamond(
        testAddress,
        cardSeriesId,
        testCardBalance,
        []
      )
    ).wait();
    const cardBalance = await cardFacet.balanceOf(testAddress, cardSeriesId);
    expect(testCardBalance).to.equal(cardBalance);
  });

  it("Add, approve and mint metadata", async function () {
    const count = 200;
    const mData = {
      fileHash: "q".repeat(32), // 32 bytes
      name: ethers.utils.formatBytes32String("w".repeat(25)), // 25 bytes
      publisher: testAddress,
      publisherName: "e".repeat(72), // 72 bytes
      externalLink: "r".repeat(240), // 240 bytes
      description: "t".repeat(120), // 120 bytes
      artist: ethers.constants.AddressZero,
      artistName: "y".repeat(72), // 72 bytes,
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
