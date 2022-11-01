import { impersonate } from "../scripts/helperFunctions";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, utils } from "ethers";
import { FakeGotchisCardFacet } from "../typechain-types";
import { upgrade } from "../scripts/card/upgrades/upgrade-batchTransferTo";
import { varsForNetwork } from "../constants";

describe("FAKE Gotchis Card safeBatchTransferTo tests", async function () {
  // contracts, contract addressees, signers
  let cardFacet: FakeGotchisCardFacet;
  let cardSeriesId: BigNumber = BigNumber.from(0);
  let user1Address: any;
  let user2Address: any;
  let user3Address: any;

  // test accounts for flag for like metadata
  const cardOwnerAddress = "0x8D46fd7160940d89dA026D59B2e819208E714E82"; // fake gotchi card owner

  before(async function () {
    this.timeout(20000000);

    await upgrade();

    const signers = await ethers.getSigners();
    const user1 = signers[0];
    const user2 = signers[1];
    const user3 = signers[2];
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    user3Address = await user3.getAddress();

    const c = await varsForNetwork(ethers);
    cardFacet = (await ethers.getContractAt(
      "FakeGotchisCardFacet",
      c.fakeGotchiCards
    )) as FakeGotchisCardFacet;

    cardFacet = await impersonate(cardOwnerAddress, cardFacet, ethers, network);
  });

  describe("safeBatchTransferTo", async function () {
    it("Should revert if array length not matched", async function () {
      await expect(
        cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [user1Address],
          [cardSeriesId, cardSeriesId],
          [1, 1],
          []
        )
      ).to.be.revertedWith("FGCard: Array length mismatch");
      await expect(
        cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [user1Address, user2Address],
          [cardSeriesId],
          [1, 1],
          []
        )
      ).to.be.revertedWith("FGCard: Array length mismatch");
      await expect(
        cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [user1Address],
          [cardSeriesId, cardSeriesId],
          [1],
          []
        )
      ).to.be.revertedWith("FGCard: Array length mismatch");
    });
    it("Should revert if _to has zero address", async function () {
      await expect(
        cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [ethers.constants.AddressZero],
          [cardSeriesId],
          [1],
          []
        )
      ).to.be.revertedWith("FGCard: Can't transfer to 0 address");
      await expect(
        cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [user1Address, ethers.constants.AddressZero],
          [cardSeriesId, cardSeriesId],
          [1, 1],
          []
        )
      ).to.be.revertedWith("FGCard: Can't transfer to 0 address");
    });
    it("Should revert if not enough balance or invalid id", async function () {
      const cardCount = await cardFacet.balanceOf(
        cardOwnerAddress,
        cardSeriesId
      );
      await expect(
        cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [user1Address, user2Address],
          [cardSeriesId, cardSeriesId],
          [1, cardCount.add(1)],
          []
        )
      ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
      await expect(
        cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [user1Address, user2Address],
          [cardSeriesId, cardSeriesId.add(1)],
          [1, 1],
          []
        )
      ).to.be.revertedWith("FGCard: Doesn't have that many to transfer");
    });
    it("Should transfer if valid card owner and params", async function () {
      // card test data
      const cardTransferAmount1 = 1;
      const cardTransferAmount2 = 2;
      const cardTransferAmount3 = 3;

      const balanceOwnerBefore = await cardFacet.balanceOf(
        cardOwnerAddress,
        cardSeriesId
      );
      const balanceUser1Before = await cardFacet.balanceOf(
        user1Address,
        cardSeriesId
      );
      const balanceUser2Before = await cardFacet.balanceOf(
        user2Address,
        cardSeriesId
      );
      const balanceUser3Before = await cardFacet.balanceOf(
        user3Address,
        cardSeriesId
      );
      const topic = utils.id(
        "TransferSingle(address,address,address,uint256,uint256)"
      );
      const receipt = await (
        await cardFacet.safeBatchTransferTo(
          cardOwnerAddress,
          [user1Address, user2Address, user3Address],
          [cardSeriesId, cardSeriesId, cardSeriesId],
          [cardTransferAmount1, cardTransferAmount2, cardTransferAmount3],
          []
        )
      ).wait();
      const events = receipt!.events!.filter(
        (event) => event.topics && event.topics[0] === topic
      );
      expect(events.length).to.equal(3);

      const balanceOwnerAfter = await cardFacet.balanceOf(
        cardOwnerAddress,
        cardSeriesId
      );
      const balanceUser1After = await cardFacet.balanceOf(
        user1Address,
        cardSeriesId
      );
      const balanceUser2After = await cardFacet.balanceOf(
        user2Address,
        cardSeriesId
      );
      const balanceUser3After = await cardFacet.balanceOf(
        user3Address,
        cardSeriesId
      );
      expect(
        balanceOwnerAfter.add(
          cardTransferAmount1 + cardTransferAmount2 + cardTransferAmount3
        )
      ).to.equal(balanceOwnerBefore);
      expect(balanceUser1Before.add(cardTransferAmount1)).to.equal(
        balanceUser1After
      );
      expect(balanceUser2Before.add(cardTransferAmount2)).to.equal(
        balanceUser2After
      );
      expect(balanceUser3Before.add(cardTransferAmount3)).to.equal(
        balanceUser3After
      );
    });
  });
});
