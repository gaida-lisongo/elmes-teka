"use server";

import { randomBytes, scrypt as callbackScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

import { deleteCloudinaryAsset } from "@/actions/cloudinary.actions";
import { createSessionCookie, deleteSession, getSession } from "@/lib/auth/session";
import connectToDb from "@/lib/utils/db";
import {
  Saler,
  Tenant,
  User,
  type AccountStatus,
  type TenantType,
} from "@/lib/models/User";
import Store from "@/lib/models/Store";

const scrypt = promisify(callbackScrypt);
const GENERIC_LOGIN_ERROR = "Identifiant ou mot de passe incorrect.";

type AccountType = "TENANT" | "SALER";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

export interface CreateTenantAccountInput {
  pseudo: string;
  telephone: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
  photo?: string | null;
  designation: string;
  logo?: string | null;
  type?: TenantType;
  description?: Array<{ title: string; content: string }>;
  documents?: Array<{ title: string; url: string }>;
  uploadedPublicIds?: string[];
}

export interface LoginInput {
  identifier: string;
  password: string;
  userId?: string;
}

export interface UserSearchResult {
  id: string;
  pseudo: string;
  telephone: string;
  email: string;
  accountType: AccountType | null;
  status: AccountStatus;
}

export interface AuthenticationResult {
  redirectTo: string;
  accountType: AccountType;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeTelephone(telephone: string): string {
  return telephone.replace(/[^\d+]/g, "").trim();
}

function normalizeIdentifier(identifier: string): string {
  return identifier.trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir une lettre majuscule.";
  if (!/[a-z]/.test(password)) return "Le mot de passe doit contenir une lettre minuscule.";
  if (!/\d/.test(password)) return "Le mot de passe doit contenir un chiffre.";
  return null;
}

async function hashPassword(password: string): Promise<string> {
  const normalizedPassword = password.normalize("NFKC");
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(normalizedPassword, salt, 64)) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  try {
    const [algorithm, salt, storedHash] = storedPassword.split("$");

    if (algorithm !== "scrypt" || !salt || !storedHash) {
      return false;
    }

    const storedHashBuffer = Buffer.from(storedHash, "hex");
    const derivedKey = (await scrypt(
      password.normalize("NFKC"),
      salt,
      storedHashBuffer.length
    )) as Buffer;

    return (
      derivedKey.length === storedHashBuffer.length &&
      timingSafeEqual(derivedKey, storedHashBuffer)
    );
  } catch {
    return false;
  }
}

async function generateUniqueMatricule(prefix: "TEN" | "SAL"): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const matricule = `${prefix}-${new Date().getFullYear()}-${randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    if (!(await User.exists({ matricule }))) {
      return matricule;
    }
  }

  throw new Error("matricule_unique_failed");
}

async function generateUniqueTenantReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const nRef = `REF-${randomBytes(5).toString("hex").toUpperCase()}`;

    if (!(await Tenant.exists({ nRef }))) {
      return nRef;
    }
  }

  throw new Error("tenant_reference_unique_failed");
}

async function generateUniqueSlug(designation: string): Promise<string> {
  const baseSlug = slugify(designation) || `tenant-${randomBytes(3).toString("hex")}`;
  let generatedSlug = baseSlug;
  let suffix = 1;

  while (await Tenant.exists({ slug: generatedSlug })) {
    generatedSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return generatedSlug;
}

function generateApiCredentials(): { apiKey: string; apiSecret: string } {
  return {
    apiKey: `pk_${uuidv4().replaceAll("-", "")}`,
    apiSecret: `sk_${randomBytes(32).toString("hex")}`,
  };
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskTelephone(telephone: string): string {
  if (telephone.length <= 4) return telephone;
  return `${telephone.slice(0, 3)}***${telephone.slice(-2)}`;
}

async function detectAccount(userId: Types.ObjectId): Promise<{
  accountType: AccountType | null;
  tenantId?: string;
  salerId?: string;
  storeId?: string;
  status?: AccountStatus;
}> {
  const tenant = await Tenant.findOne({ userId }).select("_id status").lean();

  if (tenant) {
    return {
      accountType: "TENANT",
      tenantId: tenant._id.toString(),
      status: tenant.status,
    };
  }

  const saler = await Saler.findOne({ userId }).select("_id storeId status").lean();

  if (saler) {
    const store = await Store.findById(saler.storeId).select("_id tenantId").lean();

    if (!store?.tenantId) {
      return { accountType: null };
    }

    const tenant = await Tenant.findById(store.tenantId).select("_id status").lean();

    if (!tenant) {
      return { accountType: null };
    }

    return {
      accountType: "SALER",
      tenantId: tenant._id.toString(),
      salerId: saler._id.toString(),
      storeId: saler?.storeId ? saler?.storeId.toString() : '',
      status: tenant.status === "ACTIVE" ? saler.status : tenant.status,
    };
  }

  return { accountType: null };
}

async function cleanupUploads(publicIds?: string[]): Promise<void> {
  if (!publicIds?.length) return;

  await Promise.allSettled(publicIds.map((publicId) => deleteCloudinaryAsset(publicId)));
}

export async function searchUsers(query: string): Promise<ActionResponse<UserSearchResult[]>> {
  try {
    const normalizedQuery = normalizeIdentifier(query);

    if (normalizedQuery.length < 2) {
      return { success: true, message: "Recherche trop courte.", data: [] };
    }

    await connectToDb();

    const escapedQuery = escapeRegExp(normalizedQuery.slice(0, 80));
    const telephoneQuery = normalizeTelephone(normalizedQuery);
    const orConditions: Record<string, unknown>[] = [
      { pseudo: { $regex: escapedQuery, $options: "i" } },
      { email: { $regex: escapedQuery, $options: "i" } },
    ];

    if (telephoneQuery.length >= 2) {
      orConditions.push({ telephone: { $regex: escapeRegExp(telephoneQuery), $options: "i" } });
    }

    const users = await User.find({ $or: orConditions })
      .select("_id pseudo telephone email status")
      .limit(8)
      .lean();

    const data = await Promise.all(
      users.map(async (user) => {
        const account = await detectAccount(user._id);

        return {
          id: user._id.toString(),
          pseudo: user.pseudo,
          telephone: maskTelephone(user.telephone),
          email: maskEmail(user.email),
          accountType: account.accountType,
          status: user.status,
        };
      })
    );

    return { success: true, message: "Recherche effectuee.", data };
  } catch (error) {
    console.error("SEARCH_USERS_ERROR", error);
    return { success: false, message: "Impossible de rechercher les utilisateurs." };
  }
}

export async function checkTenantIdentityAvailability(input: {
  email: string;
  telephone: string;
}): Promise<ActionResponse<null>> {
  try {
    await connectToDb();

    const email = normalizeEmail(input.email || "");
    const telephone = normalizeTelephone(input.telephone || "");

    if (!email || !telephone) {
      return {
        success: false,
        message: "Certaines informations sont invalides.",
      };
    }

    const existingUser = await User.findOne({ $or: [{ email }, { telephone }] })
      .select("_id")
      .lean();

    if (existingUser) {
      return {
        success: false,
        message: "Impossible de creer le compte avec ces informations.",
      };
    }

    return {
      success: true,
      message: "Informations disponibles.",
      data: null,
    };
  } catch (error) {
    console.error("CHECK_TENANT_IDENTITY_AVAILABILITY_ERROR", error);
    return {
      success: false,
      message: "Impossible de verifier ces informations.",
    };
  }
}

export async function createTenantAccount(
  input: CreateTenantAccountInput
): Promise<ActionResponse<{ userId: string; tenantId: string; redirectTo: string }>> {
  let createdUserId: Types.ObjectId | null = null;
  let createdTenantId: Types.ObjectId | null = null;

  try {
    await connectToDb();

    const pseudo = input.pseudo.trim();
    const telephone = normalizeTelephone(input.telephone);
    const email = normalizeEmail(input.email);
    const password = input.password || "";
    const designation = input.designation.trim();
    const description = (input.description || []).filter(
      (item) => item.title.trim() && item.content.trim()
    );
    const documents = (input.documents || []).filter(
      (document) => document.title.trim() && document.url.trim()
    );
    const errors: Record<string, string> = {};

    if (pseudo.length < 2) errors.pseudo = "Le pseudo doit contenir au moins 2 caracteres.";
    if (telephone.length < 8) errors.telephone = "Le numero de telephone est invalide.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "L'adresse e-mail est invalide.";
    if (designation.length < 2) errors.designation = "La designation est obligatoire.";
    if (!description.length) errors.description = "La presentation de l'entreprise est obligatoire.";
    if (input.passwordConfirmation !== undefined && password !== input.passwordConfirmation) {
      errors.passwordConfirmation = "La confirmation du mot de passe ne correspond pas.";
    }

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      await cleanupUploads(input.uploadedPublicIds);
      return { success: false, message: "Certaines informations sont invalides.", errors };
    }

    const existingUser = await User.findOne({ $or: [{ email }, { telephone }] })
      .select("_id")
      .lean();

    if (existingUser) {
      await cleanupUploads(input.uploadedPublicIds);
      return {
        success: false,
        message: "Impossible de creer le compte avec ces informations.",
      };
    }

    const matricule = await generateUniqueMatricule("TEN");
    const nRef = await generateUniqueTenantReference();
    const slug = await generateUniqueSlug(designation);
    const secure = await hashPassword(password);
    const { apiKey, apiSecret } = generateApiCredentials();

    const user = await User.create({
      pseudo,
      telephone,
      email,
      secure,
      matricule,
      status: "ACTIVE",
      boutique: null,
      photo: input.photo || null,
    });

    createdUserId = user._id as Types.ObjectId;

    const tenant = await Tenant.create({
      userId: user._id,
      storesId: [],
      apiKey,
      apiSecret,
      slug,
      designation,
      logo: input.logo || null,
      description,
      documents,
      status: "ACTIVE",
      type: input.type || "COMPANY",
      email,
      telephone,
      nRef,
    });

    createdTenantId = tenant._id as Types.ObjectId;

    await createSessionCookie({
      userId: user._id.toString(),
      accountType: "TENANT",
      tenantId: tenant._id.toString(),
    });

    return {
      success: true,
      message: "Le compte entrepreneur a ete cree.",
      data: {
        userId: user._id.toString(),
        tenantId: tenant._id.toString(),
        redirectTo: "/",
      },
    };
  } catch (error) {
    console.error("CREATE_TENANT_ACCOUNT_ERROR", error);

    if (createdTenantId) {
      await Tenant.deleteOne({ _id: createdTenantId });
    }

    if (createdUserId) {
      await User.deleteOne({ _id: createdUserId });
    }

    await cleanupUploads(input.uploadedPublicIds);

    return {
      success: false,
      message: "Impossible de creer le compte entrepreneur.",
    };
  }
}

export async function authenticateUser(
  input: LoginInput
): Promise<ActionResponse<AuthenticationResult>> {
  try {
    await connectToDb();

    const identifier = normalizeIdentifier(input.identifier || "");
    const password = input.password || "";

    if (!identifier || !password) {
      return { success: false, message: GENERIC_LOGIN_ERROR };
    }

    const query = input.userId && Types.ObjectId.isValid(input.userId)
      ? { _id: input.userId }
      : {
          $or: [
            { pseudo: identifier },
            { telephone: normalizeTelephone(identifier) },
            { email: normalizeEmail(identifier) },
            { matricule: identifier.toUpperCase() },
          ],
        };

    const user = await User.findOne(query)
      .select("+secure _id pseudo telephone email matricule status")
      .lean();

    if (!user || user.status !== "ACTIVE") {
      console.warn("AUTHENTICATE_USER_REJECTED", { reason: "user_missing_or_inactive" });
      return { success: false, message: GENERIC_LOGIN_ERROR };
    }

    const passwordIsValid = await verifyPassword(password, user.secure as string);

    if (!passwordIsValid) {
      console.warn("AUTHENTICATE_USER_REJECTED", { reason: "bad_password", userId: user._id.toString() });
      return { success: false, message: GENERIC_LOGIN_ERROR };
    }

    const account = await detectAccount(user._id);

    if (!account.accountType || account.status !== "ACTIVE") {
      console.warn("AUTHENTICATE_USER_REJECTED", { reason: "profile_missing_or_inactive", userId: user._id.toString() });
      return { success: false, message: GENERIC_LOGIN_ERROR };
    }

    await createSessionCookie({
      userId: user._id.toString(),
      accountType: account.accountType,
      tenantId: account.tenantId,
      salerId: account.salerId,
      storeId: account.storeId,
    });

    return {
      success: true,
      message: "Connexion reussie.",
      data: {
        redirectTo: "/",
        accountType: account.accountType,
      },
    };
  } catch (error) {
    console.error("AUTHENTICATE_USER_ERROR", error);
    return { success: false, message: GENERIC_LOGIN_ERROR };
  }
}

export async function getCurrentSession() {
  return getSession();
}

export async function logoutUser(): Promise<ActionResponse<null>> {
  try {
    await deleteSession();
    return { success: true, message: "Deconnexion reussie.", data: null };
  } catch (error) {
    console.error("LOGOUT_USER_ERROR", error);
    return { success: false, message: "Impossible de fermer la session." };
  }
}
