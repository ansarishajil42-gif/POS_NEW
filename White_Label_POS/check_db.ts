import { db } from "./src/server/db/index.js";
import { vendors, staffUsers } from "./src/server/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    const v = await db.query.vendors.findFirst({ where: eq(vendors.email, "vendor@globalfmcg.ae") });
    console.log("Vendor in DB:", v);
    
    const s = await db.query.staffUsers.findFirst({ where: eq(staffUsers.email, "vendor@globalfmcg.ae") });
    console.log("Staff user in DB:", s);
    
    process.exit(0);
}
main();
