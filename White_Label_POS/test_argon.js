import { hash, verify } from "@node-rs/argon2";

async function testArgon() {
  console.log("Testing argon2 speed...");
  const startHash = Date.now();
  const hash = await hash("password123");
  const endHash = Date.now();
  console.log(`Hash time: ${endHash - startHash}ms`);

  const startVerify = Date.now();
  const valid = await verify(hash, "password123");
  const endVerify = Date.now();
  console.log(`Verify time: ${endVerify - startVerify}ms`);
  
  // also check argon defaults
  console.log("Defaults:", {});
}

testArgon();
