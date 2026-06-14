const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Block temp files that cause Metro watcher crashes (bson, expo-notifications, etc.)
config.resolver = config.resolver || {};
config.resolver.blockList = [
  /node_modules\/.*_tmp_.*/,
  /_tmp_\d+/,
];

// Ensure the workspace packages (lib/*) are watched
const workspaceRoot = path.resolve(__dirname, "../..");
config.watchFolders = [workspaceRoot];

module.exports = config;
