const { override, addLessLoader } = require("customize-cra");

module.exports = override(
  /*
  fixBabelImports("import", {
    libraryName: "antd",
    libraryDirectory: "es",
    style: true,
  }),
  */
  addLessLoader({
    lessOptions: {
      javascriptEnabled: true,
      modifyVars: {
        '@H050': '#d6edff',
        '@font-family-mono': 'source-code-pro, Menlo, Monaco, Consolas, \'Courier New\', monospace'
      }
    },
  })
);