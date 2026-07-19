import { Types } from "mongoose";

import { getSession } from "@/lib/auth/session";
import { requireSalerSession } from "@/lib/auth/require-saler";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import Annee from "@/lib/models/Annee";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import type { DashboardData, ExerciseBalance } from "./types";

const VALID_ORDER_STATUSES = ["CONFIRMED", "PAID", "DELIVERED"];
const VALID_EXPENSE_STATUSES = ["APPROVED"];
const oid = (value: string) => new Types.ObjectId(value);
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function resolveScope() {
  const session = await getSession();
  if (!session) throw new Error("SESSION_REQUIRED");
  if (session.accountType === "TENANT") {
    const context = await requireTenantSession();
    return { accountType: "TENANT" as const, tenantId: context.tenantId };
  }
  const context = await requireSalerSession();
  return {
    accountType: "SALER" as const,
    tenantId: context.tenantId,
    storeId: context.storeId,
  };
}

export async function getDashboardData(input: {
  chartAnnee?: string;
  targetAnnee?: string;
  rankingAnnee?: string;
  productsPage?: number;
  productSearch?: string;
}): Promise<DashboardData> {
  const scope = await resolveScope();
  const base = {
    tenantId: oid(scope.tenantId),
    ...(scope.accountType === "SALER" ? { shopId: oid(scope.storeId) } : {}),
  };
  const exercisesRaw = await Annee.find({
    tenantId: scope.tenantId,
    status: { $in: ["ACTIVE", "COMPLETED"] },
  })
    .select("_id slug debut fin status")
    .sort({ debut: -1 })
    .lean();
  const exercises = exercisesRaw.map((year) => ({
    id: year._id.toString(),
    slug: year.slug,
    label: `${year.debut.getFullYear()} - ${year.fin.getFullYear()}`,
    startDate: year.debut.toISOString(),
    endDate: year.fin.toISOString(),
    status: year.status,
  }));
  const active =
    exercises.find((year) => year.status === "ACTIVE") ?? exercises[0] ?? null;
  const validExercise = (value?: string) =>
    exercises.find((year) => year.id === value || year.slug === value)?.id ??
    null;
  const chartAnnee = validExercise(input.chartAnnee) ?? active?.id ?? null;
  const targetAnnee = validExercise(input.targetAnnee) ?? active?.id ?? null;
  const rankingAnnee =
    input.rankingAnnee === "all" ? null : validExercise(input.rankingAnnee);
  const page = Math.max(1, input.productsPage ?? 1);
  const search = input.productSearch?.trim() ?? "";
  const chartExercise = exercises.find((year) => year.id === chartAnnee);

  const [
    revenueGroups,
    expenseGroups,
    chartGroups,
    revenueBalances,
    expenseBalances,
    rankingResult,
  ] = await Promise.all([
    Commande.aggregate([
      { $match: { ...base, status: { $in: VALID_ORDER_STATUSES } } },
      {
        $group: {
          _id: "$currency",
          amount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Depense.aggregate([
      { $match: { ...base, status: { $in: VALID_EXPENSE_STATUSES } } },
      {
        $group: {
          _id: "$currency",
          amount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    chartAnnee && chartExercise
      ? Commande.aggregate([
          {
            $match: {
              ...base,
              anneeId: oid(chartAnnee),
              createdAt: {
                $gte: new Date(chartExercise.startDate),
                $lte: new Date(chartExercise.endDate),
              },
              status: { $in: VALID_ORDER_STATUSES },
            },
          },
          {
            $group: {
              _id: { currency: "$currency", month: { $month: "$createdAt" } },
              amount: { $sum: "$totalAmount" },
            },
          },
        ])
      : [],
    Commande.aggregate([
      { $match: { ...base, status: { $in: VALID_ORDER_STATUSES } } },
      {
        $group: {
          _id: { anneeId: "$anneeId", currency: "$currency" },
          amount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Depense.aggregate([
      { $match: { ...base, status: { $in: VALID_EXPENSE_STATUSES } } },
      {
        $group: {
          _id: { anneeId: "$anneeId", currency: "$currency" },
          amount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Commande.aggregate([
      {
        $match: {
          ...base,
          ...(rankingAnnee ? { anneeId: oid(rankingAnnee) } : {}),
          status: { $in: VALID_ORDER_STATUSES },
        },
      },
      { $unwind: "$commandes" },
      {
        $group: {
          _id: {
            productId: "$commandes.product",
            currency: "$commandes.currency",
          },
          designation: { $first: "$commandes.designation" },
          code: { $first: "$commandes.code" },
          quantitySold: { $sum: "$commandes.qte" },
          orderIds: { $addToSet: "$_id" },
          revenue: { $sum: "$commandes.total" },
        },
      },
      { $set: { orderCount: { $size: "$orderIds" } } },
      {
        $sort: {
          revenue: -1,
          quantitySold: -1,
          orderCount: -1,
          designation: 1,
          "_id.currency": 1,
        },
      },
      {
        $setWindowFields: {
          sortBy: { revenue: -1 },
          output: { rank: { $documentNumber: {} } },
        },
      },
      {
        $facet: {
          items: [
            ...(search
              ? [
                  {
                    $match: {
                      $or: [
                        {
                          designation: {
                            $regex: escapeRegex(search),
                            $options: "i",
                          },
                        },
                        {
                          code: { $regex: escapeRegex(search), $options: "i" },
                        },
                      ],
                    },
                  },
                ]
              : []),
            { $skip: (page - 1) * 10 },
            { $limit: 10 },
            {
              $lookup: {
                from: "products",
                localField: "_id.productId",
                foreignField: "_id",
                as: "product",
              },
            },
            { $set: { product: { $first: "$product" } } },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ]),
  ]);

  const chart = ["USD", "CDF"].map((currency) => ({
    name: `CA ${currency}`,
    currency,
    data: Array.from(
      { length: 12 },
      (_, index) =>
        chartGroups.find(
          (row) => row._id.currency === currency && row._id.month === index + 1,
        )?.amount ?? 0,
    ),
  }));
  const balances: ExerciseBalance[] = exercises.map((year) => {
    const currencies = ["USD", "CDF"].map((currency) => {
      const revenue =
        revenueBalances.find(
          (row) =>
            row._id.anneeId?.toString() === year.id &&
            row._id.currency === currency,
        )?.amount ?? 0;
      const expenses =
        expenseBalances.find(
          (row) =>
            row._id.anneeId?.toString() === year.id &&
            row._id.currency === currency,
        )?.amount ?? 0;
      return { currency, revenue, expenses, result: revenue - expenses };
    });
    return {
      anneeId: year.id,
      slug: year.slug,
      label: year.label,
      currencies,
      transactionCount: revenueBalances
        .filter((row) => row._id.anneeId?.toString() === year.id)
        .reduce((sum, row) => sum + row.count, 0),
      expenseCount: expenseBalances
        .filter((row) => row._id.anneeId?.toString() === year.id)
        .reduce((sum, row) => sum + row.count, 0),
    };
  });
  const ranking = rankingResult[0] ?? { items: [], meta: [] };
  const totalItems = ranking.meta[0]?.total ?? 0;
  return {
    scope: scope.accountType,
    metrics: {
      revenue: {
        totals: revenueGroups.map((row) => ({
          currency: row._id,
          amount: row.amount,
        })),
        transactionCount: revenueGroups.reduce(
          (sum, row) => sum + row.count,
          0,
        ),
      },
      expenses: {
        totals: expenseGroups.map((row) => ({
          currency: row._id,
          amount: row.amount,
        })),
        expenseCount: expenseGroups.reduce((sum, row) => sum + row.count, 0),
      },
    },
    exercises,
    selectedChartExercise: chartAnnee,
    selectedTargetExercise: targetAnnee,
    selectedRankingExercise: rankingAnnee,
    chart,
    balances,
    ranking: {
      items: ranking.items
        .filter((row: any) => row?._id?.productId)
        .map((row: any) => ({
          productId: row._id.productId.toString(),
          rank: row.rank,
          designation: row.designation ?? "Produit historique",
          code: row.code ?? "",
          category: row.product?.categorie ?? "Non classé",
          photo: row.product?.photos?.[0]?.url ?? null,
          quantitySold: row.quantitySold ?? 0,
          orderCount: row.orderCount ?? 0,
          revenue: row.revenue ?? 0,
          currency: row._id.currency ?? "CDF",
        })),
      page,
      limit: 10,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / 10)),
      search,
    },
  };
}
