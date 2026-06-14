const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Block bson temp files that cause Metro watcher crashes when mongoose is in node_modules
config.resolver = config.resolver || {};
config.resolver.blockList = [
  /node_modules\/.*\/bson_tmp.*/,
  /bson_tmp.*/,
];

// Ensure the workspace packages (lib/*) are watched
const workspaceRoot = path.resolve(__dirname, "../..");
config.watchFolders = [workspaceRoot];

module.exports = config;
