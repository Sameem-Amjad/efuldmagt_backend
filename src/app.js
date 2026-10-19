const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("../routes/main");
const http = require("http");
const mongoose = require("mongoose");
const expressSession = require('express-session');
const { CriiptoVerifyExpressRedirect } = require('@criipto/verify-express');
const path = require("path");
const fs = require('fs');
const { redocViewerHtml } = require("../views/redoc-template");

const specFilePath = path.join(__dirname, 'static', 'openapi.json');

//firebase key update

class App {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.http = new http.Server(this.app);
    this.PORT = process.env.PORT || 8000;
    this.app.options("*", cors());
    this.initMiddleware();
    this.connectToMongoDB();
    this.initRoutes();
  }
  initMiddleware() {
    dotenv.config();
    this.app.use(
      cors({
        origin: function (origin, callback) {
          console.log("Incoming origin:", origin); // Add this
          const allowedOrigins = [
            "https://admin.e-fuldmagt.com",
            "https://app.e-fuldmagt.com",
            "http://localhost:5173",
            "http://localhost:5174",
            // Extra origins, comma-separated (e.g. a demo deployment's website and admin)
            ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
          ];
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: false,
      })
    );
    this.app.use(express.json());
    // this.app.set('trust proxy', 1);
    this.app.use(
      expressSession({
        // IMPORTANT: Use a secure, long, random string from environment variables
        secret: process.env.SESSION_SECRET || 'fallback-secure-secret-key-for-session',
        resave: false,
        saveUninitialized: false,
        // cookie: {
        //   // sameSite: 'none',
        //   maxAge: 60 * 60 * 1000, // 60 minutes
        //   // secure: false,
        //   // secure: process.env.NODE_ENV === 'development' ? false : true, // Set to true in production
        // }
      }),
    );
    this.app.get('/openapi.json', (req, res) => {
      // Read the file and send it as a JSON response
      fs.readFile(specFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Could not load specification file.');
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
      });
    });

    this.app.get('/api-docs', (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.send(redocViewerHtml);
    });

  }

  connectToMongoDB() {
    const db = process.env.MONGO_CONNECTION;
    mongoose.connect(
      db,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      },
      (err, db) => {
        if (err) {
          console.log("err", err);
        } else {
          console.log("db connected");
        }
      }
    );
  }
  initRoutes() {
    const folderPath = __dirname;
    const publicPath = path.join(folderPath, "..", "public");

    this.app.use(express.static(publicPath));
    this.app.use("/", router);
  }
  createServer() {
    this.http.listen(this.PORT, () => {
      console.log(`Server started at port ${this.PORT}`);
    });
  }
}

module.exports = App;
