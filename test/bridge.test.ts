import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { deployDiamonds } from "../scripts/deployDiamonds";
import { impersonate } from "../scripts/helperFunctions";
import {
  FakeGotchiBridgeGotchichainSide,
  FakeGotchiBridgePolygonSide,
  FakeGotchiCardBridgeGotchichainSide,
  FakeGotchiCardBridgePolygonSide,
  FakeGotchiCardPolygonXGotchichainBridgeFacet,
  FakeGotchiPolygonXGotchichainBridgeFacet,
  FakeGotchisCardFacet,
  FakeGotchisNFTFacet,
  MetadataFacet,
} from "../typechain-types";

describe("Fake Gotchis tests", async function () {
  let fakeGotchisPolygonCardDiamond: any;
  let fakeGotchisPolygonNftDiamond: any;
  let cardFacet: FakeGotchisCardFacet;
  let nftFacetPolygon: FakeGotchisNFTFacet;
  let nftFacetGotchichain: FakeGotchisNFTFacet;
  let cardFacetPolygon: FakeGotchisCardFacet;
  let cardFacetGotchichain: FakeGotchisCardFacet;
  let metadataPolygonFacet: MetadataFacet;
  let metadataGotchiFacet: MetadataFacet;
  let cardFacetWithOwner: FakeGotchisCardFacet;
  let metadataFacetWithUser: MetadataFacet;
  let cardSeriesId: BigNumber;
  let owner: Signer;
  let ownerAddress: any;
  let user: Signer;
  let userAddress: any;
  let artistAddress: any;
  let polygonNFTAdapterParams: any;
  let gotchichainNFTAdapterParams: any;
  let polygonCardAdapterParams: any;
  let gotchichainCardAdapterParams: any;

  let cardSeriesId2: BigNumber;
  let metadataId2: BigNumber;

  const chainId_A = 1;
  const chainId_B = 2;

  let bridgeNFTPolygonSide: FakeGotchiBridgePolygonSide,
    bridgeNFTGotchichainSide: FakeGotchiBridgeGotchichainSide;

  let bridgeCardPolygonSide: FakeGotchiCardBridgePolygonSide,
    bridgeCardGotchichainSide: FakeGotchiCardBridgeGotchichainSide;

  let fakeGotchiPolygonBridgeFacet: FakeGotchiPolygonXGotchichainBridgeFacet;
  let fakeGotchiGotchichainBridgeFacet: FakeGotchiPolygonXGotchichainBridgeFacet;

  let fakeGotchiPolygonCardBridgeFacet: FakeGotchiCardPolygonXGotchichainBridgeFacet;
  let fakeGotchiGotchichainCardBridgeFacet: FakeGotchiCardPolygonXGotchichainBridgeFacet;

  let fakeGotchisGotchiCardDiamond: string;
  let fakeGotchisGotchiNftDiamond: string;
  let signers: Signer[];

  let metadataId: BigNumber;

  async function deployFixture() {
    const diamondsPolygon = await deployDiamonds();
    fakeGotchisPolygonCardDiamond = diamondsPolygon.fakeGotchisCardDiamond;
    fakeGotchisPolygonNftDiamond = diamondsPolygon.fakeGotchisNftDiamond;

    const diamondsGotchi = await deployDiamonds();
    fakeGotchisGotchiCardDiamond = diamondsGotchi.fakeGotchisCardDiamond;
    fakeGotchisGotchiNftDiamond = diamondsGotchi.fakeGotchisNftDiamond;

    signers = await ethers.getSigners();
    owner = signers[0];
    user = signers[1];
    const artist = signers[9];
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    artistAddress = await artist.getAddress();

    cardFacet = (await ethers.getContractAt(
      "FakeGotchisCardFacet",
      fakeGotchisPolygonCardDiamond
    )) as FakeGotchisCardFacet;

    nftFacetPolygon = (await ethers.getContractAt(
      "FakeGotchisNFTFacet",
      fakeGotchisPolygonNftDiamond
    )) as FakeGotchisNFTFacet;

    nftFacetGotchichain = (await ethers.getContractAt(
      "FakeGotchisNFTFacet",
      fakeGotchisGotchiNftDiamond
    )) as FakeGotchisNFTFacet;

    cardFacetPolygon = (await ethers.getContractAt(
      "FakeGotchisCardFacet",
      fakeGotchisPolygonCardDiamond
    )) as FakeGotchisCardFacet;

    cardFacetGotchichain = (await ethers.getContractAt(
      "FakeGotchisCardFacet",
      fakeGotchisGotchiCardDiamond
    )) as FakeGotchisCardFacet;

    metadataPolygonFacet = (await ethers.getContractAt(
      "MetadataFacet",
      fakeGotchisPolygonNftDiamond
    )) as MetadataFacet;

    metadataGotchiFacet = (await ethers.getContractAt(
      "MetadataFacet",
      fakeGotchisGotchiNftDiamond
    )) as MetadataFacet;

    cardFacetWithOwner = await impersonate(
      ownerAddress,
      cardFacet,
      ethers,
      network
    );

    metadataFacetWithUser = await impersonate(
      userAddress,
      metadataPolygonFacet,
      ethers,
      network
    );

    fakeGotchiPolygonBridgeFacet = await ethers.getContractAt(
      "FakeGotchiPolygonXGotchichainBridgeFacet",
      fakeGotchisPolygonNftDiamond
    );

    fakeGotchiGotchichainBridgeFacet = await ethers.getContractAt(
      "FakeGotchiPolygonXGotchichainBridgeFacet",
      fakeGotchisGotchiNftDiamond
    );

    fakeGotchiPolygonCardBridgeFacet = await ethers.getContractAt(
      "FakeGotchiCardPolygonXGotchichainBridgeFacet",
      fakeGotchisPolygonCardDiamond
    );

    fakeGotchiGotchichainCardBridgeFacet = await ethers.getContractAt(
      "FakeGotchiCardPolygonXGotchichainBridgeFacet",
      fakeGotchisGotchiCardDiamond
    );

    ({
      bridgePolygonSide: bridgeNFTPolygonSide as any,
      bridgeGotchichainSide: bridgeNFTGotchichainSide as any,
      polygonAdapterParams: polygonNFTAdapterParams,
      gotchichainAdapterParams: gotchichainNFTAdapterParams,
    } = await setupBridge(
      fakeGotchisPolygonNftDiamond,
      fakeGotchisGotchiNftDiamond,
      fakeGotchiPolygonBridgeFacet,
      owner,
      fakeGotchiGotchichainBridgeFacet,
      "FakeGotchiBridgePolygonSide",
      "FakeGotchiBridgeGotchichainSide"
    ));

    ({
      bridgePolygonSide: bridgeCardPolygonSide as any,
      bridgeGotchichainSide: bridgeCardGotchichainSide as any,
      polygonAdapterParams: polygonCardAdapterParams,
      gotchichainAdapterParams: gotchichainCardAdapterParams,
    } = await setupBridge(
      fakeGotchisPolygonCardDiamond,
      fakeGotchisGotchiCardDiamond,
      fakeGotchiPolygonCardBridgeFacet,
      owner,
      fakeGotchiGotchichainCardBridgeFacet,
      "FakeGotchiCardBridgePolygonSide",
      "FakeGotchiCardBridgeGotchichainSide",
      false
    ));

    const metaData = createMetaData(10, "test");
    ({ cardSeriesId, newMetadataId: metadataId } =
      await createSeriesAndMintFake(
        cardFacetWithOwner,
        ownerAddress,
        userAddress,
        metadataFacetWithUser,
        metaData
      ));
    const metaData2 = createMetaData(30, "test2");
    ({ cardSeriesId: cardSeriesId2, newMetadataId: metadataId2 } =
      await createSeriesAndMintFake(
        cardFacetWithOwner,
        ownerAddress,
        userAddress,
        metadataFacetWithUser,
        metaData2
      ));
  }

  beforeEach(async function () {
    await loadFixture(deployFixture);
  });

  describe("Bridge FakeGotchi NFT", async () => {
    it("Should mint a FakeGotchi on Polygon and bridge it to Gotchichain and back", async () => {
      await ethers.provider.send("evm_increaseTime", [5 * 86400]);
      await ethers.provider.send("evm_mine", []);
      const tokenId = 1;
      await metadataFacetWithUser.mint(metadataId);

      const savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);

      expect(savedMetaData.minted).to.equal(true);

      const polygonMetadata = await nftFacetPolygon.tokenURI(tokenId);

      await nftFacetPolygon
        .connect(signers[1])
        .setApprovalForAll(bridgeNFTPolygonSide.address, true);

      await bridgeNFTPolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          tokenId,
          userAddress,
          ethers.constants.AddressZero,
          polygonNFTAdapterParams,
          {
            value: (
              await bridgeNFTPolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                tokenId,
                false,
                polygonNFTAdapterParams
              )
            ).nativeFee.mul(10),
          }
        );
      expect(await nftFacetPolygon.balanceOf(userAddress)).to.equal(9);
      expect(await nftFacetGotchichain.balanceOf(userAddress)).to.equal(1);
      expect(await nftFacetGotchichain.tokenURI(tokenId)).to.equal(
        polygonMetadata
      );

      await nftFacetGotchichain
        .connect(signers[1])
        .setApprovalForAll(bridgeNFTGotchichainSide.address, true);

      await bridgeNFTGotchichainSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_A,
          userAddress,
          tokenId,
          userAddress,
          ethers.constants.AddressZero,
          gotchichainNFTAdapterParams,
          {
            value: (
              await bridgeNFTGotchichainSide
                .connect(signers[1])
                .estimateSendFee(
                  chainId_A,
                  userAddress,
                  tokenId,
                  false,
                  gotchichainNFTAdapterParams
                )
            ).nativeFee.mul(100),
          }
        );

      expect(await nftFacetGotchichain.balanceOf(userAddress)).to.equal(0);
      expect(await nftFacetPolygon.balanceOf(userAddress)).to.equal(10);
      expect(await nftFacetPolygon.tokenURI(tokenId)).to.equal(polygonMetadata);

      await bridgeNFTPolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          tokenId,
          userAddress,
          ethers.constants.AddressZero,
          polygonNFTAdapterParams,
          {
            value: (
              await bridgeNFTPolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                tokenId,
                false,
                polygonNFTAdapterParams
              )
            ).nativeFee.mul(10),
          }
        );
      expect(await nftFacetPolygon.balanceOf(userAddress)).to.equal(9);
      expect(await nftFacetGotchichain.balanceOf(userAddress)).to.equal(1);
      expect(await nftFacetGotchichain.tokenURI(tokenId)).to.equal(
        polygonMetadata
      );

      // second mint
      const tokenId2 = 15;
      await metadataFacetWithUser.mint(metadataId2);

      const savedMetaData2 = await metadataFacetWithUser.getMetadata(
        metadataId2
      );

      expect(savedMetaData2.minted).to.equal(true);

      const polygonMetadata2 = await nftFacetPolygon.tokenURI(tokenId2);

      await bridgeNFTPolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          tokenId2,
          userAddress,
          ethers.constants.AddressZero,
          polygonNFTAdapterParams,
          {
            value: (
              await bridgeNFTPolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                tokenId2,
                false,
                polygonNFTAdapterParams
              )
            ).nativeFee.mul(10),
          }
        );
      expect(await nftFacetPolygon.balanceOf(userAddress)).to.equal(38);
      expect(await nftFacetGotchichain.balanceOf(userAddress)).to.equal(2);
      expect(await nftFacetGotchichain.tokenURI(tokenId2)).to.equal(
        polygonMetadata2
      );
      expect(polygonMetadata2).to.not.be.equal(polygonMetadata);
    });

    it("Only owner can set layerzero bridge", async () => {
      const accounts = await ethers.getSigners();
      const bob = accounts[1];
      await expect(
        fakeGotchiPolygonBridgeFacet
          .connect(bob)
          .setLayerZeroBridge(fakeGotchiPolygonBridgeFacet.address)
      ).to.be.revertedWith("LibDiamond: Must be contract owner");
    });

    it("Only layerzero can call mintWithId and setFakeGotchiMetadata", async () => {
      const accounts = await ethers.getSigners();
      const bob = accounts[1];
      await expect(
        fakeGotchiPolygonBridgeFacet.connect(bob).mintWithId(bob.address, 0)
      ).to.be.revertedWith("LibAppStorage: Do not have access");

      const editions = 10;
      const fileHash = "q".repeat(42); // 42 bytes
      const name = "w".repeat(50); // 50 bytes
      const externalLink = "r".repeat(50); // 240 bytes
      const description = "d".repeat(120); // 120 bytes
      const artistName = "y".repeat(30); // 30 bytes
      const thumbnailHash = "t".repeat(42); // 42 bytes
      const fileType = "f".repeat(20); // 20 bytes
      const thumbnailType = "q".repeat(20); // 20 bytes

      const metaData = {
        fileHash,
        name,
        publisher: artistAddress,
        externalLink,
        description,
        artistName,
        artist: artistAddress,
        royalty: [ethers.BigNumber.from(300), ethers.BigNumber.from(100)] as [
          BigNumber,
          BigNumber
        ],
        editions,
        thumbnailHash,
        fileType,
        thumbnailType,
        flagCount: 0,
        likeCount: 0,
        createdAt: 0,
        status: 0,
        publisherName: artistAddress,
        minted: true,
      };

      await expect(
        fakeGotchiPolygonBridgeFacet
          .connect(bob)
          .setFakeGotchiMetadata(bob.address, metaData, 1)
      ).to.be.revertedWith("LibAppStorage: Do not have access");
    });
  });

  describe("Bridge FakeGotchi Card", async () => {
    it("Should mint a card on Polygon and bridge it to Gotchichain and back", async () => {
      const cardCount = 10;
      const tokenId = 1; // because we are minting one on setup already
      const amountToBridge = 1;

      await cardFacetPolygon.startNewSeries(cardCount);
      await cardFacetPolygon.safeTransferFrom(
        ownerAddress,
        userAddress,
        tokenId,
        cardCount,
        []
      );
      expect(await cardFacetPolygon.balanceOf(userAddress, tokenId)).to.equal(
        109 // 100 from setup - 1 from the previous test + 10 from this mint
      );

      await cardFacetPolygon
        .connect(signers[1])
        .setApprovalForAll(bridgeCardPolygonSide.address, true);

      await bridgeCardPolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          tokenId,
          amountToBridge,
          userAddress,
          ethers.constants.AddressZero,
          [],
          {
            value: (
              await bridgeCardPolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                tokenId,
                amountToBridge,
                false,
                []
              )
            ).nativeFee,
          }
        );
      expect(await cardFacetPolygon.balanceOf(userAddress, tokenId)).to.equal(
        109 - amountToBridge
      );
      expect(
        await cardFacetGotchichain.balanceOf(userAddress, tokenId)
      ).to.equal(amountToBridge);

      const secondAddress = await signers[2].getAddress();
      await cardFacetPolygon.safeTransferFrom(
        ownerAddress,
        secondAddress,
        tokenId,
        1,
        []
      );

      await cardFacetPolygon
        .connect(signers[2])
        .setApprovalForAll(bridgeCardPolygonSide.address, true);

      await bridgeCardPolygonSide
        .connect(signers[2])
        .sendFrom(
          secondAddress,
          chainId_B,
          secondAddress,
          tokenId,
          amountToBridge,
          secondAddress,
          ethers.constants.AddressZero,
          [],
          {
            value: (
              await bridgeCardPolygonSide.estimateSendFee(
                chainId_B,
                secondAddress,
                tokenId,
                amountToBridge,
                false,
                []
              )
            ).nativeFee,
          }
        );
      expect(await cardFacetPolygon.balanceOf(secondAddress, tokenId)).to.equal(
        0
      );
      expect(
        await cardFacetGotchichain.balanceOf(secondAddress, tokenId)
      ).to.equal(1);

      // back to gotchichain

      await cardFacetGotchichain
        .connect(signers[2])
        .setApprovalForAll(bridgeCardGotchichainSide.address, true);

      await bridgeCardGotchichainSide
        .connect(signers[2])
        .sendFrom(
          secondAddress,
          chainId_A,
          secondAddress,
          tokenId,
          amountToBridge,
          secondAddress,
          ethers.constants.AddressZero,
          [],
          {
            value: (
              await bridgeCardGotchichainSide.estimateSendFee(
                chainId_A,
                secondAddress,
                tokenId,
                amountToBridge,
                false,
                []
              )
            ).nativeFee,
          }
        );
      expect(
        await cardFacetGotchichain.balanceOf(secondAddress, tokenId)
      ).to.equal(0);
      expect(await cardFacetPolygon.balanceOf(secondAddress, tokenId)).to.equal(
        1
      );
      expect(await cardFacetGotchichain.uri(tokenId)).to.equal(
        await cardFacetPolygon.uri(tokenId)
      );
      expect(
        await cardFacetGotchichain.balanceOf(
          bridgeCardGotchichainSide.address,
          tokenId
        )
      ).to.equal(1);
    });

    it.only("Should mint a card and bridge it Gotchichain, lock it back, and bridge Poly -> Gotchi to enforce a mint and transfer on Gotchi", async () => {
      const cardCount = 10;
      const tokenId = 2; // because we are minting one on setup already
      const amountToBridgeToGotchi = 2;

      await cardFacetPolygon.startNewSeries(cardCount);
      await cardFacetPolygon.safeTransferFrom(
        ownerAddress,
        userAddress,
        tokenId,
        cardCount,
        []
      );
      expect(await cardFacetPolygon.balanceOf(userAddress, tokenId)).to.equal(
        10
      );

      await cardFacetPolygon
        .connect(signers[1])
        .setApprovalForAll(bridgeCardPolygonSide.address, true);

      await bridgeCardPolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          tokenId,
          amountToBridgeToGotchi,
          userAddress,
          ethers.constants.AddressZero,
          [],
          {
            value: (
              await bridgeCardPolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                tokenId,
                amountToBridgeToGotchi,
                false,
                []
              )
            ).nativeFee,
          }
        );
      expect(await cardFacetPolygon.balanceOf(userAddress, tokenId)).to.equal(
        cardCount - amountToBridgeToGotchi
      );
      expect(
        await cardFacetGotchichain.balanceOf(userAddress, tokenId)
      ).to.equal(amountToBridgeToGotchi);

      // back to polygon, but just one
      const amountToBridgeToPolygon = 1;

      await cardFacetGotchichain
        .connect(signers[1])
        .setApprovalForAll(bridgeCardGotchichainSide.address, true);

      await bridgeCardGotchichainSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_A,
          userAddress,
          tokenId,
          amountToBridgeToPolygon,
          userAddress,
          ethers.constants.AddressZero,
          [],
          {
            value: (
              await bridgeCardGotchichainSide.estimateSendFee(
                chainId_A,
                userAddress,
                tokenId,
                amountToBridgeToPolygon,
                false,
                []
              )
            ).nativeFee,
          }
        );
      expect(
        await cardFacetGotchichain.balanceOf(
          bridgeCardGotchichainSide.address,
          tokenId
        )
      ).to.equal(1);
      // bridge from Polygon, to make Gotchi mint and transfer
      const amountToBridgeToGotchiFinal = 3;
      await bridgeCardPolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          tokenId,
          amountToBridgeToGotchiFinal,
          userAddress,
          ethers.constants.AddressZero,
          [],
          {
            value: (
              await bridgeCardPolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                tokenId,
                amountToBridgeToGotchiFinal,
                false,
                []
              )
            ).nativeFee,
          }
        );
      expect(await cardFacetGotchichain.balanceOf(userAddress, tokenId)).to.equal(
        4
      );
      expect(
        await cardFacetGotchichain.balanceOf(
          bridgeCardGotchichainSide.address,
          tokenId
        )
      ).to.equal(0);
    });
  });

  function createMetaData(editions: number, name: string) {
    const fileHash = "q".repeat(42); // 42 bytes
    const publisherName = "e".repeat(30); // 30 bytes
    const externalLink = "r".repeat(50); // 240 bytes
    const description = "d".repeat(120); // 120 bytes
    const artistName = "y".repeat(30); // 30 bytes
    const thumbnailHash = "t".repeat(42); // 42 bytes
    const fileType = "f".repeat(20); // 20 bytes
    const thumbnailType = "q".repeat(20); // 20 bytes

    return {
      fileHash,
      name,
      publisherName,
      externalLink,
      description,
      artistName,
      artist: artistAddress,
      publisher: artistAddress,
      royalty: [ethers.BigNumber.from(300), ethers.BigNumber.from(100)] as [
        BigNumber,
        BigNumber
      ],
      editions,
      thumbnailHash,
      fileType,
      thumbnailType,
    };
  }

  async function createSeriesAndMintFake(
    cardFacetWithOwner: FakeGotchisCardFacet,
    ownerAddress: any,
    userAddress: any,
    metadataFacetWithUser: MetadataFacet,
    metaData: any
  ): Promise<{ cardSeriesId: BigNumber; newMetadataId: BigNumber }> {
    const cardCount = 2535;
    const cardTransferAmount = 100;

    const receipt = await (
      await cardFacetWithOwner.startNewSeries(cardCount)
    ).wait();
    const event = receipt.events?.find(
      (event) => event.event === "NewSeriesStarted"
    );
    cardSeriesId = event?.args?.id;
    await cardFacetWithOwner.safeTransferFrom(
      ownerAddress,
      userAddress,
      cardSeriesId,
      cardTransferAmount,
      []
    );

    const receipt2 = await (
      await metadataFacetWithUser.addMetadata(metaData, cardSeriesId)
    ).wait();
    const event2 = receipt2.events?.find(
      (event) => event.event === "MetadataActionLog"
    );
    const newMetadataId = event2?.args?.id;
    return { cardSeriesId, newMetadataId };
  }

  async function setupBridge(
    polygonDiamond: any,
    gotchiDiamond: string,
    polygonBridgeFacet:
      | FakeGotchiPolygonXGotchichainBridgeFacet
      | FakeGotchiCardPolygonXGotchichainBridgeFacet,
    owner: Signer,
    gotchiBridgeFacet:
      | FakeGotchiPolygonXGotchichainBridgeFacet
      | FakeGotchiCardPolygonXGotchichainBridgeFacet,
    polygonBridgeContractName: string,
    gotchiBridgeContractName: string,
    hasMinGasToStore: boolean = true
  ) {
    const minGasToStore = 50000;

    const LZEndpointMock = await ethers.getContractFactory(
      LZEndpointMockCompiled.abi,
      LZEndpointMockCompiled.bytecode
    );

    const BridgePolygonSide = await ethers.getContractFactory(
      polygonBridgeContractName
    );
    const BridgeGotchichainSide = await ethers.getContractFactory(
      gotchiBridgeContractName
    );

    //Deploying LZEndpointMock contracts
    const lzEndpointMockA = await LZEndpointMock.deploy(chainId_A);
    const lzEndpointMockB = await LZEndpointMock.deploy(chainId_B);

    let bridgePolygonSide, bridgeGotchichainSide;

    if (hasMinGasToStore) {
      //Deploying bridge contracts
      bridgePolygonSide = await BridgePolygonSide.deploy(
        minGasToStore,
        lzEndpointMockA.address,
        polygonDiamond
      );
      bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
        minGasToStore,
        lzEndpointMockB.address,
        gotchiDiamond
      );
    } else {
      bridgePolygonSide = await BridgePolygonSide.deploy(
        lzEndpointMockA.address,
        polygonDiamond
      );
      bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
        lzEndpointMockB.address,
        gotchiDiamond
      );
    }

    lzEndpointMockA.setDestLzEndpoint(
      bridgeGotchichainSide.address,
      lzEndpointMockB.address
    );
    lzEndpointMockB.setDestLzEndpoint(
      bridgePolygonSide.address,
      lzEndpointMockA.address
    );

    await bridgePolygonSide.setTrustedRemote(
      chainId_B,
      ethers.utils.solidityPack(
        ["address", "address"],
        [bridgeGotchichainSide.address, bridgePolygonSide.address]
      )
    );
    await bridgeGotchichainSide.setTrustedRemote(
      chainId_A,
      ethers.utils.solidityPack(
        ["address", "address"],
        [bridgePolygonSide.address, bridgeGotchichainSide.address]
      )
    );

    //Set layer zero bridge on facet
    await polygonBridgeFacet
      .connect(owner)
      .setLayerZeroBridge(bridgePolygonSide.address);
    await gotchiBridgeFacet
      .connect(owner)
      .setLayerZeroBridge(bridgeGotchichainSide.address);

    const batchSizeLimit = 1;

    let transferGasPerTokenPolygonSide = BigNumber.from(0);
    let transferGasPerTokenGotchichainSide = BigNumber.from(0);

    if (hasMinGasToStore) {
      //Set batch size limit
      await bridgePolygonSide.setDstChainIdToBatchLimit(
        chainId_B,
        batchSizeLimit
      );
      await bridgeGotchichainSide.setDstChainIdToBatchLimit(
        chainId_A,
        batchSizeLimit
      );

      await bridgePolygonSide.setDstChainIdToTransferGas(chainId_B, 1950000);
      await bridgeGotchichainSide.setDstChainIdToTransferGas(
        chainId_A,
        1950000
      );
      transferGasPerTokenPolygonSide =
        await bridgePolygonSide.dstChainIdToTransferGas(chainId_B);
      transferGasPerTokenGotchichainSide =
        await bridgeGotchichainSide.dstChainIdToTransferGas(chainId_A);
    }

    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 1950000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 1950000);

    const minGasToTransferAndStorePolygonSide =
      await bridgePolygonSide.minDstGasLookup(chainId_B, 1);

    const minGasToTransferAndStoreGotchichainSide =
      await bridgeGotchichainSide.minDstGasLookup(chainId_A, 1);

    const polygonAdapterParams = ethers.utils.solidityPack(
      ["uint16", "uint256"],
      [
        1,
        minGasToTransferAndStorePolygonSide.add(transferGasPerTokenPolygonSide),
      ]
    );
    const gotchichainAdapterParams = ethers.utils.solidityPack(
      ["uint16", "uint256"],
      [
        1,
        minGasToTransferAndStoreGotchichainSide.add(
          transferGasPerTokenGotchichainSide
        ),
      ]
    );

    return {
      bridgePolygonSide,
      bridgeGotchichainSide,
      polygonAdapterParams,
      gotchichainAdapterParams,
    };
  }
});
