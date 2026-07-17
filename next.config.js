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

module.exports = nextConfig;
