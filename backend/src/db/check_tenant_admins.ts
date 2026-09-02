import { db } from "./index.js";
import { staffUsers, tenants } from "./schema.js";

async function main() {
  console.log("=== INSPECTING STAFF USERS IN DB ===");
  const users = await db.select().from(staffUsers);
  console.log(`Found ${users.length} staff user records:`);
  users.forEach((u) => {
    console.log(` - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Active: ${u.isActive}, Tenant: ${u.tenantId}`);
  });

  process.exit(0);
}

main().catch(console.error);
