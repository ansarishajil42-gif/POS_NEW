import { db } from "../src/server/db/index.js";
import { tills, branches } from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763";

async function main() {
  console.log("=== TILLS FOR PARAMOUNT BAQALA ===");
  const allBranches = await db.select().from(branches).where(eq(branches.tenantId, TENANT_ID));
  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]));

  const allTills = await db
    .select()
    .from(tills)
    .where(eq(tills.tenantId, TENANT_ID));

  console.log(`Found ${allTills.length} tills:`);
  for (const t of allTills) {
    console.log({
      id: t.id,
      name: t.name,
      branch: branchMap.get(t.branchId) || t.branchId,
      status: t.status,
    });
  }
  process.exit(0);
}

main().catch(console.error);
