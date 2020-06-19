const core = require("@actions/core");
const glob = require("@actions/glob");
const github = require("@actions/github");
const po2json = require("po2json");

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


async function main() {
  const translationPath = core.getInput("translations-path") || "translations";
  const onlyLanguages = getArrayInput(core.getInput("only-languages"));
  const ignoreLanguages = getArrayInput(core.getInput("ignore-languages"));

  console.log("translations-path", translationPath);
  console.log("only-languages:", onlyLanguages);
  console.log("ignore-languages:", ignoreLanguages);

  const globber = await glob.create([
    `${translationPath}/**/*.po`,
  ].join("\n"));

  let totalMessages = 0;
  let totalTranslatedMessages = 0;

  (await globber.glob()).forEach((file) => {
    console.log("Parsing file:", file);
    const translation = po2json.parseFileSync(file);
    const language = translation[""].language.trim().toLowerCase();
    if (
      (onlyLanguages.length > 0 && onlyLanguages.indexOf(language) === -1) ||
      (ignoreLanguages.length > 0 && ignoreLanguages.indexOf(language) !== -1)
    ) {
      console.log("Skipping file:", file)
      return
    }

    let poMessages = 0;
    let poTranslatedMessages = 0;

    Object.entries(translation).forEach(([msgid ,msgstr]) => {
      if (msgid === "") return;
      poMessages += 1;
      poTranslatedMessages += msgstr[1] ? 1 : 0;
    })
    console.log(
      `"${language}" translated ${(poTranslatedMessages / poMessages * 100).toFixed(2)}%`,
      `(${poTranslatedMessages} / ${poMessages})`
    )
    totalMessages += poMessages;
    totalTranslatedMessages += poTranslatedMessages;
  });
  core.setOutput(
    "coverage",
    (totalTranslatedMessages / totalMessages * 100).toFixed(2),
  );
}

main().catch((error) => {
  core.setFailed(error.message);
});
