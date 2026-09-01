import { db } from "../../db/index.js";
import { aggregatorConnections } from "../../db/schema.js";
import { decryptSecret } from "../aggregator-sftp.js";
import { eq } from "drizzle-orm";

async function diagnoseSftp() {
  console.log("\n🔍 --- DIAGNOSTIC SFTP CONFIGURATION INSPECTION ---\n");

  let records: any[] = [];
  try {
    records = await db.select().from(aggregatorConnections);
  } catch (e: any) {
    console.log("DB query error:", e.message);
  }

  console.log(`Found ${records.length} connection records in database.`);

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    console.log(`\nRecord #${i + 1}:`);
    console.log(`  ID: ${r.id}`);
    console.log(`  Aggregator: ${r.aggregatorName}`);
    console.log(`  Raw sftpHost in DB: "${r.sftpHost}"`);
    console.log(`  Has "sftp://" prefix: ${r.sftpHost?.startsWith("sftp://")}`);
    console.log(`  sftpPort: ${r.sftpPort} (type: ${typeof r.sftpPort})`);
    console.log(`  sftpUsername: "${r.sftpUsername}"`);
    console.log(`  vendorId: "${r.vendorId}"`);
    console.log(`  remoteDirectory: "${r.remoteDirectory}"`);
    console.log(`  isActive: ${r.isActive}`);

    let decPass = "";
    if (r.sftpPassword) {
      decPass = decryptSecret(r.sftpPassword);
    }
    console.log(`  Password decrypted successfully: ${Boolean(decPass)}`);
    console.log(`  Password length: ${decPass.length}`);
    console.log(`  Password has leading whitespace: ${decPass !== decPass.trimStart()}`);
    console.log(`  Password has trailing whitespace: ${decPass !== decPass.trimEnd()}`);
    console.log(`  Password contains quotes/escapes: ${decPass.includes('"') || decPass.includes("'") || decPass.includes("\\")}`);

    // Cleaned Host Evaluation
    let cleanHost = r.sftpHost || "";
    if (cleanHost.startsWith("sftp://")) {
      cleanHost = cleanHost.replace("sftp://", "");
    }
    if (cleanHost.includes("/")) {
      cleanHost = cleanHost.split("/")[0];
    }
    console.log(`  Cleaned Host: "${cleanHost}"`);

    // Standalone connection attempt with cleaned values (without uploading)
    if (cleanHost && cleanHost !== "test.local" && cleanHost !== "invalid.host" && decPass) {
      console.log(`\n  🧪 Attempting Diagnostic SSH2 Handshake to ${cleanHost}:${r.sftpPort || 22}...`);
      try {
        const SftpClient = (await import("ssh2-sftp-client")).default;
        const sftp = new SftpClient();

        await sftp.connect({
          host: cleanHost,
          port: r.sftpPort || 22,
          username: r.sftpUsername || r.vendorId,
          password: decPass.trim(),
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
              "3des-cbc",
            ],
            kex: [
              "curve25519-sha256",
              "curve25519-sha256@libssh.org",
              "ecdh-sha2-nistp256",
              "ecdh-sha2-nistp384",
              "ecdh-sha2-nistp521",
              "diffie-hellman-group-exchange-sha256",
              "diffie-hellman-group14-sha256",
              "diffie-hellman-group14-sha1",
              "diffie-hellman-group1-sha1",
            ],
          },
        });

        console.log("  ✅ DIAGNOSTIC CONNECTION SUCCESSFUL! Host authenticated & SFTP session opened!");
        await sftp.end();
      } catch (connErr: any) {
        console.error(`  ❌ DIAGNOSTIC CONNECTION FAILED: ${connErr.message}`);
      }
    }
  }
}

diagnoseSftp().catch((e) => console.error("Diag failed:", e));
