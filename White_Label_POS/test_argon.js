import * as argon2 from "argon2";

async function testArgon() {
  console.log("Testing argon2 speed...");
  const startHash = Date.now();
  const hash = await argon2.hash("password123");
  const endHash = Date.now();
  console.log(`Hash time: ${endHash - startHash}ms`);

  const startVerify = Date.now();
  const valid = await argon2.verify(hash, "password123");
  const endVerify = Date.now();
  console.log(`Verify time: ${endVerify - startVerify}ms`);
  
  // also check argon defaults
  console.log("Defaults:", argon2.defaults);
}

testArgon();
