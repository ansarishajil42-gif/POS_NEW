import { sql, eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { payrollRuns, branches } from './src/db/schema.js';

const sqlClient = postgres('postgres://postgres.agauuzudkvbxecpukshq:sharjeel.64068%40iqra.edu@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
const db = drizzle(sqlClient);

async function check() {
  try {
    const tenantId = 'b6ae6062-b05f-451c-a1ab-5bdaac17b763';
    const rows = await db
      .select({
        id: payrollRuns.id,
        month: payrollRuns.month,
        branchId: payrollRuns.branchId,
        branchName: branches.name,
        status: payrollRuns.status,
        totalGross: payrollRuns.totalGross,
        totalDeductions: payrollRuns.totalDeductions,
        totalNet: payrollRuns.totalNet,
        generatedBy: payrollRuns.generatedBy,
        generatedAt: payrollRuns.generatedAt,
        approvedBy: payrollRuns.approvedBy,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        createdAt: payrollRuns.createdAt,
      })
      .from(payrollRuns)
      .leftJoin(branches, eq(payrollRuns.branchId, branches.id))
      .where(eq(payrollRuns.tenantId, tenantId))
      .orderBy(desc(payrollRuns.month), desc(payrollRuns.createdAt));
    console.log('--- GET /runs RESULT ---');
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('--- GET /runs ERROR ---', error);
  } finally {
    process.exit(0);
  }
}

check();

