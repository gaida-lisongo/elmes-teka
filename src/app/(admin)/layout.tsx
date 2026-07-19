import { redirect } from "next/navigation";

import { AdminShellProvider } from "@/context/AdminShellContext";
import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import Annee from "@/lib/models/Annee";
import AdminLayoutClient from "@/layout/AdminLayoutClient";
import type { MenuAppSection } from "@/layout/AppSidebar";

function formatAnneeLabel(debut: Date, fin: Date): string {
  return `${debut.getFullYear()} - ${fin.getFullYear()}`;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await getAdminShellAccount();

  if (!shell) {
    redirect("/signin");
  }

  const annees = shell.account.tenantId
    ? await Annee.find({
        tenantId: shell.account.tenantId,
        status: "ACTIVE",
      })
        .select("_id debut fin slug")
        .sort({ debut: -1 })
        .lean()
    : [];

  const dashboardMenu: MenuAppSection = {
    menuType: "APPLICATION",
    navItems: [
      {
        icon: "grid",
        name: "Dashboard",
        path: "/",
      },
    ],
  };

  const tenantMenu: MenuAppSection = {
    menuType: `${shell.account.designation || "TENANT"} TENANT`,
    navItems: [
      {
        icon: "user",
        name: "Agents",
        path: "/agents",
      },
      {
        icon: "page",
        name: "Articles",
        path: "/products",
      },
      {
        icon: "folder",
        name: "Points de ventes",
        path: "/stores",
      },
    ],
  };

  const salerMenu: MenuAppSection = {
    menuType: "VENDEUR",
    navItems: [
      {
        icon: "grid",
        name: "Espace de travail",
        path: "/",
      },
      {
        icon: "dollar",
        name: "Ventes",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/commandes/${annee.slug}`,
        })),
      },
      {
        icon: "dollar",
        name: "Dépenses",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/depenses/${annee.slug}`,
        })),
      },
      {
        icon: "box",
        name: "Stocks",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/stocks/${annee.slug}`,
        })),
      }
    ],
  };

  const menuApp: MenuAppSection[] =
    shell.account.type === "TENANT"
      ? [dashboardMenu, tenantMenu]
      : [salerMenu];

  return (
    <AdminShellProvider value={shell}>
      <AdminLayoutClient menuApp={menuApp}>{children}</AdminLayoutClient>
    </AdminShellProvider>
  );
}
