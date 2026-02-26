const multer = require("multer");
// const {
//   ref,
//   uploadBytes,
//   getDownloadURL,
//   deleteObject,
// } = require("firebase/storage");
// const { storage } = require("../configurations/FirebaseServiceAccountKey");

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const createHttpError = require("http-errors");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

async function uploadFileToS3(filePath, fileName, file) {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    },
  });
  try {
    if (!file) {
      throw new createHttpError.BadRequest("File doesn't exist");
    }
    let fileExtension = file.originalname.split(".").pop();
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `${filePath}/${fileName}.${fileExtension}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);
    const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return fileUrl;
  } catch (error) {
    throw new createHttpError.InternalServerError(error.message);
  }
}

const uploadFileToS3Bucket = (Model, id) => async (req, res, next) => {
  try {
    const user = await Model.findById(id);
    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "User not found" });
    }

    if (!req.file) {
      return res
        .status(400)
        .send({ success: false, message: "No file uploaded" });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;

    const publicUrl = await uploadFileToS3(
      `uploads/${fileName}`,
      fileName,
      req.file
    );

    console.log("File uploaded to S3:", publicUrl);

    req.fileUrl = publicUrl;
    next();
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ success: false, message: "Failed to handle file upload" });
  }
};

const uploadFileToS3BucketWithoutDeletingPrevious = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .send({ success: false, message: "No file uploaded" });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;

    const publicUrl = await uploadFileToS3(
      `uploads/${fileName}`,
      fileName,
      req.file
    );

    req.fileUrl = publicUrl;
    next();
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to handle file upload" });
  }
};

const uploadFileObjectToS3Bucket = async (fileObject, userId) => {
  if (!fileObject) return;

  const fileName = `${Date.now()}_${userId}_${fileObject.originalname}`;

  const publicUrl = await uploadFileToS3(
    `uploads/${fileName}`,
    fileName,
    fileObject
  );

  return publicUrl;
};

const uploadFileObjectToS3BucketByAdmin = async (fileObject) => {
  if (!fileObject) return;

  const fileName = `${Date.now()}_${fileObject.originalname}`;

  const publicUrl = await uploadFileToS3(
    `uploads/${fileName}`,
    fileName,
    fileObject
  );

  return publicUrl;
};

async function deleteFileFromS3(fileKey) {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    },
  });
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileKey,
    };
    const command = new DeleteObjectCommand(params);
    const data = await s3Client.send(command);
    return data;
  } catch (error) {
    throw new createHttpError.InternalServerError(error.message);
  }
}

module.exports = {
  upload,
  uploadFileToS3Bucket,
  uploadFileToS3BucketWithoutDeletingPrevious,
  uploadFileObjectToS3Bucket,
  uploadFileObjectToS3BucketByAdmin,
  deleteFileFromS3
};

