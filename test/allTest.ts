import {
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
  let user: Signer;
  let userAddress: any;
  let user2: Signer;
  let user2Address: any;
  let user3: Signer;
  let user3Address: any;

  // card test data
  const cardCount = 2535;
  const cardBaseURI = "https://aavegotchi.com/metadata/cards/";
  const cardTransferAmount = 100;
  const cardTransferAmount2 = 10;

  // test metadata
  const mDataCount = 10;
  const mDataCount3 = 5;
  const totalSupply = mDataCount + mDataCount3;
  const fileHash = "q".repeat(32); // 32 bytes
  const name = ethers.utils.formatBytes32String("w".repeat(25)); // 25 bytes
  const publisherName = "e".repeat(72); // 72 bytes
  const externalLink = "r".repeat(240); // 240 bytes
  const description = "t".repeat(120); // 120 bytes
  const artistName = "y".repeat(72); // 72 bytes
  let metaData: any;

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
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();
    user3Address = await user3.getAddress();

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
      artist: ethers.constants.AddressZero,
      royalty: [100, 0] as [
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
          fakeGotchisCardDiamond,
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
          [ownerAddress, userAddress, fakeGotchisCardDiamond],
          [cardSeriesId.add(1), cardSeriesId, cardSeriesId]
        );
        expect(balances[0]).to.equal(0);
        expect(balances[1]).to.equal(0);
        expect(balances[2]).to.equal(cardCount);
      });
    });
    describe("safeTransferFromDiamond", async function () {
      it("Should revert if invalid diamond owner", async function () {
        await expect(
          cardFacetWithUser.safeTransferFromDiamond(
            ownerAddress,
            cardSeriesId,
            1,
            []
          )
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      describe("Param validation (_safeTransferFrom)", async function () {
        it("Should revert if _to is zero address", async function () {
          await expect(
            cardFacetWithOwner.safeTransferFromDiamond(
              ethers.constants.AddressZero,
              cardSeriesId,
              1,
              []
            )
          ).to.be.revertedWith("FGCard: Can't transfer to 0 address");
        });
        it("Should revert if not enough balance or invalid id", async function () {
          await expect(
            cardFacetWithOwner.safeTransferFromDiamond(
              userAddress,
              cardSeriesId,
              cardCount + 1,
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
          await expect(
            cardFacetWithOwner.safeTransferFromDiamond(
              userAddress,
              cardSeriesId.add(1),
              1,
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
        });
      });
      it("Should transfer from diamond if valid diamond owner and params", async function () {
        const balanceDiamondBefore = await cardFacetWithUser.balanceOf(
          fakeGotchisCardDiamond,
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
          await cardFacetWithOwner.safeTransferFromDiamond(
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
        const balanceDiamondAfter = await cardFacetWithUser.balanceOf(
          fakeGotchisCardDiamond,
          cardSeriesId
        );
        const balanceUserAfter = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        expect(balanceDiamondAfter.add(cardTransferAmount)).to.equal(
          balanceDiamondBefore
        );
        expect(balanceUserBefore.add(cardTransferAmount)).to.equal(
          balanceUserAfter
        );
      });
    });
    describe("safeBatchTransferFromDiamond", async function () {
      it("Should revert if invalid diamond owner", async function () {
        await expect(
          cardFacetWithUser.safeBatchTransferFromDiamond(
            ownerAddress,
            [cardSeriesId],
            [1],
            []
          )
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      describe("Param validation (_safeBatchTransferFrom)", async function () {
        it("Should revert if array length not matched", async function () {
          await expect(
            cardFacetWithOwner.safeBatchTransferFromDiamond(
              userAddress,
              [cardSeriesId],
              [1, 1],
              []
            )
          ).to.be.revertedWith("FGCard: ids not same length as amounts");
        });
        it("Should revert if _to is zero address", async function () {
          await expect(
            cardFacetWithOwner.safeBatchTransferFromDiamond(
              ethers.constants.AddressZero,
              [cardSeriesId],
              [1],
              []
            )
          ).to.be.revertedWith("FGCard: Can't transfer to 0 address");
        });
        it("Should revert if not enough balance or invalid id", async function () {
          await expect(
            cardFacetWithOwner.safeBatchTransferFromDiamond(
              userAddress,
              [cardSeriesId],
              [cardCount + 1],
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
          await expect(
            cardFacetWithOwner.safeBatchTransferFromDiamond(
              userAddress,
              [cardSeriesId.add(1)],
              [1],
              []
            )
          ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
        });
      });
      it("Should transfer from diamond if valid diamond owner and params", async function () {
        const balanceDiamondBefore = await cardFacetWithUser.balanceOf(
          fakeGotchisCardDiamond,
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
          await cardFacetWithOwner.safeBatchTransferFromDiamond(
            userAddress,
            [cardSeriesId],
            [cardTransferAmount],
            []
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.topics && event.topics[0] === topic
        );
        expect(event!.address).to.equal(fakeGotchisCardDiamond);
        const balanceDiamondAfter = await cardFacetWithUser.balanceOf(
          fakeGotchisCardDiamond,
          cardSeriesId
        );
        const balanceUserAfter = await cardFacetWithUser.balanceOf(
          userAddress,
          cardSeriesId
        );
        expect(balanceDiamondAfter.add(cardTransferAmount)).to.equal(
          balanceDiamondBefore
        );
        expect(balanceUserBefore.add(cardTransferAmount)).to.equal(
          balanceUserAfter
        );
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
          await cardFacetWithUser.safeTransferFrom(
            userAddress,
            ownerAddress,
            cardSeriesId,
            cardTransferAmount2,
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
      // Note: Success case will be in addMetadata() test
    });
  });

  describe("MetadataFacet", async function () {
    let metadataId: BigNumber;
    let declinedMetadataId: BigNumber;
    describe("addMetadata", async function () {
      // Note: Checking blocked sender case will be declineMetadata() test
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
      it("Should revert if sum of royalty splits not 100", async function () {
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
        ).to.be.revertedWith("Metadata: Sum of royalty splits not 100");
      });
      it("Should revert if artist royalty split is not 0 for zero address", async function () {
        const testMetaData = {
          ...metaData,
          royalty: [50, 50],
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
          metadataFacetWithUser.getMetadata(metadataId.add(1))
        ).to.be.revertedWith("Metadata: _id is greater than total count.");
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
    describe("approveMetadata", async function () {
      it("Should revert if invalid diamond owner", async function () {
        await expect(
          metadataFacetWithUser.approveMetadata(metadataId)
        ).to.be.revertedWith("LibDiamond: Must be contract owner");
      });
      it("Should revert if invalid id", async function () {
        await expect(
          metadataFacetWithOwner.approveMetadata(metadataId.add(1))
        ).to.be.revertedWith("Metadata: _id is greater than total count.");
      });
      it("Should succeed if valid id and not approved", async function () {
        const receipt = await (
          await metadataFacetWithOwner.approveMetadata(metadataId)
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "MetadataActionLog"
        );
        expect(event!.args!.sender).to.equal(userAddress);
        expect(event!.args!.fileHash).to.equal(metaData.fileHash);
        expect(event!.args!.publisher).to.equal(metaData.publisher);
        expect(event!.args!.status).to.equal(1);
      });
      it("Should revert if already approved", async function () {
        await expect(
          metadataFacetWithOwner.approveMetadata(metadataId)
        ).to.be.revertedWith("Metadata: Already approved");
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
          metadataFacetWithOwner.declineMetadata(metadataId.add(1), false)
        ).to.be.revertedWith("Metadata: _id is greater than total count.");
      });
      it("Should revert if already approved", async function () {
        await expect(
          metadataFacetWithOwner.declineMetadata(metadataId, false)
        ).to.be.revertedWith("Metadata: Already approved");
      });
      it("Should succeed if valid id and not approved", async function () {
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
        expect(event!.args!.status).to.equal(2);
      });
      describe("Blocking bad faith account", async function () {
        it("Should revert if bad faith user try to add Metadata", async function () {
          // Get card
          await (
            await cardFacetWithOwner.safeTransferFromDiamond(
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
    });
    describe("mint", async function () {
      let pendingMetadataId: BigNumber;
      it("Should revert if invalid metadata owner", async function () {
        await expect(
          metadataFacetWithUser2.mint(metadataId)
        ).to.be.revertedWith("Metadata: Not metadata owner");
      });
      it("Should revert if metadata is not approved", async function () {
        await expect(
          metadataFacetWithUser.mint(metadataId.add(1))
        ).to.be.revertedWith("Metadata: Not approved");
        await expect(
          metadataFacetWithUser.mint(declinedMetadataId)
        ).to.be.revertedWith("Metadata: Not approved");
      });
      it("Should succeed if valid metadata id and approved", async function () {
        const topic1 = utils.id("Mint(address,uint256)");
        const topic2 = utils.id("Transfer(address,address,uint256)");
        const receipt = await (
          await metadataFacetWithUser.mint(metadataId)
        ).wait();
        const events1 = receipt!.events!.filter(
          (event) => event.topics && event.topics[0] === topic1
        );
        const events2 = receipt!.events!.filter(
          (event) => event.topics && event.topics[0] === topic2
        );
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
      it("Should fail if metadata is pending and created in 5 days", async function () {
        const testMetaData = {
          ...metaData,
          publisher: user3Address,
        };
        // Get card
        await (
          await cardFacetWithOwner.safeTransferFromDiamond(
            user3Address,
            cardSeriesId,
            cardTransferAmount,
            []
          )
        ).wait();
        const receipt = await (
          await metadataFacetWithUser3.addMetadata(
            testMetaData,
            cardSeriesId,
            mDataCount3
          )
        ).wait();
        const event = receipt!.events!.find(
          (event) => event.event === "MetadataActionLog"
        );
        pendingMetadataId = event!.args!.id;
        expect(event!.args!.sender).to.equal(user3Address);
        expect(event!.args!.publisher).to.equal(testMetaData.publisher);
        expect(event!.args!.status).to.equal(0);
        await expect(
          metadataFacetWithUser3.mint(pendingMetadataId)
        ).to.be.revertedWith("Metadata: Still pending");
      });
      it("Should succeed if valid metadata id and still pending after 5 days", async function () {
        await ethers.provider.send("evm_increaseTime", [5 * 86400]);
        await ethers.provider.send("evm_mine", []);
        const topic1 = utils.id("Mint(address,uint256)");
        const topic2 = utils.id("Transfer(address,address,uint256)");
        const receipt = await (
          await metadataFacetWithUser3.mint(pendingMetadataId)
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
        expect(event!.args!.status).to.equal(1);
        expect(events1.length).to.equal(mDataCount3);
        expect(events2.length).to.equal(mDataCount3);
        const savedMetaData = await metadataFacetWithUser3.getMetadata(
          pendingMetadataId
        );
        expect(savedMetaData.count).to.equal(0);
      });
    });
  });
  describe("FakeGotchisNFTFacet", async function () {
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
        const tokenIds3 = await nftFacetWithUser.tokenIdsOfOwner(user3Address);
        expect(tokenIds3.length).to.equal(mDataCount3);
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
        const balance3 = await nftFacetWithUser.balanceOf(user3Address);
        expect(balance3).to.equal(mDataCount3);
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
    describe("getRoyaltyInfo", async function () {
      it("Should revert if invalid id", async function () {
        const totalSupply = await nftFacetWithUser.totalSupply();
        await expect(
          nftFacetWithUser.getRoyaltyInfo(totalSupply.add(1))
        ).to.be.revertedWith("ERC721: _tokenId is greater than total supply.");
      });
      it("Should return if valid id", async function () {
        const tokenIds = await nftFacetWithUser.tokenIdsOfOwner(userAddress);
        const royaltyInfo = await nftFacetWithUser.getRoyaltyInfo(tokenIds[0]);
        expect(royaltyInfo.length).to.equal(2);
        expect(royaltyInfo[0].length).to.equal(2);
        expect(royaltyInfo[1].length).to.equal(2);
        expect(royaltyInfo[0][0]).to.equal(metaData.publisher);
        expect(royaltyInfo[0][1]).to.equal(metaData.artist);
        expect(royaltyInfo[1][0]).to.equal(metaData.royalty[0]);
        expect(royaltyInfo[1][1]).to.equal(metaData.royalty[1]);
      });
    });
    // TODO: transfer logic
    // TODO: check royalty logic in aavegotchi diamond
  });
});
