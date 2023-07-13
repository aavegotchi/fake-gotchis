## How to deploy

1. Set .env for NFT_DIAMOND_ADDRESS_MUMBAI, CARD_DIAMOND_ADDRESS_MUMBAI, LZ_ENDPOINT_ADDRESS_MUMBAI, LZ_ENDPOINT_ADDRESS_GOTCHICHAIN, LZ_CHAIN_ID_GOTCHICHAIN, LZ_CHAIN_ID_MUMBAI
2. Run `npx hardhat run scripts/bridge/deployGotchichain.ts --network supernets`
3. Set .env for BRIDGE_NFT_GOTCHICHAIN_ADDRESS, BRIDGE_CARD_GOTCHICHAIN_ADDRESS,
4. Run `npx hardhat run scripts/bridge/deployPolygon.ts --network mumbai/polygon`
5. Set .env for BRIDGE_CARD_POLYGON_ADDRESS, BRIDGE_NFT_POLYGON_ADDRESS
6. RUN `npx hardhat run scripts/bridge/setupBridgeGotchichain.ts --network supernets`
7. RUN `npx hardhat run scripts/bridge/setupBridgePolygon.ts --network mumbai/polygon`