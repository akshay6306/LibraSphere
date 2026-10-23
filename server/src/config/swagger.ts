import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LibraSphere - Library Management System API',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for LibraSphere Library Management System.',
      contact: {
        name: 'LibraSphere Engineering Team',
        email: 'support@libra.test'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
