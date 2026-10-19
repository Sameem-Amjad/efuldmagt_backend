// Supabase Storage as a drop-in for the S3 bucket.
// Used when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set; otherwise
// the S3 code paths run unchanged. Env is read at call time because routes
// are required before app.js runs dotenv.config().
// storage-js rather than supabase-js: the full client builds a realtime
// socket on creation, which needs Node 22+.
const { StorageClient } = require("@supabase/storage-js");
const createHttpError = require("http-errors");

let client;

const isSupabaseStorage = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const bucket = () => {
  if (!client) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    client = new StorageClient(`${process.env.SUPABASE_URL}/storage/v1`, {
      apikey: key,
      Authorization: `Bearer ${key}`,
    });
  }
  return client.from(process.env.SUPABASE_BUCKET || "efuldmagt");
};

// Supabase rejects keys with characters S3 allows (æ, ø, å, %, #, …), and
// file names here come straight from the user's upload.
const safeKey = (key) => key.normalize("NFKD").replace(/[^\w/.-]/g, "_");

const publicUrl = (key) => bucket().getPublicUrl(key).data.publicUrl;

async function uploadObject(key, body, contentType) {
  const path = safeKey(key);
  const { error } = await bucket().upload(path, body, { contentType, upsert: true });
  if (error) throw new createHttpError.InternalServerError(error.message);
  return publicUrl(path);
}

async function deleteObject(key) {
  const { data, error } = await bucket().remove([safeKey(key)]);
  if (error) throw new createHttpError.InternalServerError(error.message);
  return data;
}

// Same shape as the S3 presigned PUT: the browser PUTs the raw file to `url`,
// then saves `imageUrl`.
async function createSignedUpload(key) {
  const path = safeKey(key);
  const { data, error } = await bucket().createSignedUploadUrl(path, { upsert: true });
  if (error) throw new createHttpError.InternalServerError("Failed to generate upload URL");
  return { url: data.signedUrl, imageUrl: publicUrl(path) };
}

module.exports = { isSupabaseStorage, uploadObject, deleteObject, createSignedUpload };
