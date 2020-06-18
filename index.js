const core = require("@actions/core");
const glob = require("@actions/glob");
const github = require("@actions/github");

async function main() {
  const translationPath = core.getInput("translations-path") || "translations";
  const defaultLanguage = core.getInput("default-language") || "en";

  const globber = await glob.create([
    `${translationPath}/*/*/*.po`,
    `${translationPath}/locale/*/*/*.po`
  ].join("\n"))
  const files = await globber.glob()
  files.forEach((file) => {
    console.log("File:", file);
  })
  console.log("Path:", translationPath);
  console.log("Lang:", defaultLanguage);

  core.setOutput("coverage", "100.00");
}

main().catch((error) => {
  core.setFailed(error.message);
})
