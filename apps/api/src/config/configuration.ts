import { EnvConfig } from './env.schema';

export default (): {
  app: {
    env: string;
    port: number;
    webOrigin: string;
  };
  database: {
    uri: string;
  };
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  admin: {
    email: string;
    password: string;
  };
  oauth: {
    google: {
      clientId?: string;
      clientSecret?: string;
      callbackUrl?: string;
    };
    github: {
      clientId?: string;
      clientSecret?: string;
      callbackUrl?: string;
    };
  };
  throttler: {
    ttl: number;
    limit: number;
    authLimit: number;
  };
} => {
  const env = process.env as unknown as EnvConfig;
  return {
    app: {
      env: env.NODE_ENV || 'development',
      port: Number(env.PORT) || 3000,
      webOrigin: env.WEB_ORIGIN || 'http://localhost:5173',
    },
    database: {
      uri: env.MONGODB_URI,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshTtl: env.JWT_REFRESH_TTL,
    },
    admin: {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    },
    oauth: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackUrl: env.GOOGLE_CALLBACK_URL,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackUrl: env.GITHUB_CALLBACK_URL,
      },
    },
    throttler: {
      ttl: Number(env.THROTTLE_TTL) || 60,
      limit: Number(env.THROTTLE_LIMIT) || 100,
      authLimit: Number(env.AUTH_THROTTLE_LIMIT) || 10,
    },
  };
};
