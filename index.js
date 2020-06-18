const core = require("@actions/core");
const github = require("@actions/github");

try {
  const translationPath = core.getInput("translations-path");
  const defaultLanguage = core.getInput("default-language");

  console.log("Path:", translationPath);
  console.log("Lang:", defaultLanguage);

  core.setOutput("coverage", "100.00");

  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);

} catch (error) {
  core.setFailed(error.message);
}