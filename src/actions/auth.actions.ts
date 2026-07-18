"use server";

import crypto, {
  randomBytes,
  scrypt as callbackScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

import connectToDb from "@/lib/utils/db";
import {
  Saler,
  Tenant,
  User,
  type AccountStatus,
  type TenantType,
} from "@/lib/models/User";

/* =========================================================
   CONFIGURATION
========================================================= */

const scrypt = promisify(callbackScrypt);

const SESSION_COOKIE_NAME = "commerce_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type UserRole = "TENANT" | "SALER";

/* =========================================================
   TYPES PUBLICS
========================================================= */

export type ActionResponse<T = undefined> =
  | {
      success: true;
      message: string;
      data: T;
    }
  | {
      success: false;
      message: string;
      errors?: Record<string, string>;
    };

export interface CreateTenantAccountInput {
  pseudo: string;
  telephone: string;
  email: string;
  password: string;

  designation: string;
  slug?: string;
  logo?: string;
  type?: TenantType;

  description?: Array<{
    title: string;
    content: string;
  }>;

  documents?: Array<{
    title: string;
    url: string;
  }>;
}

export interface CreateSalerAccountInput {
  pseudo: string;
  telephone: string;
  email: string;
  password: string;
  storeId: string;
}

export interface LoginInput {
  matricule: string;
  password: string;
}

export interface AuthenticationResult {
  user: {
    id: string;
    pseudo: string;
    telephone: string;
    email: string;
    matricule: string;
    role: UserRole;
  };

  profile: {
    id: string;
    status: AccountStatus;
    tenantId?: string;
    salerId?: string;
    storeId?: string;
    designation?: string;
    slug?: string;
  };

  redirectTo: string;
}

export interface SessionPayload {
  userId: string;
  matricule: string;
  role: UserRole;
  tenantId?: string;
  salerId?: string;
  storeId?: string;
  issuedAt: number;
  expiresAt: number;
}

/* =========================================================
   MOT DE PASSE AVEC CRYPTO.SCRYPT
========================================================= */

async function hashPassword(password: string): Promise<string> {
  const normalizedPassword = password.normalize("NFKC");
  const salt = randomBytes(16).toString("hex");

  const derivedKey = (await scrypt(
    normalizedPassword,
    salt,
    64
  )) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  storedPassword: string
): Promise<boolean> {
  try {
    const [algorithm, salt, storedHash] =
      storedPassword.split("$");

    if (
      algorithm !== "scrypt" ||
      !salt ||
      !storedHash
    ) {
      return false;
    }

    const normalizedPassword = password.normalize("NFKC");

    const storedHashBuffer = Buffer.from(
      storedHash,
      "hex"
    );

    const derivedKey = (await scrypt(
      normalizedPassword,
      salt,
      storedHashBuffer.length
    )) as Buffer;

    if (derivedKey.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(
      derivedKey,
      storedHashBuffer
    );
  } catch {
    return false;
  }
}

/* =========================================================
   OUTILS DE NORMALISATION
========================================================= */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeTelephone(telephone: string): string {
  return telephone.replace(/[^\d+]/g, "").trim();
}

function normalizeMatricule(matricule: string): string {
  return matricule.trim().toUpperCase();
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
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir une lettre majuscule.";
  }

  if (!/[a-z]/.test(password)) {
    return "Le mot de passe doit contenir une lettre minuscule.";
  }

  if (!/\d/.test(password)) {
    return "Le mot de passe doit contenir un chiffre.";
  }

  return null;
}

/* =========================================================
   GÉNÉRATION DES IDENTIFIANTS
========================================================= */

async function generateUniqueMatricule(
  prefix: "TEN" | "SAL"
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const year = new Date().getFullYear();

    const randomPart = randomBytes(4)
      .toString("hex")
      .toUpperCase();

    const matricule = `${prefix}-${year}-${randomPart}`;

    const alreadyExists = await User.exists({
      matricule,
    });

    if (!alreadyExists) {
      return matricule;
    }
  }

  throw new Error(
    "Impossible de générer un matricule unique."
  );
}

async function generateUniqueTenantReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const randomPart = randomBytes(5)
      .toString("hex")
      .toUpperCase();

    const reference = `REF-${randomPart}`;

    const alreadyExists = await Tenant.exists({
      nRef: reference,
    });

    if (!alreadyExists) {
      return reference;
    }
  }

  throw new Error(
    "Impossible de générer une référence unique."
  );
}

async function generateUniqueSlug(
  designation: string,
  requestedSlug?: string
): Promise<string> {
  const baseSlug =
    slugify(requestedSlug || designation) ||
    `tenant-${randomBytes(3).toString("hex")}`;

  let generatedSlug = baseSlug;
  let suffix = 1;

  while (await Tenant.exists({ slug: generatedSlug })) {
    generatedSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return generatedSlug;
}

/* =========================================================
   API KEY ET API SECRET
========================================================= */

function generateApiCredentials(): {
  apiKey: string;
  apiSecret: string;
} {
  return {
    apiKey: `pk_${uuidv4().replaceAll("-", "")}`,
    apiSecret: `sk_${randomBytes(32).toString("hex")}`,
  };
}

/* =========================================================
   SESSION SIGNÉE AVEC HMAC
========================================================= */

function getSessionSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length) {
    throw new Error(
      "JWT_SECRET doit contenir au moins 32 caractères."
    );
  }

  return secret;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signSessionPayload(payload: SessionPayload): string {
  const encodedPayload = encodeBase64Url(
    JSON.stringify(payload)
  );

  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(
  token: string
): SessionPayload | null {
  try {
    const [encodedPayload, suppliedSignature] =
      token.split(".");

    if (!encodedPayload || !suppliedSignature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", getSessionSecret())
      .update(encodedPayload)
      .digest("base64url");

    const suppliedBuffer = Buffer.from(
      suppliedSignature,
      "utf8"
    );

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    if (suppliedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (
      !timingSafeEqual(
        suppliedBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      decodeBase64Url(encodedPayload)
    ) as SessionPayload;

    if (
      !payload.userId ||
      !payload.matricule ||
      !payload.role ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function createSession(
  payload: Omit<
    SessionPayload,
    "issuedAt" | "expiresAt"
  >
): Promise<void> {
  const issuedAt = Date.now();
  const expiresAt =
    issuedAt + SESSION_DURATION_SECONDS * 1000;

  const token = signSessionPayload({
    ...payload,
    issuedAt,
    expiresAt,
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/* =========================================================
   CRÉATION D'UN TENANT
========================================================= */

export async function createTenantAccount(
  input: CreateTenantAccountInput
): Promise<
  ActionResponse<{
    userId: string;
    tenantId: string;
    matricule: string;
    slug: string;
    nRef: string;
  }>
> {
  try {
    await connectToDb();

    const pseudo = input.pseudo?.trim();
    const telephone = normalizeTelephone(
      input.telephone || ""
    );

    const email = normalizeEmail(input.email || "");
    const designation = input.designation?.trim();
    const password = input.password || "";

    const errors: Record<string, string> = {};

    if (!pseudo || pseudo.length < 2) {
      errors.pseudo =
        "Le pseudo doit contenir au moins 2 caractères.";
    }

    if (!telephone || telephone.length < 8) {
      errors.telephone =
        "Le numéro de téléphone est invalide.";
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email =
        "L'adresse e-mail est invalide.";
    }

    if (!designation || designation.length < 2) {
      errors.designation =
        "La désignation est obligatoire.";
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      errors.password = passwordError;
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message:
          "Certaines informations sont invalides.",
        errors,
      };
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { telephone }],
    })
      .select("_id email telephone")
      .lean();

    if (existingUser) {
      return {
        success: false,
        message:
          "Un compte utilisant cet e-mail ou ce téléphone existe déjà.",
      };
    }

    const matricule =
      await generateUniqueMatricule("TEN");

    const nRef =
      await generateUniqueTenantReference();

    const slug = await generateUniqueSlug(
      designation,
      input.slug
    );

    const secure = await hashPassword(password);

    const { apiKey, apiSecret } =
      generateApiCredentials();

    /*
     * On crée d'abord l'utilisateur.
     * En cas d'échec du Tenant, l'utilisateur est supprimé.
     *
     * Une transaction MongoDB peut être utilisée à la place
     * lorsque MongoDB fonctionne en Replica Set ou Atlas.
     */
    const user = await User.create({
      pseudo,
      telephone,
      email,
      secure,
      matricule,
      status: "ACTIVE",
      boutique: null,
    });

    try {
      const tenant = await Tenant.create({
        userId: user._id,
        storesId: [],
        apiKey,
        apiSecret,
        slug,
        designation,
        logo: input.logo?.trim() || null,
        description: input.description || [],
        documents: input.documents || [],
        status: "ACTIVE",
        type: input.type || "COMPANY",
        email,
        telephone,
        nRef,
      });

      return {
        success: true,
        message:
          "Le compte gestionnaire a été créé avec succès.",
        data: {
          userId: user._id.toString(),
          tenantId: tenant._id.toString(),
          matricule,
          slug,
          nRef,
        },
      };
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  } catch (error) {
    console.error("CREATE_TENANT_ACCOUNT_ERROR", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return {
        success: false,
        message:
          "Une information unique est déjà utilisée.",
      };
    }

    return {
      success: false,
      message:
        "Impossible de créer le compte gestionnaire.",
    };
  }
}

/* =========================================================
   CRÉATION D'UN VENDEUR
========================================================= */

export async function createSalerAccount(
  input: CreateSalerAccountInput
): Promise<
  ActionResponse<{
    userId: string;
    salerId: string;
    matricule: string;
    storeId: string;
  }>
> {
  try {
    await connectToDb();

    const pseudo = input.pseudo?.trim();

    const telephone = normalizeTelephone(
      input.telephone || ""
    );

    const email = normalizeEmail(input.email || "");
    const password = input.password || "";

    if (!Types.ObjectId.isValid(input.storeId)) {
      return {
        success: false,
        message:
          "L'identifiant de la boutique est invalide.",
      };
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return {
        success: false,
        message: passwordError,
      };
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { telephone }],
    }).lean();

    if (existingUser) {
      return {
        success: false,
        message:
          "Un compte utilisant cet e-mail ou ce téléphone existe déjà.",
      };
    }

    const matricule =
      await generateUniqueMatricule("SAL");

    const secure = await hashPassword(password);

    const storeObjectId = new Types.ObjectId(
      input.storeId
    );

    const user = await User.create({
      pseudo,
      telephone,
      email,
      secure,
      matricule,
      boutique: storeObjectId,
      status: "ACTIVE",
    });

    try {
      const saler = await Saler.create({
        userId: user._id,
        storeId: storeObjectId,
        status: "ACTIVE",
      });

      return {
        success: true,
        message:
          "Le compte vendeur a été créé avec succès.",
        data: {
          userId: user._id.toString(),
          salerId: saler._id.toString(),
          matricule,
          storeId: input.storeId,
        },
      };
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  } catch (error) {
    console.error("CREATE_SALER_ACCOUNT_ERROR", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return {
        success: false,
        message:
          "Une information unique est déjà utilisée.",
      };
    }

    return {
      success: false,
      message:
        "Impossible de créer le compte vendeur.",
    };
  }
}

/* =========================================================
   AUTHENTIFICATION
========================================================= */

export async function authenticateUser(
  input: LoginInput
): Promise<ActionResponse<AuthenticationResult>> {
  try {
    await connectToDb();

    const matricule = normalizeMatricule(
      input.matricule || ""
    );

    const password = input.password || "";

    if (!matricule || !password) {
      return {
        success: false,
        message:
          "Le matricule et le mot de passe sont obligatoires.",
      };
    }

    /*
     * secure est select:false dans le modèle.
     * Il faut donc explicitement demander ce champ.
     */
    const user = await User.findOne({ matricule })
      .select(
        "+secure pseudo telephone email matricule status"
      )
      .lean();

    if (!user) {
      return {
        success: false,
        message:
          "Matricule ou mot de passe incorrect.",
      };
    }

    if (user.status !== "ACTIVE") {
      return {
        success: false,
        message:
          "Ce compte est inactif ou suspendu.",
      };
    }

    const passwordIsValid = await verifyPassword(
      password,
      user.secure
    );

    if (!passwordIsValid) {
      return {
        success: false,
        message:
          "Matricule ou mot de passe incorrect.",
      };
    }

    /*
     * Recherche du rôle.
     * On vérifie d'abord Tenant, puis Saler.
     */
    const tenant = await Tenant.findOne({
      userId: user._id,
    })
      .select(
        "_id status designation slug"
      )
      .lean();

    if (tenant) {
      if (tenant.status !== "ACTIVE") {
        return {
          success: false,
          message:
            "Le compte gestionnaire est suspendu ou inactif.",
        };
      }

      await createSession({
        userId: user._id.toString(),
        matricule: user.matricule,
        role: "TENANT",
        tenantId: tenant._id.toString(),
      });

      return {
        success: true,
        message: "Connexion réussie.",
        data: {
          user: {
            id: user._id.toString(),
            pseudo: user.pseudo,
            telephone: user.telephone,
            email: user.email,
            matricule: user.matricule,
            role: "TENANT",
          },

          profile: {
            id: tenant._id.toString(),
            tenantId: tenant._id.toString(),
            status: tenant.status,
            designation: tenant.designation,
            slug: tenant.slug,
          },

          redirectTo: "/dashboard/tenant",
        },
      };
    }

    const saler = await Saler.findOne({
      userId: user._id,
    })
      .select("_id storeId status")
      .lean();

    if (saler) {
      if (saler.status !== "ACTIVE") {
        return {
          success: false,
          message:
            "Le compte vendeur est suspendu ou inactif.",
        };
      }

      await createSession({
        userId: user._id.toString(),
        matricule: user.matricule,
        role: "SALER",
        salerId: saler._id.toString(),
        storeId: saler.storeId.toString(),
      });

      return {
        success: true,
        message: "Connexion réussie.",
        data: {
          user: {
            id: user._id.toString(),
            pseudo: user.pseudo,
            telephone: user.telephone,
            email: user.email,
            matricule: user.matricule,
            role: "SALER",
          },

          profile: {
            id: saler._id.toString(),
            salerId: saler._id.toString(),
            storeId: saler.storeId.toString(),
            status: saler.status,
          },

          redirectTo: "/dashboard/saler",
        },
      };
    }

    return {
      success: false,
      message:
        "Aucun profil gestionnaire ou vendeur n'est associé à ce compte.",
    };
  } catch (error) {
    console.error("AUTHENTICATE_USER_ERROR", error);

    return {
      success: false,
      message:
        "Une erreur est survenue pendant la connexion.",
    };
  }
}

/* =========================================================
   LECTURE DE LA SESSION
========================================================= */

export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

    if (!token) {
      return null;
    }

    const payload = verifySessionToken(token);

    if (!payload) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/* =========================================================
   DÉCONNEXION
========================================================= */

export async function logoutUser(): Promise<
  ActionResponse<null>
> {
  try {
    const cookieStore = await cookies();

    cookieStore.delete(SESSION_COOKIE_NAME);

    return {
      success: true,
      message: "Déconnexion réussie.",
      data: null,
    };
  } catch (error) {
    console.error("LOGOUT_USER_ERROR", error);

    return {
      success: false,
      message:
        "Impossible de fermer la session.",
    };
  }
}