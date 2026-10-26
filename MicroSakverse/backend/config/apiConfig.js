import dotenv from 'dotenv';
dotenv.config();

export const config = {
    HOST: process.env.HOST ,
    PORT: process.env.PORT || 3000,
    BASE_IP: process.env.BASE_IP ,
    JAVA_IP: process.env.JAVA_IP ,
    JIRA_CONFIG: {
        USERNAME: process.env.USERNAME_JIRA,
        PASSWORD: process.env.PASSWORD_JIRA,
        URL: process.env.JIRA_URL
    },
    FRONTEND: {
        URL: `https://${process.env.HOST }:${process.env.FRONTEND_PORT }`
    },
    CORS: {
    
        ORIGIN: `${process.env.HOST}:${process.env.FRONTEND_PORT }`,
        CREDENTIALS: true,
        METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        ALLOWED_HEADERS: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma']
    }
};

export default config;
