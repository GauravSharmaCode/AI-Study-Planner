import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root (if not already loaded) or local .env
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
// Fallback to local .env if root not found (though structure implies root)
dotenv.config();

export interface AppConfig {
    port: number;
    nodeEnv: string;
    serviceName: string;
    googleGenAiKey: string;
    userServiceUrl: string;
    cors: {
        origin: string | string[];
        credentials: boolean;
    };
    logging: {
        level: string;
    };
    database: {
        url?: string | undefined;
    }
}

const config: AppConfig = {
    port: parseInt(process.env.PORT || '3002'),
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceName: 'ai-schedule-service',
    googleGenAiKey: process.env.GOOGLE_GENAI_API_KEY || '',
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Add more origins as needed
        credentials: true
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },

    database: {
        url: process.env.DATABASE_URL
    }
} as AppConfig;

// Validation
if (!config.googleGenAiKey && config.nodeEnv !== 'test') {
    console.warn('WARNING: GOOGLE_GENAI_API_KEY is missing. AI features will fail.');
}

export default config;
