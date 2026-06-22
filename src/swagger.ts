import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Vivar Realty API",
    version: "1.0.0",
    description: "API for Vivar Realty Property Management",
  },
  host: "localhost:3000",
  basePath: "/api/v1",
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "Enter your Bearer token in the format: Bearer <token>",
    },
  },
  security: [{ bearerAuth: [] }],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/index.ts"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);
