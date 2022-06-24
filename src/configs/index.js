const dotenv = require("dotenv");

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFile = dotenv.config();

if (envFile.error) {
  throw new Error("env file is missing");
}

const CODE = {
  AR: '966'
}

module.exports = {
  HOSTNAME: process.env.HOSTNAME,
  PORT: parseInt(process.env.PORT) || 8080,
  DB: {
    URL: process.env.DB_URL, 
    NAME: process.env.DB_NAME,
  },
  API_PREFIX: process.env.API_PREFIX || "api",
  secret: 'supersecret',
  BEARER_TOKENS: process.env.BEARER_TOKENS,
  SENDER: process.env.SENDER,
  CODE,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  REGION: process.env.REGION,
  CDN: process.env.CDN,
  AWS_URL: process.env.AWS_URL,
  STRIPE_PUBLIC: process.env.STRIPE_PUBLIC,
  STRIPE_SECRET: process.env.STRIPE_SECRET,
};