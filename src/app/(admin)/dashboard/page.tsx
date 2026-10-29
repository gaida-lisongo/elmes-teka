import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { getDashboardData } from "@/lib/dashboard/data";

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
  const taux = Number(process.env.TAUX) || 0;
  const exchange = Number(process.env.EXCHANGE) || 0;
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics metrics={data.metrics} />
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
      <div className="col-span-12">
        <RecentOrders
          ranking={data.ranking}
          exercises={data.exercises}
          selected={data.selectedRankingExercise}
        />
      </div>
    </div>
  );
}
