import { upgrade as upgradeFGCard } from "../card/upgrades/upgrade-pauseFGCard";
import { upgrade as upgradeFGNFT } from "../nft/upgrades/upgrade-pauseFGNFT";

export async function main() {
  await upgradeFGCard();
  await upgradeFGNFT();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
