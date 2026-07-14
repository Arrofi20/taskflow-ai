/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const projectRoot = path.resolve(__dirname);

/** @type {import('next').NextConfig} */
let nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  devIndicators: false,
};

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  swSrc: "src/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

module.exports = withPWA(nextConfig);
