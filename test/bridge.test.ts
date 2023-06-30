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
  let polygonAdapterParams: any;
  let gotchichainAdapterParams: any;

  let cardSeriesId2: BigNumber;
  let metadataId2: BigNumber;

  const chainId_A = 1;
  const chainId_B = 2;

  let LZEndpointMock: any,
    bridgePolygonSide: FakeGotchiBridgePolygonSide,
    bridgeGotchichainSide: FakeGotchiBridgeGotchichainSide;
  let lzEndpointMockA: any, lzEndpointMockB: any;

  let fakeGotchiPolygonBridgeFacet: FakeGotchiPolygonXGotchichainBridgeFacet;
  let fakeGotchiGotchichainBridgeFacet: FakeGotchiPolygonXGotchichainBridgeFacet;

  let fakeGotchisGotchiCardDiamond: string;
  let fakeGotchisGotchiNftDiamond: string;

  let metadataId: BigNumber;

  async function deployFixture() {
    const diamondsPolygon = await deployDiamonds();
    fakeGotchisPolygonCardDiamond = diamondsPolygon.fakeGotchisCardDiamond;
    fakeGotchisPolygonNftDiamond = diamondsPolygon.fakeGotchisNftDiamond;

    const diamondsGotchi = await deployDiamonds();
    fakeGotchisGotchiCardDiamond = diamondsGotchi.fakeGotchisCardDiamond;
    fakeGotchisGotchiNftDiamond = diamondsGotchi.fakeGotchisNftDiamond;

    const signers = await ethers.getSigners();
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

    ({
      LZEndpointMock,
      lzEndpointMockA,
      lzEndpointMockB,
      bridgePolygonSide,
      bridgeGotchichainSide,
      polygonAdapterParams,
      gotchichainAdapterParams,
    } = await setupBridge(
      LZEndpointMock,
      lzEndpointMockA,
      lzEndpointMockB,
      bridgePolygonSide,
      fakeGotchisPolygonNftDiamond,
      bridgeGotchichainSide,
      fakeGotchisGotchiNftDiamond,
      fakeGotchiPolygonBridgeFacet,
      owner,
      fakeGotchiGotchichainBridgeFacet,
      polygonAdapterParams,
      gotchichainAdapterParams
    ));
    ({ cardSeriesId, metadataId } = await createSeriesAndMintFake(
      cardFacetWithOwner,
      ownerAddress,
      userAddress,
      metadataFacetWithUser
    ));
    ({ cardSeriesId: cardSeriesId2, metadataId: metadataId2 } =
      await createSeriesAndMintFake(
        cardFacetWithOwner,
        ownerAddress,
        userAddress,
        metadataFacetWithUser
      ));
  }

  beforeEach(async function () {
    await loadFixture(deployFixture);
  });

  describe("Bridge FakeGotchi NFT", async () => {
    it("Should mint a FakeGotchi on Polygon and bridge it", async () => {
      await ethers.provider.send("evm_increaseTime", [5 * 86400]);
      await ethers.provider.send("evm_mine", []);
      await metadataFacetWithUser.mint(metadataId);
      const savedMetaData = await metadataFacetWithUser.getMetadata(metadataId);

      expect(savedMetaData.minted).to.equal(true);
      const signers = await ethers.getSigners();

      await nftFacetPolygon
        .connect(signers[1])
        .setApprovalForAll(bridgePolygonSide.address, true);
      let sendFromTx = await bridgePolygonSide
        .connect(signers[1])
        .sendFrom(
          userAddress,
          chainId_B,
          userAddress,
          metadataId,
          userAddress,
          ethers.constants.AddressZero,
          polygonAdapterParams,
          {
            value: (
              await bridgePolygonSide.estimateSendFee(
                chainId_B,
                userAddress,
                metadataId,
                false,
                polygonAdapterParams
              )
            ).nativeFee.mul(3),
          }
        );
      await sendFromTx.wait();
      expect(await nftFacetPolygon.balanceOf(userAddress)).to.equal(9);
      expect(await nftFacetGotchichain.balanceOf(userAddress)).to.equal(1);
      // console.log(await nftFacetGotchichain.tokenIdsOfOwner(userAddress));
      // console.log(await nftFacetGotchichain.tokenURI(0));
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

    const receipt = await(
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
    const receipt2 = await(
      await metadataFacetWithUser.addMetadata(metaData, cardSeriesId)
    ).wait();
    const event2 = receipt2.events?.find(
      (event) => event.event === "MetadataActionLog"
    );
    metadataId = event2?.args?.id;
    return { cardSeriesId, metadataId };
  }

  async function setupBridge(
    LZEndpointMock: any,
    lzEndpointMockA: any,
    lzEndpointMockB: any,
    bridgePolygonSide: FakeGotchiBridgePolygonSide,
    fakeGotchisPolygonNftDiamond: any,
    bridgeGotchichainSide: FakeGotchiBridgeGotchichainSide,
    fakeGotchisGotchiNftDiamond: string,
    fakeGotchiPolygonBridgeFacet: FakeGotchiPolygonXGotchichainBridgeFacet,
    owner: Signer,
    fakeGotchiGotchichainBridgeFacet: FakeGotchiPolygonXGotchichainBridgeFacet,
    polygonAdapterParams: any,
    gotchichainAdapterParams: any
  ) {
    const minGasToStore = 50000;

    LZEndpointMock = await ethers.getContractFactory(
      LZEndpointMockCompiled.abi,
      LZEndpointMockCompiled.bytecode
    );

    const BridgePolygonSide = await ethers.getContractFactory(
      "FakeGotchiBridgePolygonSide"
    );
    const BridgeGotchichainSide = await ethers.getContractFactory(
      "FakeGotchiBridgeGotchichainSide"
    );

    //Deploying LZEndpointMock contracts
    console.log("Deploying LZEndpointMock contracts");
    lzEndpointMockA = await LZEndpointMock.deploy(chainId_A);
    console.log("lzEndpointMockA deployed at ", lzEndpointMockA.address);
    lzEndpointMockB = await LZEndpointMock.deploy(chainId_B);
    console.log("lzEndpointMockB deployed at ", lzEndpointMockB.address);

    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(
      minGasToStore,
      lzEndpointMockA.address,
      fakeGotchisPolygonNftDiamond
    );
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
      minGasToStore,
      lzEndpointMockB.address,
      fakeGotchisGotchiNftDiamond
    );

    console.log("Setting LZEndpointMockA dest to bridgeGotchichainSide");
    lzEndpointMockA.setDestLzEndpoint(
      bridgeGotchichainSide.address,
      lzEndpointMockB.address
    );
    console.log("Setting LZEndpointMockB dest to bridgePolygonSide");
    lzEndpointMockB.setDestLzEndpoint(
      bridgePolygonSide.address,
      lzEndpointMockA.address
    );

    console.log("Setting bridgePolygonSide trusted remote");
    await bridgePolygonSide.setTrustedRemote(
      chainId_B,
      ethers.utils.solidityPack(
        ["address", "address"],
        [bridgeGotchichainSide.address, bridgePolygonSide.address]
      )
    );
    console.log("Setting bridgeGotchichainSide trusted remote");
    await bridgeGotchichainSide.setTrustedRemote(
      chainId_A,
      ethers.utils.solidityPack(
        ["address", "address"],
        [bridgePolygonSide.address, bridgeGotchichainSide.address]
      )
    );

    console.log("Setting bridgePolygonSide minDstGas");
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 35000);
    await bridgePolygonSide.setMinDstGas(chainId_B, 2, 35000);
    console.log("Setting bridgeGotchichainSide minDstGas");
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 150000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 2, 150000);

    //Set layer zero bridge on facet
    await fakeGotchiPolygonBridgeFacet
      .connect(owner)
      .setLayerZeroBridge(bridgePolygonSide.address);
    await fakeGotchiGotchichainBridgeFacet
      .connect(owner)
      .setLayerZeroBridge(bridgeGotchichainSide.address);

    const batchSizeLimit = 1;

    //Set batch size limit
    await bridgePolygonSide.setDstChainIdToBatchLimit(
      chainId_B,
      batchSizeLimit
    );
    await bridgeGotchichainSide.setDstChainIdToBatchLimit(
      chainId_A,
      batchSizeLimit
    );

    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 1950000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 1950000);

    await bridgePolygonSide.setDstChainIdToTransferGas(chainId_B, 1950000);
    await bridgeGotchichainSide.setDstChainIdToTransferGas(chainId_A, 1950000);

    const minGasToTransferAndStorePolygonSide =
      await bridgePolygonSide.minDstGasLookup(chainId_B, 1);
    const transferGasPerTokenPolygonSide =
      await bridgePolygonSide.dstChainIdToTransferGas(chainId_B);

    const minGasToTransferAndStoreGotchichainSide =
      await bridgeGotchichainSide.minDstGasLookup(chainId_A, 1);
    const transferGasPerTokenGotchichainSide =
      await bridgeGotchichainSide.dstChainIdToTransferGas(chainId_A);

    polygonAdapterParams = ethers.utils.solidityPack(
      ["uint16", "uint256"],
      [
        1,
        minGasToTransferAndStorePolygonSide.add(
          transferGasPerTokenPolygonSide.mul(2)
        ),
      ]
    );
    gotchichainAdapterParams = ethers.utils.solidityPack(
      ["uint16", "uint256"],
      [
        1,
        minGasToTransferAndStoreGotchichainSide.add(
          transferGasPerTokenGotchichainSide.mul(2)
        ),
      ]
    );
    return {
      LZEndpointMock,
      lzEndpointMockA,
      lzEndpointMockB,
      bridgePolygonSide,
      bridgeGotchichainSide,
      polygonAdapterParams,
      gotchichainAdapterParams,
    };
  }
});
