import axios from "axios";
import { cloudinary } from "../config/cloudinary.js";

export const isCloudinaryUrl = (url = "") => /res\.cloudinary\.com/i.test(url);

const inferResourceType = (mimeType = "", url = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (/\/image\//.test(url)) return "image";
  if (/\/video\//.test(url)) return "video";
  return "raw";
};

const inferDeliveryType = (url = "") => {
  if (/\/authenticated\//.test(url)) return "authenticated";
  if (/\/private\//.test(url)) return "private";
  return "upload";
};

export const extractCloudinaryPublicId = (url = "") => {
  const match = url.match(
    /\/(?:image|video|raw)\/(?:upload|private|authenticated)\/(?:v\d+\/)?(.+)$/
  );
  if (!match?.[1]) return null;
  return match[1].replace(/\.[^/.]+$/, "");
};

export const buildCloudinaryDeliveryUrl = ({ url, publicId, mimeType }) => {
  const resolvedPublicId = publicId || extractCloudinaryPublicId(url);
  if (!resolvedPublicId) return null;

  const resourceType = inferResourceType(mimeType || "", url || "");
  const type = inferDeliveryType(url || "");
  const needsSignature = type !== "upload";

  return cloudinary.url(resolvedPublicId, {
    secure: true,
    resource_type: resourceType,
    type,
    sign_url: needsSignature,
  });
};

export const fetchRemoteBufferWithCloudinaryFallback = async ({ url, publicId, mimeType }) => {
  const request = async (targetUrl) =>
    axios.get(targetUrl, {
      responseType: "arraybuffer",
      validateStatus: (status) => status >= 200 && status < 300,
    });

  try {
    const response = await request(url);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    if (!isCloudinaryUrl(url) || (status !== 401 && status !== 403)) {
      throw error;
    }

    const signedUrl = buildCloudinaryDeliveryUrl({ url, publicId, mimeType });
    if (!signedUrl || signedUrl === url) {
      throw error;
    }

    const response = await request(signedUrl);
    return response.data;
  }
};

export const streamRemoteWithCloudinaryFallback = async ({
  url,
  publicId,
  mimeType,
  res,
  defaultContentType = "application/octet-stream",
}) => {
  const request = async (targetUrl) =>
    axios.get(targetUrl, {
      responseType: "stream",
      validateStatus: (status) => status >= 200 && status < 300,
    });

  const pipeResponse = (remoteResponse) => {
    res.setHeader("Content-Type", remoteResponse.headers["content-type"] || defaultContentType);
    remoteResponse.data.pipe(res);
  };

  try {
    const response = await request(url);
    pipeResponse(response);
  } catch (error) {
    const status = error?.response?.status;
    if (!isCloudinaryUrl(url) || (status !== 401 && status !== 403)) {
      throw error;
    }

    const signedUrl = buildCloudinaryDeliveryUrl({ url, publicId, mimeType });
    if (!signedUrl || signedUrl === url) {
      throw error;
    }

    const response = await request(signedUrl);
    pipeResponse(response);
  }
};
