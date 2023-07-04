import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Signer, utils } from "ethers";
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

    ({ cardSeriesId, metadataId } = await createSeriesAndMintFake(
      cardFacetWithOwner,
      ownerAddress,
      userAddress,
      metadataFacetWithUser
    ));
    // ({ cardSeriesId: cardSeriesId2, metadataId: metadataId2 } =
    //   await createSeriesAndMintFake(
    //     cardFacetWithOwner,
    //     ownerAddress,
    //     userAddress,
    //     metadataFacetWithUser
    //   ));
  }

  beforeEach(async function () {
    await loadFixture(deployFixture);
  });

  describe("Bridge FakeGotchi NFT", async () => {
    it("Should mint a FakeGotchi on Polygon and bridge it to Gotchichain and back", async () => {
      await ethers.provider.send("evm_increaseTime", [5 * 86400]);
      await ethers.provider.send("evm_mine", []);
      await metadataFacetWithUser.mint(metadataId);

      const savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);

      expect(savedMetaData.minted).to.equal(true);

      const polygonMetadata = await nftFacetPolygon.tokenURI(metadataId);

      await nftFacetPolygon
        .connect(signers[1])
        .setApprovalForAll(bridgeNFTPolygonSide.address, true);

      await bridgeNFTPolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          metadataId,
          userAddress,
          ethers.constants.AddressZero,
          polygonNFTAdapterParams,
          {
            value: (
              await bridgeNFTPolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                metadataId,
                false,
                polygonNFTAdapterParams
              )
            ).nativeFee.mul(10),
          }
        );
      expect(await nftFacetPolygon.balanceOf(userAddress)).to.equal(9);
      expect(await nftFacetGotchichain.balanceOf(userAddress)).to.equal(1);
      expect(await nftFacetGotchichain.tokenURI(metadataId)).to.equal(polygonMetadata);


      await nftFacetGotchichain
        .connect(signers[1])
        .setApprovalForAll(bridgeNFTGotchichainSide.address, true);


      await bridgeNFTGotchichainSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_A,
          userAddress,
          metadataId,
          userAddress,
          ethers.constants.AddressZero,
          gotchichainNFTAdapterParams,
          {
            value: (
              await bridgeNFTGotchichainSide.connect(signers[1]).estimateSendFee(
                chainId_A,
                userAddress,
                metadataId,
                false,
                gotchichainNFTAdapterParams
              )
            ).nativeFee.mul(100),
          }
        );

        expect(await nftFacetGotchichain.balanceOf(userAddress)).to.equal(0);
        expect(await nftFacetPolygon.balanceOf(userAddress)).to.equal(10);
        expect(await nftFacetPolygon.tokenURI(metadataId)).to.equal(polygonMetadata);
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
        fakeGotchiPolygonBridgeFacet
          .connect(bob)
          .mintWithId(bob.address, 0)
      ).to.be.revertedWith(
        "LibAppStorage: Do not have access"
      );

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
      ).to.be.revertedWith(
        "LibAppStorage: Do not have access"
      );
    });
  });

  describe("Bridge FakeGotchi Card", async () => {
    it("Should mint a card on Polygon and bridge it", async () => {
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
        cardCount
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
        cardCount - amountToBridge
      );
      expect(
        await cardFacetGotchichain.balanceOf(userAddress, tokenId)
      ).to.equal(amountToBridge);
    });
  });

  async function createSeriesAndMintFake(
    cardFacetWithOwner: FakeGotchisCardFacet,
    ownerAddress: any,
    userAddress: any,
    metadataFacetWithUser: MetadataFacet
  ): Promise<{ cardSeriesId: BigNumber; metadataId: BigNumber }> {
    const cardCount = 2535;
    const cardTransferAmount = 100;

    // test metadata
    const editions = 10;
    const fileHash = "q".repeat(42); // 42 bytes
    const name = "w".repeat(50); // 50 bytes
    const publisherName = "e".repeat(30); // 30 bytes
    const externalLink = "r".repeat(50); // 240 bytes
    const description = "d".repeat(120); // 120 bytes
    const artistName = "y".repeat(30); // 30 bytes
    const thumbnailHash = "t".repeat(42); // 42 bytes
    const fileType = "f".repeat(20); // 20 bytes
    const thumbnailType = "q".repeat(20); // 20 bytes

    const metaData = {
      fileHash,
      name,
      publisherName,
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
    };

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
    metadataId = event2?.args?.id;
    return { cardSeriesId, metadataId };
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
        minGasToTransferAndStorePolygonSide.add(
          transferGasPerTokenPolygonSide
        ),
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
