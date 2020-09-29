/* eslint-env node */

const path = require("path");
const core = require("@actions/core");
const glob = require("@actions/glob");
const github = require("@actions/github");
const po2json = require("po2json");

const token = core.getInput("token");
const translationPath =
  core.getInput("translations-path") || "translations/**/*.po";
const onlyLanguages = getArrayInput(core.getInput("only-languages"));
const ignoreLanguages = getArrayInput(core.getInput("ignore-languages"));
const minCoverage = parseFloat(core.getInput("min-Coverage") || "0.0");

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

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => !!item);
}

function parseFile(file) {
  const relPath = path.relative(".", file);
  console.log("Parsing file:", relPath);

  const translation = po2json.parseFileSync(file);
  const language = translation[""].language.trim().toLowerCase();
  const details = {
    language,
    path: relPath,
    skipped: false,
    messageCount: 0,
    translatedMessageCount: 0,
    summary: "",
    coverage: 0,
  };
  if (
    (onlyLanguages.length > 0 && onlyLanguages.indexOf(language) === -1) ||
    (ignoreLanguages.length > 0 && ignoreLanguages.indexOf(language) !== -1)
  ) {
    console.log("Skipping file:", relPath);
    details.skipped = true;
    details.summary = `${relPath} skipped`;
    return details;
  }

  Object.entries(translation).forEach(([msgid, msgstr]) => {
    if (msgid === "") return;
    details.messageCount += 1;
    details.translatedMessageCount += msgstr[1] ? 1 : 0;
  });

  details.coverage =
    (details.translatedMessageCount / details.messageCount) * 100;
  details.summary = `${relPath} translated ${details.coverage.toFixed(2)}% `;
  details.summary += `(${details.translatedMessageCount} / ${details.messageCount} messages)`;

  console.log(details.summary);
  return details;
}

async function main() {
  const globber = await glob.create(translationPath);

  const perFileDetails = {};
  let totalMessages = 0;
  let totalTranslatedMessages = 0;

  (await globber.glob()).forEach((file) => {
    const details = parseFile(file);

    perFileDetails[details.language] = details;
    totalMessages += details.messageCount;
    totalTranslatedMessages += details.translatedMessageCount;
  });

  const coverage = (totalTranslatedMessages / totalMessages) * 100;
  const summary =
    `Total coverage ${coverage.toFixed(2)}% ` +
    `(${totalTranslatedMessages} / ${totalMessages} messages)`;

  console.log(summary);
  core.setOutput("coverage", coverage);

  const context = github.context.payload;
  if (!token || !context.head_commit) return;

  console.log("Creating check run");
  const octokit = github.getOctokit(token);
  let conclusion;

  if (!minCoverage) {
    conclusion = "neutral";
  } else if (coverage >= minCoverage) {
    conclusion = "success";
  } else {
    conclusion = "failure";
  }

  octokit.checks.create({
    owner: context.repository.owner.login,
    repo: context.repository.name,
    name: "i18n-coverage",
    head_sha: context.head_commit.id,
    status: "completed",
    conclusion,
    output: {
      title: `${coverage.toFixed(0)}% i18n coverage.`,
      summary: summary + `, min-coverage: ${minCoverage}%`,
      text: Object.values(perFileDetails)
        .map((details) => " - " + details.summary)
        .join("\n"),
      annotations: Object.values(perFileDetails)
        .filter((details) => !details.skipped)
        // TODO, handle more than 50 files.
        .slice(0, 50)
        .map((details) => {
          let level = "notice";
          if (minCoverage && details.coverage < minCoverage) {
            level = "failure";
          }
          return {
            title: `${details.coverage.toFixed(0)}% i18n coverage.`,
            path: details.path,
            start_line: 1,
            end_line: 1,
            annotation_level: level,
            message: details.summary,
          };
        }),
    },
  });
}
