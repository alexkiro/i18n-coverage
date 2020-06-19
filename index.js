const core = require("@actions/core");
const glob = require("@actions/glob");
const github = require("@actions/github");
const po2json = require("po2json");

const token = core.getInput("token");
const translationPath = core.getInput("translations-path") || "translations/**/*.po";
const onlyLanguages = getArrayInput(core.getInput("only-languages"));
const ignoreLanguages = getArrayInput(core.getInput("ignore-languages"));

console.log("translations-path", translationPath);
console.log("only-languages:", onlyLanguages);
console.log("ignore-languages:", ignoreLanguages);

main().catch((error) => {
  core.setFailed(error.message);
});


/**
 * @param value {string}
 * @return {Array}
 */
function getArrayInput(value) {
  if (!value) return [];

  return value.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => !!item);
}

function parseFile(file) {
    console.log("Parsing file:", file);
    const translation = po2json.parseFileSync(file);
    const language = translation[""].language.trim().toLowerCase();
    const details = {
      language,
      skipped: false,
      messageCount: 0,
      translatedMessageCount: 0,
      summary: "",
      coverage: 0
    };
    if (
      (onlyLanguages.length > 0 && onlyLanguages.indexOf(language) === -1) ||
      (ignoreLanguages.length > 0 && ignoreLanguages.indexOf(language) !== -1)
    ) {
      console.log("Skipping file:", file);
      details.skipped = true;
      details.summary = ` - "${file}" skipped`
      return details;
    }

    Object.entries(translation).forEach(([msgid, msgstr]) => {
      if (msgid === "") return;
      details.messageCount += 1;
      details.translatedMessageCount += msgstr[1] ? 1 : 0;
    });

    details.coverage = (details.translatedMessageCount / details.messageCount * 100)
      .toFixed(2);
    details.summary = ` - "${file}" translated ${details.coverage} `;
    details.summary += `(${details.translatedMessageCount} / ${details.messageCount} messages)`;

    console.log(details.summary);
    return details
}


async function main() {
  const globber = await glob.create(translationPath);

  let allSummaries = []
  let totalMessages = 0;
  let totalTranslatedMessages = 0;

  (await globber.glob()).forEach((file) => {
    const details = parseFile(file);
    allSummaries.push(details.summary);
    totalMessages += details.messageCount;
    totalTranslatedMessages += details.translatedMessageCount;
  });

  const coverage = (totalTranslatedMessages / totalMessages * 100).toFixed(2);
  const summary =
    `Total coverage ${coverage}% (${totalTranslatedMessages} / ${totalMessages} messages)`;

  console.log(summary);
  core.setOutput("coverage", coverage);

  const context = github.context.payload;
  if (!token || !context.head_commit) return;

  console.log("Creating check run");
  const octokit = github.getOctokit(token);
  octokit.checks.create(
    {
      owner: context.repository.owner.login,
      repo: context.repository.name,
      name: "i18n-coverage",
      head_sha: context.head_commit.id,
      status: "completed",
      conclusion: "neutral",
      output: {
        title: `I18N: ${coverage}%`,
        summary: summary,
        text: allSummaries.join("\n")
      }
    }
  );
}
