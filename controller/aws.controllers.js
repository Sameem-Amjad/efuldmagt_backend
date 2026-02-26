const jwt = require("jsonwebtoken");
const { dataResponse } = require("../utils/responses");
const {handlePresignedUrlRequest } = require("../services/aws-bucket.services");

const awsController = {
  async getPresignedUrl(req, res){
    const {fileName, fileExtension} = req.body;

    let resBody = await handlePresignedUrlRequest ({fileName, fileExtension});

    return res.status(200).send(dataResponse("Presigned URL has been successfully fetched", resBody));
  }
};

module.exports = awsController;
