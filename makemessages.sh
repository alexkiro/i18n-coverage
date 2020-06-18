#!/bin/bash

set -ev

tmpfile=$(mktemp /tmp/i18n-makemessages.XXXXXX.pot)
exec 3>"$tmpfile"
rm "$tmpfile"

FILES=$(find ./sample/ -type f | tr '\n' ' ')
xgettext $FILES -o $tmpfile

msgmerge --update translations/locale/en/LC_MESSAGES/messages.po $tmpfile
msgmerge --update translations/locale/ro/LC_MESSAGES/messages.po $tmpfile
