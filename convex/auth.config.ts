// Convex Auth configuration
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
  callbacks: {
    redirect: async ({ redirectTo }: { redirectTo: string }) => {
      // Allow redirects to Netlify production and localhost for development
      const allowedHosts = [
        "axiomfinance.netlify.app",
        "localhost",
        "127.0.0.1"
      ];
      
      try {
        const url = new URL(redirectTo);
        if (allowedHosts.some(host => url.host.endsWith(host))) {
          return redirectTo;
        }
      } catch (e) {
        // If URL parsing fails, fall back to default
        console.warn("Failed to parse redirect URL:", redirectTo);
      }
      
      // Default redirect to the app root
      return "/";
    },
  },
  // Add session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add debug mode for development
  debug: true,
};