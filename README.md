# Fake Gotchis Diamonds

This is an implementation for Fake Gotchis NFT
**Note:** The loupe functions in DiamondLoupeFacet.sol MUST be added to a diamond and are required by the EIP-2535 Diamonds standard.

## Installation

1. Clone this repo:

```console
git clone git@github.com:mudgen/diamond-3-hardhat.git
```

2. Install NPM packages:

```console
npm install
```

## Deployment

```console
npx hardhat run scripts/deploy.ts
```

### How the scripts/deploy.js script works

1. DiamondCutFacet is deployed.
1. The diamond is deployed, passing as arguments to the diamond constructor the owner address of the diamond and the DiamondCutFacet address. DiamondCutFacet has the `diamondCut` external function which is used to upgrade the diamond to add more functions.
1. The `DiamondInit` contract is deployed. This contains an `init` function which is called on the first diamond upgrade to initialize state of some state variables. Information on how the `diamondCut` function works is here: https://eips.ethereum.org/EIPS/eip-2535#diamond-interface
1. Facets are deployed.
1. The diamond is upgraded. The `diamondCut` function is used to add functions from facets to the diamond. In addition the `diamondCut` function calls the `init` function from the `DiamondInit` contract using `delegatecall` to initialize state variables.

How a diamond is deployed is not part of the EIP-2535 Diamonds standard. This implementation shows a usable example.

## Run tests:

```console
npx hardhat test
```

## Upgrade a diamond

Check the `scripts/deploy.ts` and or the `test/diamondTest.js` file for examples of upgrades.

Note that upgrade functionality is optional. It is possible to deploy a diamond that can't be upgraded, which is a 'Single Cut Diamond'. It is also possible to deploy an upgradeable diamond and at a later date remove its `diamondCut` function so it can't be upgraded any more.

Note that any number of functions from any number of facets can be added/replaced/removed on a diamond in a single transaction. In addition an initialization function can be executed in the same transaction as an upgrade to initialize any state variables required for an upgrade. This 'everything done in a single transaction' capability ensures a diamond maintains a correct and consistent state during upgrades.

## Facet Information

The `contracts/Diamond.sol` file shows an example of implementing a diamond.

The `contracts/facets/DiamondCutFacet.sol` file shows how to implement the `diamondCut` external function.

The `contracts/facets/DiamondLoupeFacet.sol` file shows how to implement the four standard loupe functions.

The `contracts/libraries/LibDiamond.sol` file shows how to implement Diamond Storage and a `diamondCut` internal function.

The `scripts/deploy.ts` file shows how to deploy a diamond.

The `test/diamondTest.js` file gives tests for the `diamondCut` function and the Diamond Loupe functions.

## Deployed Facets

### Mumbai

#### FAKE Gotchis Card Diamond

- DiamondCutFacet deployed: 0xB54ab846150561cc70d8bFa88E1e1D628AD736dD
- FAKE Gotchis Card Diamond deployed: 0x9E282FE4a0be6A0C4B9f7d9fEF10547da35c52EA
- DiamondInit deployed: 0x114730e7c0623CA258a7dAA69e4Ed2E61ccaCbD7
- DiamondLoupeFacet deployed: 0x0Da9b1aFC99912F1178FD4d1A8253Ac5Fa7CDD5B
- OwnershipFacet deployed: 0x236E7dE4625A0488134654353942276A0D3aaB0A
- FakeGotchisCardFacet deployed: 0x1FA1E9ddA528d00aA40Cb19eD3bdE975Cd6566B9

#### FAKE Gotchis NFT Diamond

- DiamondCutFacet deployed: 0xd3C122de3B9CD0DAF48816947A0968E0Af745Ab3
- FAKE Gotchis NFT Diamond deployed: 0x330088c3372f4F78cF023DF16E1e1564109191dc
- DiamondInit deployed: 0x013Ab21754f7159915ed27366d07f0Aa8b81F417
- DiamondLoupeFacet deployed: 0x985f5f933F2d2851980cbBDA1Dd56aE0e6d7f053
- OwnershipFacet deployed: 0xbaC4AF2DFCdc352eFdd1de88f36FcEf2F0A0E948
- MetadataFacet deployed: 0xb1B71f1c70E1D51563f383000c9201A73250c870
- FakeGotchisNFTFacet deployed: 0x777D54190BDF91a0DB420015e1134C7b9dfC4D29

## Author

Contact:

- nick@perfectabstractions.com

## License

MIT license. See the license file.
Anyone can use or modify this software for their purposes.
