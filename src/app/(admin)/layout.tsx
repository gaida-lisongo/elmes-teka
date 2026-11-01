import { redirect } from "next/navigation";
import type { Types } from "mongoose";

import { AdminShellProvider } from "@/context/AdminShellContext";
import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import Annee from "@/lib/models/Annee";
import { Tenant } from "@/lib/models/User";
import AdminLayoutClient from "@/layout/AdminLayoutClient";
import type { MenuAppSection } from "@/layout/AppSidebar";
import type { Plan } from "@/lib/payments/plans";

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

  // Résoudre l'exercice actif pour les menus conditionnels (tenant uniquement)
  let activePlan: Plan | null = null;
  if (shell.account.type === "TENANT" && shell.account.tenantId) {
    const tenantDoc = await Tenant.findById(shell.account.tenantId)
      .select("activeAnneeId")
      .lean();

    let activeAnneeId: Types.ObjectId | null =
      (tenantDoc?.activeAnneeId as Types.ObjectId | null | undefined) ?? null;

    // Fallback : dernier exercice ACTIVE+PAID si activeAnneeId non défini
    if (!activeAnneeId) {
      const fallback = await Annee.findOne({
        tenantId: shell.account.tenantId,
        status: "ACTIVE",
        "provider.status": "PAID",
      })
        .select("_id plan")
        .sort({ fin: -1 })
        .lean();
      activeAnneeId = fallback?._id ?? null;
      if (fallback) activePlan = fallback.plan as Plan;
    } else {
      const activeAnnee = await Annee.findById(activeAnneeId)
        .select("plan")
        .lean();
      if (activeAnnee) activePlan = activeAnnee.plan as Plan;
    }
  }

  const dashboardMenu: MenuAppSection = {
    menuType: "APPLICATION",
    navItems: [
      {
        icon: "grid",
        name: "Dashboard",
        path: "/dashboard",
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
        path: "/dashboard",
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

  const intelligenceMenu: MenuAppSection = {
    menuType: "INTELLIGENCE",
    navItems: [
      {
        icon: "bolt",
        name: "Analyses",
        path: "/intelligence",
      },
    ],
  };

  const advisorMenu: MenuAppSection = {
    menuType: "IA CONSEILLER",
    navItems: [
      {
        icon: "chat",
        name: "Conseiller IA",
        path: "/advisor",
      },
    ],
  };

  const tenantMenuSections: MenuAppSection[] = [
    dashboardMenu,
    tenantGestionMenu,
    tenantComptaMenu,
  ];
  if (activePlan === "BUSINESS" || activePlan === "PREMIUM") {
    tenantMenuSections.push(intelligenceMenu);
  }
  if (activePlan === "PREMIUM") {
    tenantMenuSections.push(advisorMenu);
  }

  const menuApp: MenuAppSection[] =
    shell.account.type === "TENANT"
      ? tenantMenuSections
      : [salerMenu, salerComptaMenu];

  return (
    <AdminShellProvider value={shell}>
      <AdminLayoutClient menuApp={menuApp}>{children}</AdminLayoutClient>
    </AdminShellProvider>
  );
}
