import postgres from "postgres";

const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "sa-east-1",
  "ca-central-1",
];

async function testRegions() {
  const password = "sharjeel.64068@iqra.edu";
  const encodedPassword = encodeURIComponent(password);
  const projectRef = "agauuzudkvbxecpukshq";

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgres://postgres.${projectRef}:${encodedPassword}@${host}:6543/postgres?sslmode=require`;
    console.log(`Testing region: ${region} (host: ${host})...`);
    
    const sql = postgres(connectionString, { idle_timeout: 2, connect_timeout: 2 });
    try {
      const result = await sql`SELECT 1 as connected`;
      console.log(`🎉 SUCCESS connected to region: ${region}!`);
      console.log("Connection string should be:", connectionString);
      process.exit(0);
    } catch (error: any) {
      console.log(`❌ Failed for ${region}:`, error.message || error);
    }
  }
  console.log("All tested regions failed.");
  process.exit(1);
}

testRegions();
