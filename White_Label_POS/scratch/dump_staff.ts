import { db } from "../src/server/db/index.js";

async function main() {
    console.log("Fetching staff users...");
    const staff = await db.query.staffUsers.findMany();
    console.log(JSON.stringify(staff, null, 2));
    process.exit(0);
}
main();
