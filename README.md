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

- DiamondLoupeFacet deployed: 0x23Bab61c16a6DB79BC0d2C8Bf729bb46276D70B3
- OwnershipFacet deployed: 0x48943B5a4C5B394B332503C82eED371968D47187
- FakeGotchisCardFacet deployed: 0xcDf36f6Cb259d116Cde7DBe9c7b65F3Db3ed7Bb1

#### FAKE Gotchis NFT Diamond

- DiamondCutFacet deployed: 0x49C3c8f2dc3a3808E09cbab3D4171C15417df191
  FAKE Gotchis NFT Diamond deployed: 0xBB7A12066dBE611C0F8e8BD1e80f1d6ffD1F4D21
- DiamondInit deployed: 0xD5C852C9f407450348A93Cd08cedE7a3FBe89480
- DiamondLoupeFacet deployed: 0x7C5A7BD98b6480fbBCE43f76209c5699d2ACF5e0
- OwnershipFacet deployed: 0xAf9acC93Bd71702448502D094D1D2f647B634217
- MetadataFacet deployed: 0x0387fF0463258a04F26531552f2a9A077Feb07fa
- FakeGotchisNFTFacet deployed: 0x94527D2FE607523DBfbf8F07e2db9917e6a7DACa

## Author

Contact:

- nick@perfectabstractions.com

## License

MIT license. See the license file.
Anyone can use or modify this software for their purposes.
