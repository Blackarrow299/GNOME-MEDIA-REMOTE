const { getDefaultConfig } = require("metro-config")
const { getDefaultConfig: getDefaultExpoConfig } = require("@expo/metro-config")
const path = require("path")

let metroConfig
let isExpo = false
try {
  const Constants = require("expo-constants")
  isExpo =
    Constants.executionEnvironment === "standalone" ||
    Constants.executionEnvironment === "storeClient"
} catch {}

const workspaceRoot = path.resolve(__dirname, "../..")
const projectRoot = __dirname

if (isExpo) {
  metroConfig = getDefaultExpoConfig(projectRoot)

  metroConfig.watchFolders = [workspaceRoot]

  metroConfig.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ]

  metroConfig.resolver.disableHierarchicalLookup = true
} else {
  const { makeMetroConfig } = require("@rnx-kit/metro-config")
  const MetroSymlinksResolver = require("@rnx-kit/metro-resolver-symlinks")

  metroConfig = (async () => {
    const defaultConfig = await getDefaultConfig()
    return makeMetroConfig({
      projectRoot,
      watchFolders: [workspaceRoot, path.resolve(projectRoot)],
      resolver: {
        resolveRequest: MetroSymlinksResolver(),
        assetExts: [...defaultConfig.resolver.assetExts, "bin"],
        nodeModulesPaths: [
          path.resolve(projectRoot, "node_modules"),
          path.resolve(workspaceRoot, "node_modules"),
        ],
        disableHierarchicalLookup: true,
      },
    })
  })()

  // metroConfig = async () => {
  //   const config = await getDefaultConfig(projectRoot)

  //   // 1. Watch all files within the monorepo
  //   config.watchFolders = [workspaceRoot]
  //   // 2. Let Metro know where to resolve packages, and in what order
  //   config.resolver.nodeModulesPaths = [
  //     path.resolve(projectRoot, "node_modules"),
  //     path.resolve(workspaceRoot, "node_modules"),
  //   ]
  //   // 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
  //   config.resolver.disableHierarchicalLookup = true

  //   return config
  // }
}

module.exports = metroConfig
