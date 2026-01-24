
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No 'api' property here
};

// Export configuration
export default nextConfig;

// Body parser config for API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allows 10MB file uploads
    },
  },
};

