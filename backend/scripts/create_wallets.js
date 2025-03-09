import config from "./config.json";
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import fs from "fs";

const wallets = config.wallets;

for (let i = 0; i < 15; i++) {
    const pk = generatePrivateKey();
    let wallet = privateKeyToAccount(pk);
    console.log(wallet);
    wallets.push({
        address: wallet.address,
        private_key: pk
    });
}

config.wallets = wallets;

fs.writeFileSync("./scripts/config.json", JSON.stringify(config, null, 2));
