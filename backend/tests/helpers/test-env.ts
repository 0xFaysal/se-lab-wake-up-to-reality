process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.ENABLE_API_DOCS = "false";
process.env.JWT_ACCESS_SECRET = "unit-test-access-secret-000000000001";
process.env.JWT_REFRESH_SECRET = "unit-test-refresh-secret-000000000002";
process.env.VERIFICATION_CODE_SECRET =
  "unit-test-verification-secret-000000003";
process.env.AUTH_METADATA_HASH_SECRET =
  "unit-test-auth-metadata-secret-00000004";
process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET =
  "unit-test-property-fingerprint-secret-00005";
process.env.DATA_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.EXPOSE_DEVELOPMENT_AUTH_CODES = "false";
process.env.API_PUBLIC_URL = "http://localhost:4000";
process.env.PASSWORD_RESET_URL = "http://localhost:3000/reset-password";
process.env.EMAIL_PROVIDER = "smtp";
process.env.EMAIL_HOST = "smtp.example.test";
process.env.EMAIL_PORT = "2525";
process.env.EMAIL_USERNAME = "unit-tests@example.com";
process.env.EMAIL_PASSWORD = "unit-test-email-password";
process.env.CLOUDINARY_CLOUD_NAME = "unit-test-cloud";
process.env.CLOUDINARY_API_KEY = "unit-test-cloudinary-key";
process.env.CLOUDINARY_API_SECRET = "unit-test-cloudinary-secret";
process.env.TWILIO_ACCOUNT_SID = "AC0123456789abcdef0123456789abcdef";
process.env.TWILIO_AUTH_TOKEN = "unit-test-twilio-token";
process.env.TWILIO_FROM_NUMBER = "+8801712345678";
