async function run() {
  // bypass ensureSuperAdmin temporarily by mocking it
  const { createTenantServerFn } = await import("./src/lib/super-admin-server");
  
  const res = await createTenantServerFn({
    data: {
      name: "Test Tenant 123",
      subdomain: "test1234",
      plan: "Starter",
      trn: "12345",
      adminName: "Admin",
      adminEmail: "testadmin@test.com",
      adminPhone: "12345",
      adminAddress: "Address",
      adminPassword: "password123",
    },
  } as any);
  
  console.log("Result:", res);
  process.exit(0);
}
run();

