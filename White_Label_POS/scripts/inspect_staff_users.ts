import { db } from "../src/server/db/index.js";
import { staffUsers, branches } from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763";

async function main() {
  console.log("=== STAFF USERS FOR PARAMOUNT BAQALA ===");
  const allBranches = await db.select().from(branches).where(eq(branches.tenantId, TENANT_ID));
  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]));

  const staff = await db
    .select({
      id: staffUsers.id,
      name: staffUsers.name,
      email: staffUsers.email,
      role: staffUsers.role,
      branchId: staffUsers.branchId,
      hasPin: staffUsers.pinHash,
      hasPassword: staffUsers.passwordHash,
      isActive: staffUsers.isActive,
    })
    .from(staffUsers)
    .where(eq(staffUsers.tenantId, TENANT_ID));

  console.log(`Found ${staff.length} staff users:`);
  for (const s of staff) {
    const branchName = s.branchId ? branchMap.get(s.branchId) || s.branchId : "All / Head Office (None)";
    console.log({
      id: s.id,
      name: s.name,
      email: s.email ? "(Set: " + s.email + ")" : "(Empty/None)",
      role: s.role,
      branch: branchName,
      hasPin: !!s.hasPin,
      isActive: s.isActive,
    });
  }

  process.exit(0);
}

main().catch(console.error);
