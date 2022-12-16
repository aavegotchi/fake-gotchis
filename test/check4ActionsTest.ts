import { impersonate } from "../scripts/helperFunctions";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer } from "ethers";
import {
  FakeGotchisCardFacet,
  MetadataFacet,
  OwnershipFacet,
} from "../typechain-types";
import { upgrade } from "../scripts/nft/upgrades/upgrade-metadataFacet";
import { varsForNetwork } from "../constants";

describe("Fake Gotchis tests", async function () {
  // contracts, contract addressees, signers
  let fakeGotchisCardDiamond: any;
  let fakeGotchisNftDiamond: any;
  let cardFacet: FakeGotchisCardFacet;
  let metadataFacet: MetadataFacet;
  let cardFacetWithOwner: FakeGotchisCardFacet;
  let metadataFacetWithUser: MetadataFacet;
  let metadataFacetWithFGCardHolder: MetadataFacet;
  let metadataFacetWithGHSTHolder: MetadataFacet;
  let metadataFacetWithGotchiOwner: MetadataFacet;
  let metadataFacetWithGotchiRenter: MetadataFacet;
  let metadataFacetWithNonActableUser: MetadataFacet;
  const metadataId = 177;
  let ownerAddress: any;
  let user: Signer; // FG Card Owner
  let userAddress: any;
  let artistAddress: any;

  // test accounts for flag for like metadata
  const gotchiOwnerAddress = "0x0757153A8f90bdC50dC60b3F512df15D934e9832"; // gotchi owner, but hold less than 100 GHST
  const gotchiRenterAddress = "0xD6CCE2Fb2d584f7867AF837A38537C855f1701aa"; // gotchi renter, not owner
  const ghstHolderAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d"; // hold 100+ GHST, but not gotchi owner
  const fgCardHolderAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d"; // fakegotchi card holder, but not gotchi owner and 100+ GHST holder

  before(async function () {
    this.timeout(20000000);

    await upgrade();

    const c = await varsForNetwork(ethers);
    let ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      c.fakeGotchiArt
    )) as OwnershipFacet;

    ownerAddress = await ownershipFacet.owner();
    console.log("owner", ownerAddress);

    fakeGotchisCardDiamond = c.fakeGotchiCards;
    fakeGotchisNftDiamond = c.fakeGotchiArt;

    const signers = await ethers.getSigners();
    user = signers[0];
    const artist = signers[1];
    userAddress = await user.getAddress();
    artistAddress = await artist.getAddress();

    cardFacet = (await ethers.getContractAt(
      "FakeGotchisCardFacet",
      fakeGotchisCardDiamond
    )) as FakeGotchisCardFacet;

    metadataFacet = (await ethers.getContractAt(
      "MetadataFacet",
      fakeGotchisNftDiamond
    )) as MetadataFacet;

    cardFacetWithOwner = await impersonate(
      ownerAddress,
      cardFacet,
      ethers,
      network
    );
    metadataFacetWithUser = await impersonate(
      userAddress,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithFGCardHolder = await impersonate(
      fgCardHolderAddress,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithGotchiOwner = await impersonate(
      gotchiOwnerAddress,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithGotchiRenter = await impersonate(
      gotchiRenterAddress,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithGHSTHolder = await impersonate(
      ghstHolderAddress,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithNonActableUser = await impersonate(
      artistAddress,
      metadataFacet,
      ethers,
      network
    );
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [fgCardHolderAddress, "0x100000000000000000000000"],
    });
  });

  describe("Test checkForActions updates", async function () {
    describe("flag", async function () {
      it("Should succeed if fake gotchi card holder flag pending metadata with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevFlagCount = savedMetaData.flagCount;
        let receipt = await (
          await metadataFacetWithFGCardHolder.flag(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataFlag"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.status).to.equal(0);
        expect(savedMetaData.flagCount).to.equal(prevFlagCount + 1);
      });
      it("Should succeed if aavegotchi owner flag pending metadata with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevFlagCount = savedMetaData.flagCount;
        let receipt = await (
          await metadataFacetWithGotchiOwner.flag(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataFlag"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.status).to.equal(0);
        expect(savedMetaData.flagCount).to.equal(prevFlagCount + 1);
      });
      it("Should succeed if 100+ GHST holder flag pending metadata with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevFlagCount = savedMetaData.flagCount;
        let receipt = await (
          await metadataFacetWithGHSTHolder.flag(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataFlag"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.status).to.equal(0);
        expect(savedMetaData.flagCount).to.equal(prevFlagCount + 1);
      });
      it("Should revert if aavegotchi renter", async function () {
        await expect(
          metadataFacetWithGotchiRenter.flag(metadataId)
        ).to.be.revertedWith(
          "MetadataFacet: Should own a Fake Gotchi NFT or an aavegotchi or 100 GHST"
        );
      });
      it("Should revert if non flaggable user", async function () {
        await expect(
          metadataFacetWithNonActableUser.flag(metadataId)
        ).to.be.revertedWith(
          "MetadataFacet: Should own a Fake Gotchi NFT or an aavegotchi or 100 GHST"
        );
      });
    });
    describe("like", async function () {
      it("Should succeed if fake gotchi card holder like with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevLikeCount = savedMetaData.likeCount;
        let receipt = await (
          await metadataFacetWithFGCardHolder.like(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataLike"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.likeCount).to.equal(prevLikeCount + 1);
      });
      it("Should succeed if aavegotchi owner like with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevLikeCount = savedMetaData.likeCount;
        let receipt = await (
          await metadataFacetWithGotchiOwner.like(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataLike"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.likeCount).to.equal(prevLikeCount + 1);
      });
      it("Should succeed if 100+ GHST holder like with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevLikeCount = savedMetaData.likeCount;
        let receipt = await (
          await metadataFacetWithGHSTHolder.like(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataLike"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.likeCount).to.equal(prevLikeCount + 1);
      });
      it("Should revert if aavegotchi renter", async function () {
        await expect(
          metadataFacetWithGotchiRenter.like(metadataId)
        ).to.be.revertedWith(
          "MetadataFacet: Should own a Fake Gotchi NFT or an aavegotchi or 100 GHST"
        );
      });
      it("Should revert if non likeable user", async function () {
        await expect(
          metadataFacetWithNonActableUser.like(metadataId)
        ).to.be.revertedWith(
          "MetadataFacet: Should own a Fake Gotchi NFT or an aavegotchi or 100 GHST"
        );
      });
    });
  });
});
