import { Types } from "mongoose";

import { getSession } from "@/lib/auth/session";
import { Saler, Tenant, User } from "@/lib/models/User";
import Store from "@/lib/models/Store";
import connectToDb from "@/lib/utils/db";
import type { AdminShellContextValue } from "@/types/admin-shell";

const tenantPermissions = [
  "dashboard:read",
  "tenant:manage",
  "stores:manage",
  "salers:manage",
  "products:manage",
  "stocks:manage",
  "reports:read",
];

const salerPermissions = [
  "workspace:read",
  "sales:manage",
  "customers:manage",
  "store-stock:read",
  "profile:read",
];

export async function getAdminShellAccount(): Promise<AdminShellContextValue | null> {
  const session = await getSession();

  if (!session || !Types.ObjectId.isValid(session.userId)) {
    return null;
  }

  await connectToDb();

  const user = await User.findById(session.userId)
    .select("_id pseudo telephone email matricule status photo")
    .lean();

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  if (session.accountType === "TENANT") {
    if (!session.tenantId || !Types.ObjectId.isValid(session.tenantId)) {
      return null;
    }

    const tenant = await Tenant.findOne({
      _id: session.tenantId,
      userId: user._id,
    })
      .select("_id status designation logo")
      .lean();

    if (!tenant || tenant.status !== "ACTIVE") {
      return null;
    }

    return {
      user: {
        id: user._id.toString(),
        pseudo: user.pseudo,
        email: user.email,
        telephone: user.telephone,
        matricule: user.matricule,
        photo: user.photo || null,
      },
      account: {
        type: "TENANT",
        tenantId: tenant._id.toString(),
        designation: tenant.designation,
        logo: tenant.logo || null,
      },
      permissions: tenantPermissions,
    };
  }

  if (session.accountType === "SALER") {
    if (
      !session.salerId ||
      !session.storeId ||
      !Types.ObjectId.isValid(session.salerId) ||
      !Types.ObjectId.isValid(session.storeId)
    ) {
      return null;
    }

    const saler = await Saler.findOne({
      _id: session.salerId,
      userId: user._id,
      storeId: session.storeId,
    })
      .select("_id storeId status")
      .lean();

    if (!saler || saler.status !== "ACTIVE") {
      return null;
    }

    const store = await Store.findById(saler.storeId)
      .select("_id tenantId designation")
      .lean();

    if (!store?.tenantId) {
      return null;
    }

    const tenant = await Tenant.findById(store.tenantId)
      .select("_id status designation logo")
      .lean();

    if (!tenant || tenant.status !== "ACTIVE") {
      return null;
    }

    return {
      user: {
        id: user._id.toString(),
        pseudo: user.pseudo,
        email: user.email,
        telephone: user.telephone,
        matricule: user.matricule,
        photo: user.photo || null,
      },
      account: {
        type: "SALER",
        tenantId: tenant._id.toString(),
        salerId: saler._id.toString(),
        storeId: saler?.storeId ? saler?.storeId.toString() : "",
        designation: tenant.designation,
        logo: tenant.logo || null,
        storeDesignation: store?.designation || null,
      },
      permissions: salerPermissions,
    };
  }

  return null;
}
