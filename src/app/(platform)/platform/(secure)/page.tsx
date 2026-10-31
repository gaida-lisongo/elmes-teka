import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { getPlatformOverview } from "@/lib/platform/data";

export const dynamic = "force-dynamic";

const statusColor = { PAID: "success", PENDING: "warning", FAILED: "error" } as const;
const statusLabel: Record<string, string> = { PAID: "Paye", PENDING: "En attente", FAILED: "Echoue" };

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default async function PlatformOverviewPage() {
  const data = await getPlatformOverview();
  const revenue = data.revenue.length
    ? data.revenue.map((r) => `${r.amount.toLocaleString("fr-FR")} ${r.currency}`).join(" · ")
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Supervision de la plateforme</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Toutes les entreprises inscrites sur ELMES-TEKA.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Entreprises" value={data.tenants.total} hint={`+${data.tenants.last30Days} sur 30 jours · ${data.tenants.referred} parrainees`} />
        <Stat label="Boutiques" value={data.stores} />
        <Stat label="Exercices" value={data.exercises.active} hint={`${data.exercises.pending} en attente · ${data.exercises.completed} clotures`} />
        <Stat label="Abonnements encaisses" value={revenue} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
          Derniers paiements
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Date", "Entreprise", "Objet", "Montant", "Reduction", "Statut", "Commande FlexPay"].map((h) => (
                  <TableCell key={h} isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.payments.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-sm text-gray-500">Aucun paiement pour le moment.</TableCell>
                </TableRow>
              )}
              {data.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap px-5 py-3 text-sm text-gray-500">{new Date(p.date).toLocaleString("fr-FR", { timeZone: "Africa/Kinshasa" })}</TableCell>
                  <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{p.tenant}</TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{p.label}</TableCell>
                  <TableCell className="whitespace-nowrap px-5 py-3 text-sm text-gray-800 dark:text-white/90">{p.amount} {p.currency}</TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-500">{p.discount ?? "-"}</TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge size="sm" color={statusColor[p.status as keyof typeof statusColor] ?? "light"}>{statusLabel[p.status] ?? p.status}</Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 font-mono text-xs text-gray-500">{p.orderNumber ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
          Meilleurs parrains
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Entreprise", "Code", "Filleuls inscrits", "Filleuls payants"].map((h) => (
                  <TableCell key={h} isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.topReferrers.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-sm text-gray-500">Aucun parrainage pour le moment.</TableCell>
                </TableRow>
              )}
              {data.topReferrers.map((r) => (
                <TableRow key={`${r.tenant}-${r.code}`}>
                  <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{r.tenant}</TableCell>
                  <TableCell className="px-5 py-3 font-mono text-xs text-gray-500">{r.code ?? "-"}</TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{r.total}</TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{r.paid}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
