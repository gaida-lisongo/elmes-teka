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

  const tenantGestionMenu: MenuAppSection = {
    menuType: "GESTION COMMERCIALE",
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
      {
        icon: "group",
        name: "Clients",
        path: "/clients",
      },
    ],
  };

  const tenantComptaMenu: MenuAppSection = {
    menuType: "COMPTABILITÉ",
    navItems: [
      {
        icon: "box",
        name: "Immobilisations",
        path: "/immobilisations",
      },
      {
        icon: "boxCube",
        name: "Stock",
        path: "/stocks",
      },
      {
        icon: "dollar",
        name: "Liquidités",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/liquidites/${annee.slug}`,
        })),
      },
      {
        icon: "list",
        name: "Créances",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/creances/${annee.slug}`,
        })),
      },
      {
        icon: "pie",
        name: "Fonds",
        path: "/fonds",
      },
      {
        icon: "table",
        name: "Dettes",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/dettes/${annee.slug}`,
        })),
      },
      {
        icon: "calendar",
        name: "Journal",
        path: "/comptabilite/journal",
      },
      {
        icon: "folder",
        name: "Clôture",
        path: "/comptabilite/cloture",
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
      },
    ],
  };

  const salerComptaMenu: MenuAppSection = {
    menuType: "COMPTABILITÉ",
    navItems: [
      {
        icon: "dollar",
        name: "Liquidités",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/liquidites/${annee.slug}`,
        })),
      },
      {
        icon: "list",
        name: "Créances",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/creances/${annee.slug}`,
        })),
      },
      {
        icon: "table",
        name: "Dettes",
        subItems: annees.map((annee) => ({
          name: formatAnneeLabel(annee.debut, annee.fin),
          path: `/dettes/${annee.slug}`,
        })),
      },
    ],
  };

  const menuApp: MenuAppSection[] =
    shell.account.type === "TENANT"
      ? [dashboardMenu, tenantGestionMenu, tenantComptaMenu]
      : [salerMenu, salerComptaMenu];

  return (
    <AdminShellProvider value={shell}>
      <AdminLayoutClient menuApp={menuApp}>{children}</AdminLayoutClient>
    </AdminShellProvider>
  );
}
