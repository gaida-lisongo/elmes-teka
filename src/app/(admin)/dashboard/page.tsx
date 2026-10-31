import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DashboardRealtimeUpdater from "@/components/ecommerce/DashboardRealtimeUpdater";
import { DashboardAlerts } from "@/components/ecommerce/DashboardAlerts";
import { StoreSupervision } from "@/components/ecommerce/StoreSupervision";
import { TopClients } from "@/components/ecommerce/TopClients";
import ReferralCard from "@/components/ecommerce/ReferralCard";
import { getTenantSession } from "@/lib/auth/require-tenant";
import { getDashboardData } from "@/lib/dashboard/data";
import { getReferralSummary } from "@/lib/payments/pricing";
import { appOrigin } from "@/lib/utils/app-url";

export const metadata: Metadata = {
  title: "Tableau de bord | ELMES-TEKA",
  description: "Supervision commerciale ELMES-TEKA",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    chartAnnee?: string;
    targetAnnee?: string;
    rankingAnnee?: string;
    productsPage?: string;
    productSearch?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getDashboardData({
    chartAnnee: params.chartAnnee,
    targetAnnee: params.targetAnnee,
    rankingAnnee: params.rankingAnnee,
    productsPage: Number(params.productsPage) || 1,
    productSearch: params.productSearch,
  });
  const tenantSession = data.scope === "TENANT" ? await getTenantSession() : null;
  const referral = tenantSession ? await getReferralSummary(tenantSession.tenantId, await appOrigin()) : null;
  const taux = Number(process.env.TAUX) || 0;
  const exchange = Number(process.env.EXCHANGE) || 0;
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <DashboardRealtimeUpdater />
      {data.alerts.length > 0 && (
        <div className="col-span-12">
          <DashboardAlerts alerts={data.alerts} />
        </div>
      )}
      <div className="col-span-12">
        <EcommerceMetrics today={data.today} />
      </div>
      {referral && (
        <div className="col-span-12">
          <ReferralCard referral={referral} />
        </div>
      )}
      {data.scope === "TENANT" && data.stores.length > 0 && (
        <div className="col-span-12">
          <StoreSupervision stores={data.stores} />
        </div>
      )}
      <div className="col-span-12 xl:col-span-7">
        <MonthlySalesChart
          series={data.chart}
          exercises={data.exercises}
          selected={data.selectedChartExercise}
        />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget
          balances={data.balances}
          exercises={data.exercises}
          selected={data.selectedTargetExercise}
          taux={taux}
          exchange={exchange}
        />
      </div>
      <div
        className={
          data.topClients.length > 0
            ? "col-span-12 xl:col-span-8"
            : "col-span-12"
        }
      >
        <RecentOrders
          ranking={data.ranking}
          exercises={data.exercises}
          selected={data.selectedRankingExercise}
        />
      </div>
      {data.topClients.length > 0 && (
        <div className="col-span-12 xl:col-span-4">
          <TopClients clients={data.topClients} />
        </div>
      )}
    </div>
  );
}
