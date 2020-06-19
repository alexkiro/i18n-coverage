# i18n-coverage

Github action that can be used to measure how many of you translatable strings 
have a translation available. Currently supported formats:

 - [gettext .po files](https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html)

If a token is also provided, the action will attach a neutral check to the head commit that triggered 
the workflow, with the coverage results for each found language.
  
## Example usage

Note, that you must include a checkout step before using this action in order to have the 
translations available. (Or any other alternative method ot get the translation files) 

```yaml
on: [push]

jobs:
  i18n-coverage:
    runs-on: ubuntu-latest
    name: Check i18n coverage
    steps:
      - uses: actions/checkout@v2
      - name: Check i18n coverage
        uses: alexkiro/i18n-coverage@v1.0.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          translations-path: 'translations/**/*.po'
          ignore-languages: 'en'
```

---

The total coverage percentage can also be retrieved from the output. E.g:

```yaml
on: [push]

jobs:
  i18n-coverage:
    runs-on: ubuntu-latest
    name: Check i18n coverage
    steps:
      - uses: actions/checkout@v2
      - name: Check i18n coverage
        id: i18nCoverage
        uses: alexkiro/i18n-coverage@v1.0.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          translations-path: 'translations/**/*.po'
          ignore-languages: 'en'
      - name: Get the coverage
        run: echo "The coverage was ${{ steps.i18nCoverage.outputs.coverage }}"
```
  

## Inputs

### `translations-path`

The glob patterns to the translations files to check. Defaults to "translations/**/*.po". 

### `token`

Github secret token, usually set to `${{ secrets.GITHUB_TOKEN }}`. If not specified the check details
are not attached to the commit, and therefore can only be found and used in the action workflow.

### `ignore-languages`

Comma separated list of languages codes; if specified these languages will be excluded from the check.

### `only-languages`

Comma separated list of languages codes; if specified only these languages will be checked instead of all. 

## Outputs

### `coverage`

Total percentage of translated strings, across all checked languages.
