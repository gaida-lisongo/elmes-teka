"use server";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

type UploadFolder =
  | "elmes-teka/users"
  | "elmes-teka/tenants/logos"
  | "elmes-teka/tenants/documents";

type UploadResponse =
  | { success: true; url: string; publicId: string }
  | { success: false; error: string };

const maxFileSizes: Record<UploadFolder, number> = {
  "elmes-teka/users": 3 * 1024 * 1024,
  "elmes-teka/tenants/logos": 3 * 1024 * 1024,
  "elmes-teka/tenants/documents": 8 * 1024 * 1024,
};

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

function resolveFolder(value: FormDataEntryValue | null): UploadFolder {
  if (
    value === "elmes-teka/users" ||
    value === "elmes-teka/tenants/logos" ||
    value === "elmes-teka/tenants/documents"
  ) {
    return value;
  }

  return "elmes-teka/tenants/documents";
}

export async function uploadToCloudinary(formData: FormData): Promise<UploadResponse> {
  try {
    const file = formData.get("file");
    const folder = resolveFolder(formData.get("folder"));

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Aucun fichier valide n'a ete fourni." };
    }

    if (!allowedTypes.has(file.type)) {
      return { success: false, error: "Ce type de fichier n'est pas autorise." };
    }

    if (file.size > maxFileSizes[folder]) {
      return { success: false, error: "Le fichier depasse la taille autorisee." };
    }

    const isPdf = file.type === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          format: isPdf ? "pdf" : undefined,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("cloudinary_empty_result"));
            return;
          }

          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    if (!uploadResult.secure_url || !uploadResult.public_id) {
      return { success: false, error: "Cloudinary n'a pas retourne d'URL valide." };
    }

    return {
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    console.error("CLOUDINARY_UPLOAD_ERROR", error);
    return { success: false, error: "Echec de l'upload." };
  }
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  if (!publicId) return;

  await Promise.allSettled([
    cloudinary.uploader.destroy(publicId, { resource_type: "image" }),
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" }),
  ]);
}
