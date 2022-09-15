import {
  ghstAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
} from "../scripts/helperFunctions";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, BigNumberish, Signer, utils } from "ethers";
import { deployDiamonds } from "../scripts/deployDiamonds";
import {
  FakeGotchisCardFacet,
  FakeGotchisNFTFacet,
  MetadataFacet,
} from "../typechain-types";
import { PromiseOrValue } from "../typechain-types/common";

describe("Fake Gotchis tests", async function () {
  // contracts, contract addressees, signers
  let fakeGotchisCardDiamond: any;
  let fakeGotchisNftDiamond: any;
  let cardFacet: FakeGotchisCardFacet;
  let nftFacet: FakeGotchisNFTFacet;
  let metadataFacet: MetadataFacet;
  let cardFacetWithOwner: FakeGotchisCardFacet;
  let cardFacetWithUser: FakeGotchisCardFacet;
  let metadataFacetWithOwner: MetadataFacet;
  let metadataFacetWithUser: MetadataFacet;
  let metadataFacetWithUser2: MetadataFacet;
  let metadataFacetWithUser3: MetadataFacet;
  let nftFacetWithOwner: FakeGotchisNFTFacet;
  let nftFacetWithUser: FakeGotchisNFTFacet;
  let nftFacetWithUser2: FakeGotchisNFTFacet;
  let cardSeriesId: BigNumber;
  let owner: Signer;
  let ownerAddress: any;
  let user: Signer; // FG Card Owner
  let userAddress: any;
  let user2: Signer; // FG Card Owner
  let user2Address: any;
  let user3: Signer; // FG Card Owner
  let user3Address: any;
  let artistAddress: any;

  // card test data
  const cardCount = 2535;
  const cardBaseURI = "https://aavegotchi.com/metadata/cards/";
  const cardTransferAmount = 100;
  const cardTransferAmount2 = 10;

  // test metadata
  const mDataCount = 10;
  const totalSupply = mDataCount;
  const fileHash = "q".repeat(32); // 32 bytes
  const name = "w".repeat(50); // 50 bytes
  const publisherName = "e".repeat(30); // 30 bytes
  const externalLink = "r".repeat(240); // 240 bytes
  const description = "t".repeat(120); // 120 bytes
  const artistName = "y".repeat(30); // 30 bytes
  let metaData: any;

  // test accounts for flag for like metadata
  const gotchiOwnerAddress = "0xbC1443c470c6130ed1052748e179fd313E5f20F4"; // gotchi owner, but hold less than 100 GHST
  const gotchiOwnerAddress2 = "0xa5Fa57608C5698120A7C3c9d50EC346bb3980223"; // gotchi owner, but hold less than 100 GHST
  const ghstHolderAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d"; // hold 100+ GHST, but not gotchi owner
  const ghstHolderAddress2 = "0x18d8646530dABe8F93B89282af161fAe03896638"; // hold 100+ GHST, but not gotchi owner
  const moreCardHolders: PromiseOrValue<string>[] = []; // length: 4
  const moreFlaggableUsers = [gotchiOwnerAddress2, ghstHolderAddress2]; // length: 6

  before(async function () {
    this.timeout(20000000);

    const diamonds = await deployDiamonds();
    fakeGotchisCardDiamond = diamonds.fakeGotchisCardDiamond;
    fakeGotchisNftDiamond = diamonds.fakeGotchisNftDiamond;

    const signers = await ethers.getSigners();
    owner = signers[0];
    user = signers[1];
    user2 = signers[2];
    user3 = signers[3];
    const artist = signers[9];
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();
    user3Address = await user3.getAddress();
    artistAddress = await artist.getAddress();
    for (let i = 5; i < 9; i++) {
      const flaggableAccount = signers[i];
      const flaggableAddress = await flaggableAccount.getAddress();
      moreCardHolders.push(flaggableAddress);
      moreFlaggableUsers.push(flaggableAddress);
    }

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

    cardFacetWithOwner = await impersonate(
      ownerAddress,
      cardFacet,
      ethers,
      network
    );
    cardFacetWithUser = await impersonate(
      userAddress,
      cardFacet,
      ethers,
      network
    );
    metadataFacetWithOwner = await impersonate(
      ownerAddress,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithUser = await impersonate(
      userAddress,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithUser2 = await impersonate(
      user2Address,
      metadataFacet,
      ethers,
      network
    );
    metadataFacetWithUser3 = await impersonate(
      user3Address,
      metadataFacet,
      ethers,
      network
    );
    nftFacetWithOwner = await impersonate(
      ownerAddress,
      nftFacet,
      ethers,
      network
    );
    nftFacetWithUser = await impersonate(
      userAddress,
      nftFacet,
      ethers,
      network
    );
    nftFacetWithUser2 = await impersonate(
      user2Address,
      nftFacet,
      ethers,
      network
    );

    metaData = {
      fileHash,
      name,
      publisherName,
      externalLink,
      description,
      artistName,
      publisher: userAddress,
      artist: artistAddress,
      royalty: [9000, 1000] as [
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BigNumberish>
      ],
      rarity: 500,
    };
  });

  describe("FakeGotchisCardFacet", async function () {
    describe("startNewSeries", async function () {
      it("Should revert if invalid diamond owner", async function () {
        await expect(
          cardFacetWithUser.startNewSeries(cardCount)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should revert if invalid card amount", async function () {
        await expect(cardFacetWithOwner.startNewSeries(0)).to.be.revertedWith(
          "FGCard: Max amount must be greater than 0"
        );
      });
      it("Should succeed if owner try with valid card amount", async function () {
        const receipt = await (
          await cardFacetWithOwner.startNewSeries(cardCount)
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "NewSeriesStarted"
        );
        cardSeriesId = event!.args!.id;
        expect(event!.args!.amount).to.equal(cardCount);
      });
    });
    describe("setBaseURI", async function () {
      it("Should revert if invalid diamond owner", async function () {
        await expect(
          cardFacetWithUser.setBaseURI(cardBaseURI)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should set base URI for all series if valid diamond owner", async function () {
        const topic = utils.id("URI(string,uint256)");
        const receipt = await (
          await cardFacetWithOwner.setBaseURI(cardBaseURI)
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.topics && event.topics[0] === topic
        );
        expect(event!.address).to.equal(fakeGotchisCardDiamond);
      });
    });
    describe("uri", async function () {
      it("Should revert if invalid id", async function () {
        await expect(
          cardFacetWithOwner.uri(cardSeriesId.add(1))
        ).to.be.revertedWith("FGCard: Card _id not found");
      });
      it("Should return if valid id", async function () {
        const uri = await cardFacetWithOwner.uri(cardSeriesId);
        expect(uri).to.equal(`${cardBaseURI}${cardSeriesId}`);
      });
    });
    describe("balanceOf", async function () {
      it("Should return 0 if invalid id", async function () {
        const balance = await cardFacetWithUser.balanceOf(
          ownerAddress,
          cardSeriesId.add(1)
        );
        expect(balance).to.equal(0);
      });
      it("Should return 0 if have no cards", async function () {
        const balance = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        expect(balance).to.equal(0);
      });
      it("Should return balance if have cards", async function () {
        const balance = await cardFacetWithUser.balanceOf(
          ownerAddress,
          cardSeriesId
        );
        expect(balance).to.equal(cardCount);
      });
    });
    describe("balanceOfBatch", async function () {
      it("Should revert if array length not matched", async function () {
        await expect(
          cardFacetWithOwner.balanceOfBatch(
            [ownerAddress],
            [cardSeriesId, cardSeriesId]
          )
        ).to.be.revertedWith("FGCard: _owners length not same as _ids length");
      });
      it("Should return correct balance", async function () {
        const balances = await cardFacetWithUser.balanceOfBatch(
          [ownerAddress, ownerAddress, userAddress, fakeGotchisCardDiamond],
          [cardSeriesId.add(1), cardSeriesId, cardSeriesId, cardSeriesId]
        );
        expect(balances[0]).to.equal(0);
        expect(balances[1]).to.equal(cardCount);
        expect(balances[2]).to.equal(0);
        expect(balances[3]).to.equal(0);
      });
    });
    describe("safeTransferFrom", async function () {
      it("Should revert if not card owner or approved account", async function () {
        await expect(
          cardFacetWithOwner.safeTransferFrom(
            userAddress,
            ownerAddress,
            cardSeriesId,
            1,
            []
          )
        ).to.be.revertedWith("FGCard: Not owner and not approved to transfer");
      });
      describe("Param validation (_safeTransferFrom)", async function () {
        it("Should revert if _to is zero address", async function () {
          await expect(
            cardFacetWithUser.safeTransferFrom(
              userAddress,
              ethers.constants.AddressZero,
              cardSeriesId,
              1,
              []
            )
          ).to.be.revertedWith("FGCard: Can't transfer to 0 address");
        });
        it("Should revert if not enough balance or invalid id", async function () {
          await expect(
            cardFacetWithUser.safeTransferFrom(
              userAddress,
              ownerAddress,
              cardSeriesId,
              cardCount + 1,
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
          await expect(
            cardFacetWithUser.safeTransferFrom(
              userAddress,
              ownerAddress,
              cardSeriesId.add(1),
              1,
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
        });
      });
      it("Should transfer from diamond if valid diamond owner and params", async function () {
        const balanceOwnerBefore = await cardFacetWithUser.balanceOf(
          ownerAddress,
          cardSeriesId
        );
        const balanceUserBefore = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        const topic = utils.id(
          "TransferSingle(address,address,address,uint256,uint256)"
        );
        const receipt = await (
          await cardFacetWithOwner.safeTransferFrom(
            ownerAddress,
            userAddress,
            cardSeriesId,
            cardTransferAmount,
            []
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.topics && event.topics[0] === topic
        );
        expect(event!.address).to.equal(fakeGotchisCardDiamond);
        const balanceOwnerAfter = await cardFacetWithUser.balanceOf(
          ownerAddress,
          cardSeriesId
        );
        const balanceUserAfter = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        expect(balanceOwnerAfter.add(cardTransferAmount)).to.equal(
          balanceOwnerBefore
        );
        expect(balanceUserBefore.add(cardTransferAmount)).to.equal(
          balanceUserAfter
        );
      });
    });
    describe("safeBatchTransferFrom", async function () {
      it("Should revert if not card owner or approved account", async function () {
        await expect(
          cardFacetWithOwner.safeBatchTransferFrom(
            userAddress,
            ownerAddress,
            [cardSeriesId],
            [1],
            []
          )
        ).to.be.revertedWith("FGCard: Not owner and not approved to transfer");
      });
      describe("Param validation (_safeBatchTransferFrom)", async function () {
        it("Should revert if array length not matched", async function () {
          await expect(
            cardFacetWithUser.safeBatchTransferFrom(
              userAddress,
              ownerAddress,
              [cardSeriesId],
              [1, 1],
              []
            )
          ).to.be.revertedWith("FGCard: ids not same length as amounts");
        });
        it("Should revert if _to is zero address", async function () {
          await expect(
            cardFacetWithUser.safeBatchTransferFrom(
              userAddress,
              ethers.constants.AddressZero,
              [cardSeriesId],
              [1],
              []
            )
          ).to.be.revertedWith("FGCard: Can't transfer to 0 address");
        });
        it("Should revert if not enough balance or invalid id", async function () {
          await expect(
            cardFacetWithUser.safeBatchTransferFrom(
              userAddress,
              ownerAddress,
              [cardSeriesId],
              [cardCount + 1],
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
          await expect(
            cardFacetWithUser.safeBatchTransferFrom(
              userAddress,
              ownerAddress,
              [cardSeriesId.add(1)],
              [1],
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
        });
      });
      it("Should transfer from diamond if valid diamond owner and params", async function () {
        const balanceOwnerBefore = await cardFacetWithUser.balanceOf(
          ownerAddress,
          cardSeriesId
        );
        const balanceUserBefore = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        const topic = utils.id(
          "TransferBatch(address,address,address,uint256[],uint256[])"
        );
        const receipt = await (
          await cardFacetWithUser.safeBatchTransferFrom(
            userAddress,
            ownerAddress,
            [cardSeriesId],
            [cardTransferAmount2],
            []
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.topics && event.topics[0] === topic
        );
        expect(event!.address).to.equal(fakeGotchisCardDiamond);
        const balanceOwnerAfter = await cardFacetWithUser.balanceOf(
          ownerAddress,
          cardSeriesId
        );
        const balanceUserAfter = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        expect(balanceOwnerBefore.add(cardTransferAmount2)).to.equal(
          balanceOwnerAfter
        );
        expect(balanceUserAfter.add(cardTransferAmount2)).to.equal(
          balanceUserBefore
        );
      });
    });
    describe("setAavegotchiAddress", async function () {
      it("Should revert if not diamond owner", async function () {
        await expect(
          cardFacetWithUser.setAavegotchiAddress(maticAavegotchiDiamondAddress)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should set aavegotchi diamond address if diamond owner", async function () {
        const receipt = await (
          await cardFacetWithOwner.setAavegotchiAddress(
            maticAavegotchiDiamondAddress
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "AavegotchiAddressUpdated"
        );
        expect(event!.args!._aavegotchiDiamond).to.equal(
          maticAavegotchiDiamondAddress
        );
      });
    });
    describe("setFakeGotchisNftAddress", async function () {
      it("Should revert if not diamond owner", async function () {
        await expect(
          cardFacetWithUser.setFakeGotchisNftAddress(fakeGotchisNftDiamond)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should set fake gotchi nft diamond address if diamond owner", async function () {
        const receipt = await (
          await cardFacetWithOwner.setFakeGotchisNftAddress(
            fakeGotchisNftDiamond
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "FakeGotchisNftAddressUpdated"
        );
        expect(event!.args!._fakeGotchisNftDiamond).to.equal(
          fakeGotchisNftDiamond
        );
      });
    });
    describe("burn", async function () {
      it("Should revert if not nft diamond", async function () {
        await expect(
          cardFacetWithOwner.burn(fakeGotchisCardDiamond, cardSeriesId, 1)
        ).to.be.revertedWith("LibDiamond: Must be NFT diamond");
        await expect(
          cardFacetWithUser.burn(userAddress, cardSeriesId, 1)
        ).to.be.revertedWith("LibDiamond: Must be NFT diamond");
      });
      // Note: Success case included in addMetadata() test
    });
  });

  describe("MetadataFacet", async function () {
    let metadataId: BigNumber;
    let declinedMetadataId: BigNumber;
    describe("addMetadata", async function () {
      // Note: Checking blocked sender case included declineMetadata() test
      it("Should revert if publisher is zero address", async function () {
        const testMetaData = {
          ...metaData,
          publisher: ethers.constants.AddressZero,
        };
        await expect(
          metadataFacetWithUser.addMetadata(
            testMetaData,
            cardSeriesId,
            mDataCount
          )
        ).to.be.revertedWith("Metadata: Publisher cannot be zero address");
      });
      it("Should revert if file hash not exist", async function () {
        const testMetaData = {
          ...metaData,
          fileHash: "",
        };
        await expect(
          metadataFacetWithUser.addMetadata(
            testMetaData,
            cardSeriesId,
            mDataCount
          )
        ).to.be.revertedWith("Metadata: File hash should exist");
      });
      it("Should revert if description length exceeds max (120 bytes)", async function () {
        const testMetaData = {
          ...metaData,
          description: "q".repeat(121),
        };
        await expect(
          metadataFacetWithUser.addMetadata(
            testMetaData,
            cardSeriesId,
            mDataCount
          )
        ).to.be.revertedWith("Metadata: Max description length is 120 bytes");
      });
      it("Should revert if sum of royalty splits not 10000", async function () {
        const testMetaData = {
          ...metaData,
          royalty: [50, 49],
        };
        await expect(
          metadataFacetWithUser.addMetadata(
            testMetaData,
            cardSeriesId,
            mDataCount
          )
        ).to.be.revertedWith("Metadata: Sum of royalty splits not 10000");
      });
      it("Should revert if artist royalty split is not 0 for zero address", async function () {
        const testMetaData = {
          ...metaData,
          royalty: [5000, 5000],
          artist: ethers.constants.AddressZero,
        };
        await expect(
          metadataFacetWithUser.addMetadata(
            testMetaData,
            cardSeriesId,
            mDataCount
          )
        ).to.be.revertedWith(
          "Metadata: Artist royalty split must be 0 with zero address"
        );
      });
      it("Should revert if invalid rarity value", async function () {
        const testMetaData = {
          ...metaData,
          rarity: 0,
        };
        await expect(
          metadataFacetWithUser.addMetadata(
            testMetaData,
            cardSeriesId,
            mDataCount
          )
        ).to.be.revertedWith("Metadata: Invalid rarity value");
      });
      it("Should revert if invalid mint amount", async function () {
        await expect(
          metadataFacetWithUser.addMetadata(metaData, cardSeriesId, 0)
        ).to.be.revertedWith("Metadata: Invalid mint amount");
      });
      it("Should revert if not enough card for mint", async function () {
        const cardBalance = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        await expect(
          metadataFacetWithUser.addMetadata(
            metaData,
            cardSeriesId,
            cardBalance.add(1)
          )
        ).to.be.reverted;
        await expect(
          metadataFacetWithUser.addMetadata(metaData, cardSeriesId.add(1), 1)
        ).to.be.reverted;
      });
      it("Should succeed if all params are valid and have enough cards", async function () {
        const cardBalanceBefore = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        const receipt = await (
          await metadataFacetWithUser.addMetadata(
            metaData,
            cardSeriesId,
            mDataCount
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "MetadataActionLog"
        );
        metadataId = event!.args!.id;
        expect(event!.args!.sender).to.equal(userAddress);
        expect(event!.args!.fileHash).to.equal(metaData.fileHash);
        expect(event!.args!.publisher).to.equal(metaData.publisher);
        expect(event!.args!.status).to.equal(0);
        const cardBalanceAfter = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        expect(cardBalanceAfter.add(mDataCount)).to.equal(cardBalanceBefore);
      });
    });
    describe("getMetadata", async function () {
      it("Should revert if invalid id", async function () {
        await expect(
          metadataFacetWithUser.getMetadata(metadataId.add(100))
        ).to.be.revertedWith("Metadata: Invalid metadata id");
        await expect(metadataFacetWithUser.getMetadata(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
      });
      it("Should return if valid id", async function () {
        const savedMetaData = await metadataFacetWithUser.getMetadata(
          metadataId
        );
        expect(savedMetaData.fileHash).to.equal(metaData.fileHash);
        expect(savedMetaData.publisher).to.equal(metaData.publisher);
        expect(savedMetaData.artist).to.equal(metaData.artist);
        expect(savedMetaData.artistName).to.equal(metaData.artistName);
        expect(savedMetaData.description).to.equal(metaData.description);
      });
    });
    describe("declineMetadata", async function () {
      it("Should revert if invalid diamond owner", async function () {
        await expect(
          metadataFacetWithUser.declineMetadata(metadataId, false)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should revert if invalid id", async function () {
        await expect(
          metadataFacetWithOwner.declineMetadata(metadataId.add(100), false)
        ).to.be.revertedWith("Metadata: Invalid metadata id");
        await expect(
          metadataFacetWithOwner.declineMetadata(0, false)
        ).to.be.revertedWith("Metadata: Invalid metadata id");
      });
      it("Should succeed if valid id and not declined", async function () {
        let receipt = await (
          await metadataFacetWithUser.addMetadata(
            metaData,
            cardSeriesId,
            mDataCount
          )
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataActionLog"
        );
        declinedMetadataId = event!.args!.id;
        receipt = await (
          await metadataFacetWithOwner.declineMetadata(
            declinedMetadataId,
            false
          )
        ).wait();
        event = receipt!.events!.find(
          (event) => event.event === "MetadataActionLog"
        );
        expect(event!.args!.sender).to.equal(userAddress);
        expect(event!.args!.fileHash).to.equal(metaData.fileHash);
        expect(event!.args!.publisher).to.equal(metaData.publisher);
        expect(event!.args!.status).to.equal(3);
      });
      describe("Blocking bad faith account", async function () {
        it("Should revert if bad faith user try to add Metadata", async function () {
          // Get card
          await (
            await cardFacetWithOwner.safeTransferFrom(
              ownerAddress,
              user2Address,
              cardSeriesId,
              cardTransferAmount,
              []
            )
          ).wait();
          // add metadata
          let receipt = await (
            await metadataFacetWithUser2.addMetadata(metaData, cardSeriesId, 1)
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "MetadataActionLog"
          );
          const tmpMetadataId = event!.args!.id;
          // owner block the account as bad faith
          await (
            await metadataFacetWithOwner.declineMetadata(tmpMetadataId, true)
          ).wait();
          // bad faith account try to add metadata again
          await expect(
            metadataFacetWithUser2.addMetadata(metaData, cardSeriesId, 1)
          ).to.be.revertedWith("Metadata: Blocked address");
        });
      });
      // Note: Case for decline approved data included in mint() test
    });
    describe("flag", async function () {
      let metadataFacetWithGHSTHolder: MetadataFacet;
      let metadataFacetWithGotchiOwner: MetadataFacet;
      let metadataFacetWithNotFlaggableUser: MetadataFacet;
      before(async function () {
        metadataFacetWithGotchiOwner = await impersonate(
          gotchiOwnerAddress,
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
        // transfer fake gotchi card to users
        await (
          await cardFacetWithOwner.safeTransferFrom(
            ownerAddress,
            user3Address,
            cardSeriesId,
            cardTransferAmount,
            []
          )
        ).wait();
        for (let i = 0; i < moreCardHolders.length; i++) {
          await (
            await cardFacetWithOwner.safeTransferFrom(
              ownerAddress,
              moreCardHolders[i],
              cardSeriesId,
              5,
              []
            )
          ).wait();
        }
        metadataFacetWithNotFlaggableUser = await impersonate(
          artistAddress,
          metadataFacet,
          ethers,
          network
        );
      });
      it("Should revert if invalid metadata id", async function () {
        await expect(metadataFacetWithGotchiOwner.flag(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
        await expect(metadataFacetWithGHSTHolder.flag(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
        await expect(metadataFacetWithUser3.flag(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
      });
      it("Should succeed if fake gotchi card holder flag pending metadata with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevFlagCount = savedMetaData.flagCount;
        let receipt = await (
          await metadataFacetWithUser3.flag(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataFlagged"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.status).to.equal(0);
        expect(savedMetaData.flagCount).to.equal(prevFlagCount.add(1));
      });
      it("Should succeed if aavegotchi owner flag pending metadata with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevFlagCount = savedMetaData.flagCount;
        let receipt = await (
          await metadataFacetWithGotchiOwner.flag(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataFlagged"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.status).to.equal(0);
        expect(savedMetaData.flagCount).to.equal(prevFlagCount.add(1));
      });
      it("Should succeed if 100+ GHST holder flag pending metadata with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevFlagCount = savedMetaData.flagCount;
        let receipt = await (
          await metadataFacetWithGHSTHolder.flag(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataFlagged"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.status).to.equal(0);
        expect(savedMetaData.flagCount).to.equal(prevFlagCount.add(1));
      });
      it("Should revert if non flaggable user", async function () {
        await expect(
          metadataFacetWithNotFlaggableUser.flag(metadataId)
        ).to.be.revertedWith(
          "MetadataFacet: Should own a Fake Gotchi NFT or an aavegotchi or 100 GHST"
        );
      });
      it("Should revert if user already flagged", async function () {
        await expect(
          metadataFacetWithGotchiOwner.flag(metadataId)
        ).to.be.revertedWith("MetadataFacet: Already flagged");
        await expect(
          metadataFacetWithGHSTHolder.flag(metadataId)
        ).to.be.revertedWith("MetadataFacet: Already flagged");
        await expect(
          metadataFacetWithUser3.flag(metadataId)
        ).to.be.revertedWith("MetadataFacet: Already flagged");
      });
      it("Should revert if flag declined metadata", async function () {
        await expect(
          metadataFacetWithGotchiOwner.flag(declinedMetadataId)
        ).to.be.revertedWith("MetadataFacet: Can only flag in queue");
        await expect(
          metadataFacetWithGHSTHolder.flag(declinedMetadataId)
        ).to.be.revertedWith("MetadataFacet: Can only flag in queue");
        await expect(
          metadataFacetWithUser3.flag(declinedMetadataId)
        ).to.be.revertedWith("MetadataFacet: Can only flag in queue");
      });
      it("Should succeed and update metadata paused if flag count reach 10", async function () {
        // flag more until 9
        for (let i = 0; i < moreFlaggableUsers.length; i++) {
          const metadataFacetWithFlaggableUser = await impersonate(
            moreFlaggableUsers[i],
            metadataFacet,
            ethers,
            network
          );
          await (await metadataFacetWithFlaggableUser.flag(metadataId)).wait();
        }

        // 10th flag
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevFlagCount = savedMetaData.flagCount;
        let receipt = await (
          await metadataFacetWithUser2.flag(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataFlagged"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.status).to.equal(1);
        expect(savedMetaData.flagCount).to.equal(prevFlagCount.add(1));
      });
      it("Should revert if flag paused metadata", async function () {
        await expect(
          metadataFacetWithGotchiOwner.flag(metadataId)
        ).to.be.revertedWith("MetadataFacet: Can only flag in queue");
        await expect(
          metadataFacetWithGHSTHolder.flag(metadataId)
        ).to.be.revertedWith("MetadataFacet: Can only flag in queue");
        await expect(
          metadataFacetWithUser3.flag(metadataId)
        ).to.be.revertedWith("MetadataFacet: Can only flag in queue");
      });
    });
    describe("passReview", async function () {
      it("Should revert if invalid diamond owner", async function () {
        await expect(
          metadataFacetWithUser.passReview(metadataId)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should revert if invalid id", async function () {
        await expect(
          metadataFacetWithOwner.passReview(metadataId.add(100))
        ).to.be.revertedWith("Metadata: Invalid metadata id");
        await expect(metadataFacetWithOwner.passReview(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
      });
      it("Should revert if declined metadata id", async function () {
        await expect(
          metadataFacetWithOwner.passReview(declinedMetadataId)
        ).to.be.revertedWith("Metadata: Not paused");
      });
      it("Should succeed and update metadata pending if paused", async function () {
        const receipt = await (
          await metadataFacetWithOwner.passReview(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataActionLog"
        );
        expect(event!.args!.status).to.equal(0);
        event = receipt!.events!.find(
          (event) => event.event === "ReviewPassed"
        );
        expect(event!.args!._id).to.equal(metadataId);
      });
      it("Should revert if pending (initial state or review passed)", async function () {
        await expect(
          metadataFacetWithOwner.passReview(metadataId)
        ).to.be.revertedWith("Metadata: Not paused");
      });
    });
    describe("mint", async function () {
      it("Should revert if invalid metadata owner", async function () {
        await expect(
          metadataFacetWithUser2.mint(metadataId)
        ).to.be.revertedWith("Metadata: Not metadata owner");
      });
      it("Should revert if metadata is declined", async function () {
        await expect(
          metadataFacetWithUser.mint(declinedMetadataId)
        ).to.be.revertedWith("Metadata: Declined");
      });
      it("Should fail if metadata is pending and created in 5 days", async function () {
        await expect(metadataFacetWithUser.mint(metadataId)).to.be.revertedWith(
          "Metadata: Still pending"
        );
      });
      it("Should succeed if valid metadata id and still pending after 5 days", async function () {
        await ethers.provider.send("evm_increaseTime", [5 * 86400]);
        await ethers.provider.send("evm_mine", []);
        const topic1 = utils.id("Mint(address,uint256)");
        const topic2 = utils.id("Transfer(address,address,uint256)");
        const receipt = await (
          await metadataFacetWithUser.mint(metadataId)
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "MetadataActionLog"
        );
        const events1 = receipt!.events!.filter(
          (event) => event.topics && event.topics[0] === topic1
        );
        const events2 = receipt!.events!.filter(
          (event) => event.topics && event.topics[0] === topic2
        );
        expect(event!.args!.status).to.equal(2);
        expect(events1.length).to.equal(mDataCount);
        expect(events2.length).to.equal(mDataCount);
        const savedMetaData = await metadataFacetWithUser.getMetadata(
          metadataId
        );
        expect(savedMetaData.count).to.equal(0);
      });
      it("Should revert if already mint", async function () {
        await expect(metadataFacetWithUser.mint(metadataId)).to.be.revertedWith(
          "Already mint"
        );
      });
      it("Should revert if decline already approved metadata", async function () {
        await expect(
          metadataFacetWithOwner.declineMetadata(metadataId, false)
        ).to.be.revertedWith("Metadata: Already approved");
      });
      // TODO: Case for mint paused data
    });
    describe("like", async function () {
      let metadataFacetWithGHSTHolder: MetadataFacet;
      let metadataFacetWithGotchiOwner: MetadataFacet;
      let metadataFacetWithNotLikeableUser: MetadataFacet;
      before(async function () {
        metadataFacetWithGotchiOwner = await impersonate(
          gotchiOwnerAddress,
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
        metadataFacetWithNotLikeableUser = await impersonate(
          artistAddress,
          metadataFacet,
          ethers,
          network
        );
      });

      it("Should revert if invalid metadata id", async function () {
        await expect(metadataFacetWithGotchiOwner.like(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
        await expect(metadataFacetWithGHSTHolder.like(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
        await expect(metadataFacetWithUser3.like(0)).to.be.revertedWith(
          "Metadata: Invalid metadata id"
        );
      });
      it("Should succeed if fake gotchi card holder like with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevLikeCount = savedMetaData.likeCount;
        let receipt = await (
          await metadataFacetWithUser3.like(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataLiked"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.likeCount).to.equal(prevLikeCount.add(1));
      });
      it("Should succeed if aavegotchi owner like with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevLikeCount = savedMetaData.likeCount;
        let receipt = await (
          await metadataFacetWithGotchiOwner.like(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataLiked"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.likeCount).to.equal(prevLikeCount.add(1));
      });
      it("Should succeed if 100+ GHST holder like with valid id", async function () {
        let savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        const prevLikeCount = savedMetaData.likeCount;
        let receipt = await (
          await metadataFacetWithGHSTHolder.like(metadataId)
        ).wait();
        let event = receipt!.events!.find(
          (event) => event.event === "MetadataLiked"
        );
        expect(event!.args!._id).to.equal(metadataId);
        savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);
        expect(savedMetaData.likeCount).to.equal(prevLikeCount.add(1));
      });
      it("Should revert if non likeable user", async function () {
        await expect(
          metadataFacetWithNotLikeableUser.like(metadataId)
        ).to.be.revertedWith(
          "MetadataFacet: Should own a Fake Gotchi NFT or an aavegotchi or 100 GHST"
        );
      });
      it("Should revert if user already liked", async function () {
        await expect(
          metadataFacetWithGotchiOwner.like(metadataId)
        ).to.be.revertedWith("MetadataFacet: Already liked");
        await expect(
          metadataFacetWithGHSTHolder.like(metadataId)
        ).to.be.revertedWith("MetadataFacet: Already liked");
        await expect(
          metadataFacetWithUser3.like(metadataId)
        ).to.be.revertedWith("MetadataFacet: Already liked");
      });
    });
  });

  describe("FakeGotchisNFTFacet", async function () {
    describe("setGhstAddress", async function () {
      it("Should revert if not diamond owner", async function () {
        await expect(
          nftFacetWithUser.setGhstAddress(ghstAddress)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should set aavegotchi diamond address if diamond owner", async function () {
        const receipt = await (
          await nftFacetWithOwner.setGhstAddress(ghstAddress)
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "GhstAddressUpdated"
        );
        expect(event!.args!._ghstContract).to.equal(ghstAddress);
      });
    });
    describe("setAavegotchiAddress", async function () {
      it("Should revert if not diamond owner", async function () {
        await expect(
          nftFacetWithUser.setAavegotchiAddress(maticAavegotchiDiamondAddress)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should set aavegotchi diamond address if diamond owner", async function () {
        const receipt = await (
          await nftFacetWithOwner.setAavegotchiAddress(
            maticAavegotchiDiamondAddress
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "AavegotchiAddressUpdated"
        );
        expect(event!.args!._aavegotchiDiamond).to.equal(
          maticAavegotchiDiamondAddress
        );
      });
    });
    describe("setFakeGotchisCardAddress", async function () {
      it("Should revert if not diamond owner", async function () {
        await expect(
          nftFacetWithUser.setFakeGotchisCardAddress(fakeGotchisCardDiamond)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should set card diamond address if diamond owner", async function () {
        const receipt = await (
          await nftFacetWithOwner.setFakeGotchisCardAddress(
            fakeGotchisCardDiamond
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "FakeGotchisCardAddressUpdated"
        );
        expect(event!.args!._fakeGotchisCardDiamond).to.equal(
          fakeGotchisCardDiamond
        );
      });
    });
    describe("totalSupply", async function () {
      it("Should return total supply", async function () {
        const tSupply = await nftFacetWithUser.totalSupply();
        expect(tSupply).to.equal(totalSupply);
      });
    });
    describe("tokenIdsOfOwner", async function () {
      it("Should return token ids if have any nft", async function () {
        const tokenIds = await nftFacetWithUser.tokenIdsOfOwner(userAddress);
        expect(tokenIds.length).to.equal(mDataCount);
      });
      it("Should return empty array if have any nft", async function () {
        const tokenIds = await nftFacetWithUser.tokenIdsOfOwner(user2Address);
        expect(tokenIds.length).to.equal(0);
      });
    });
    describe("balanceOf", async function () {
      it("Should return length of tokens if have any nft", async function () {
        const balance = await nftFacetWithUser.balanceOf(userAddress);
        expect(balance).to.equal(mDataCount);
      });
      it("Should return 0 if have any nft", async function () {
        const balance = await nftFacetWithUser.balanceOf(user2Address);
        expect(balance).to.equal(0);
      });
    });
    describe("ownerOf", async function () {
      it("Should return token owner if valid token id", async function () {
        const tokenIds = await nftFacetWithUser.tokenIdsOfOwner(userAddress);
        expect(tokenIds.length).to.equal(mDataCount);
        const tokenOwner = await nftFacetWithUser.ownerOf(tokenIds[0]);
        expect(tokenOwner).to.equal(userAddress);
      });
      it("Should return zero address if invalid token id", async function () {
        const totalSupply = await nftFacetWithUser.totalSupply();
        const tokenOwner = await nftFacetWithUser.ownerOf(totalSupply.add(1));
        expect(tokenOwner).to.equal(ethers.constants.AddressZero);
      });
    });
    describe("royaltyInfo (EIP2981)", async function () {
      it("Should return address(0) and 0 if invalid id", async function () {
        const totalSupply = await nftFacetWithUser.totalSupply();
        const royaltyInfo = await nftFacetWithUser.royaltyInfo(
          totalSupply.add(10),
          100
        );
        expect(royaltyInfo.receiver).to.equal(ethers.constants.AddressZero);
        expect(royaltyInfo.royaltyAmount).to.equal(0);
      });
      it("Should return if valid id", async function () {
        const salePrice = 100;
        const tokenIds = await nftFacetWithUser.tokenIdsOfOwner(userAddress);
        const royaltyInfo = await nftFacetWithUser.royaltyInfo(
          tokenIds[0],
          salePrice
        );
        expect(royaltyInfo.receiver).to.equal(metaData.artist);
        expect(royaltyInfo.royaltyAmount).to.equal(
          (metaData.royalty[1] * salePrice) / 10000
        );
      });
    });
    // TODO: transfer logic
    // TODO: check royalty logic in aavegotchi diamond
  });
});
