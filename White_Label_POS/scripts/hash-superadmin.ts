import * as argon2 from "argon2";
import { db } from "../src/server/db/index.js";
import { staffUsers } from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const email = "superadmin@cloudynationpos.com";
  const password = "superadmin@cloudynationpos.com";

  console.log(`Hashing password for ${email}...`);
  const hash = await argon2Hash(password);

  console.log(`Updating database...`);
  const result = await db.update(staffUsers)
    .set({ passwordHash: hash })
    .where(eq(staffUsers.email, email))
    .returning();

  if (result.length > 0) {
    console.log("Successfully updated password hash for Super Admin.");
  } else {
    console.error("User not found in database. Please make sure the user exists first.");
  }
}

main().catch(console.error);
