const AWS = require("aws-sdk");
const createHttpError = require("http-errors");
const supabaseStorage = require("./supabaseStorage.service");
const region = "eu-north-1";

const validBucketNames = ["efulmagtsimages"];
const validFileExtensions = ["jpg", "jpeg", "png", "svg"];
const presignedExpirationTime = 1800; // 30 minutes

AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: region,
});

const s3 = new AWS.S3();

const getContentType = (extension) => {
  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    svg: "image/svg+xml",
  };
  return mimeTypes[extension] || "application/octet-stream";
};

const getPresignedUploadUrl = async (options) => {
  const { bucketName, fileName, fileExtension } = options;

  if (!validBucketNames.includes(bucketName)) {
    throw createHttpError.BadRequest(
      `Invalid bucket name. Allowed values: ${validBucketNames.join(", ")}`
    );
  }
  if (!validFileExtensions.includes(fileExtension)) {
    throw createHttpError.BadRequest(
      `Invalid file extension. Allowed values: ${validFileExtensions.join(
        ", "
      )}`
    );
  }

  const params = {
    Bucket: bucketName,
    Key: `uploads/${fileName}.${fileExtension}`,
    ContentType: getContentType(fileExtension),
    Expires: presignedExpirationTime,
  };

  try {
    const url = s3.getSignedUrl("putObject", params);
    return { url };
  } catch (error) {
    throw createHttpError.InternalServerError(
      "Failed to generate pre-signed URL"
    );
  }
};

const generatePublicImageUrl = (region, bucketName, fileKey) => {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
};

const handlePresignedUrlRequest = async ({ fileName, fileExtension }) => {
  if (!fileName || !fileExtension) {
    throw createHttpError.BadRequest(
      "Missing required parameters: 'fileName' and 'fileExtension'"
    );
  }

  if (supabaseStorage.isSupabaseStorage()) {
    if (!validFileExtensions.includes(fileExtension)) {
      throw createHttpError.BadRequest(
        `Invalid file extension. Allowed values: ${validFileExtensions.join(", ")}`
      );
    }
    return supabaseStorage.createSignedUpload(`uploads/${fileName}.${fileExtension}`);
  }

  const imageUploadOptions = {
    bucketName: "efulmagtsimages",
    fileName,
    fileExtension,
  };

  const imageUploadUrl = await getPresignedUploadUrl(imageUploadOptions);

  const fileKey = `uploads/${fileName}.${fileExtension}`;
  const imageUrl = generatePublicImageUrl(
    region,
    imageUploadOptions.bucketName,
    fileKey
  );

  if (imageUploadUrl.error) {
    throw createHttpError.InternalServerError(
      "Failed to generate pre-signed URL"
    );
  }

  return { url: imageUploadUrl.url, imageUrl };
};

module.exports = { handlePresignedUrlRequest, s3 };
