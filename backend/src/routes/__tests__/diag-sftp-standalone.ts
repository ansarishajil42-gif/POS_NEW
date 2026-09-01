import { encryptSecret, decryptSecret } from "../aggregator-sftp.js";

async function runStandaloneDiagnostic() {
  console.log("\n🔍 --- STANDALONE SFTP DIAGNOSTIC & SANITIZATION TEST ---\n");

  const rawHostInput = "sftp://vendor-automation-sftp-live-me.prod.aws.qcommerce.live/";
  const rawUsernameInput = "TB_AE_4e9a0d34-3ba4-4396-96e6-e2e3e08694e8";
  const rawPasswordInput = "DummyLivePass123!";

  // 1. Host Sanitization Test
  let cleanHost = rawHostInput.trim();
  if (cleanHost.startsWith("sftp://")) cleanHost = cleanHost.replace("sftp://", "");
  if (cleanHost.startsWith("ssh://")) cleanHost = cleanHost.replace("ssh://", "");
  if (cleanHost.startsWith("https://")) cleanHost = cleanHost.replace("https://", "");
  if (cleanHost.includes("/")) cleanHost = cleanHost.split("/")[0];

  console.log("1️⃣ Host Protocol Prefix & Sanitization Inspection:");
  console.log(`   - Raw Input: "${rawHostInput}"`);
  console.log(`   - Protocol Prefix Detected: Yes ("sftp://")`);
  console.log(`   - Sanitized Hostname: "${cleanHost}"`);
  console.log(`   - Valid Domain Format: ${/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanHost)}`);

  // 2. Username Inspection
  console.log("\n2️⃣ Username Inspection:");
  console.log(`   - SFTP Username: "${rawUsernameInput}"`);
  console.log(`   - Valid Vendor Format (TB_AE_*): ${rawUsernameInput.startsWith("TB_AE_")}`);

  // 3. Encryption / Decryption & Whitespace Inspection
  const encrypted = encryptSecret(rawPasswordInput);
  const decrypted = decryptSecret(encrypted);

  console.log("\n3️⃣ Password Encoding & Decryption Integrity Inspection:");
  console.log(`   - Encrypted Format (IV:Tag:Cipher): ${encrypted.split(":").length === 3}`);
  console.log(`   - Decryption Success: ${decrypted === rawPasswordInput}`);
  console.log(`   - Raw Length vs Decrypted Length: ${rawPasswordInput.length} === ${decrypted.length}`);
  console.log(`   - Whitespace Clean (no leading/trailing spaces): ${decrypted === decrypted.trim()}`);

  // 4. Port Inspection
  const port = 22;
  console.log("\n4️⃣ Port Inspection:");
  console.log(`   - SFTP Port: ${port} (Type: ${typeof port})`);

  // 5. Standalone SSH Handshake Test to Live Host
  console.log("\n5️⃣ Standalone SSH2 SFTP Handshake Test to Live Host:");
  console.log(`   - Target: ${cleanHost}:${port}`);
  console.log(`   - User: ${rawUsernameInput}`);
  console.log("   - Initiating connection...");

  try {
    const SftpClient = (await import("ssh2-sftp-client")).default;
    const sftp = new SftpClient();

    await sftp.connect({
      host: cleanHost,
      port: port,
      username: rawUsernameInput,
      password: decrypted.trim(),
      readyTimeout: 20000,
      algorithms: {
        serverHostKey: [
          "ssh-rsa",
          "rsa-sha2-256",
          "rsa-sha2-512",
          "ecdsa-sha2-nistp256",
          "ecdsa-sha2-nistp384",
          "ecdsa-sha2-nistp521",
          "ssh-ed25519",
        ],
        cipher: [
          "aes128-ctr",
          "aes192-ctr",
          "aes256-ctr",
          "aes128-gcm",
          "aes128-gcm@openssh.com",
          "aes256-gcm",
          "aes256-gcm@openssh.com",
          "aes128-cbc",
          "aes192-cbc",
          "aes256-cbc",
        ],
        kex: [
          "curve25519-sha256",
          "curve25519-sha256@libssh.org",
          "ecdh-sha2-nistp256",
          "ecdh-sha2-nistp384",
          "ecdh-sha2-nistp521",
          "diffie-hellman-group14-sha256",
          "diffie-hellman-group14-sha1",
          "diffie-hellman-group1-sha1",
        ],
      },
    });

    console.log("   ✅ SUCCESS: Standalone SFTP handshake & authentication succeeded!");
    await sftp.end();
  } catch (err: any) {
    console.log(`   ❌ SFTP Handshake Error: "${err.message}"`);
  }

  console.log("\n=======================================================");
  console.log("DIAGNOSTIC SUMMARY COMPLETE");
  console.log("=======================================================\n");
}

runStandaloneDiagnostic().catch((e) => console.error(e));
