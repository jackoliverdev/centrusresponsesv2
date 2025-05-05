/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'common',
    'antd',
    '@ant-design',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-notification',
    'rc-tooltip',
    'rc-tree',
    'rc-table',
  ],
  reactStrictMode: true,
  output: 'standalone',
};

export default nextConfig;
