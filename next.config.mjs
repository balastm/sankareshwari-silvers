/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_TEST_OUTPUT_DIR || '.next',
  experimental: {
    // Avoid child-process permission errors during Windows production builds.
    workerThreads: true,
    cpus: 2,
    useTypeScriptCli: false,
    serverActions: { bodySizeLimit: '6mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
export default nextConfig;
