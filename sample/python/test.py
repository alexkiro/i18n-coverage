import gettext

t = gettext.translation("messages", "./translations/locale/", languages=["ro"])
_ = t.gettext

print(_("Translate me"))
print(_("Don't translate me"))
