// Use this script to fill any nonce gaps caused by sending other transactions via other scripts

import hre from "hardhat";

(async () => {
  const { ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();

  const from = parseInt(process.env.FROM || '0', 10);
  const to = await signer.getTransactionCount('pending');

  console.log(`Sending self-transfers with nonces from ${from} to ${to}`);

  for (let nonce = from; nonce < to; nonce++) {
    const selfTransfer = await signer.sendTransaction({
      from: signer.address,
      to: signer.address,
      value: 0,
      nonce,
    })
    console.log(`Sent self-transfer with nonce ${nonce}`)
    await selfTransfer.wait();
  }
})().catch((error) => {
    console.error(error);
    process.exit(1);
})
