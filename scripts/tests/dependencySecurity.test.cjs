const assert = require("node:assert/strict");
const { test } = require("node:test");
const { Response } = require("undici");
const { Wallet, utils } = require("ethers");

test("Undici parses fields and binary files with the patched Busboy", async () => {
  const boundary = "dependency-security-test";
  const bytes = Buffer.from([0, 1, 127, 255]);
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="field"\r\n` +
        "__proto__: first\r\n__proto__: second\r\n" +
        "constructor: first\r\nconstructor: second\r\n\r\nvalue\r\n" +
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="file.bin"\r\n` +
        "Content-Type: application/octet-stream\r\n\r\n"
    ),
    bytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const data = await new Response(body, {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
  }).formData();

  assert.equal(data.get("field"), "value");
  assert.equal(data.get("file").name, "file.bin");
  assert.deepEqual(Buffer.from(await data.get("file").arrayBuffer()), bytes);
});

test("ethers 5 signs messages and transactions with the patched Elliptic", async () => {
  // Public test key; never uses an account or hardware wallet from the environment.
  const wallet = new Wallet("0x" + "1".padStart(64, "0"));
  const address = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf";
  const message = Uint8Array.from([0, 1, 127, 255]);
  assert.equal(wallet.address, address);
  assert.equal(
    utils.verifyMessage(message, await wallet.signMessage(message)),
    address
  );

  const transaction = await wallet.signTransaction({
    chainId: 137,
    nonce: 0,
    to: address,
    value: 1,
    gasLimit: 21000,
    gasPrice: 1,
  });
  const parsed = utils.parseTransaction(transaction);
  assert.equal(parsed.from, address);
  assert.equal(parsed.chainId, 137);
  assert.equal(parsed.value.toNumber(), 1);
});
