# Multiline clipboard option — 2026-10-09

The owner reports that the JSON pasted by the green Copy Full JSON button is
present in Widgy's import field but visually blank. This is an observed native
display symptom, not a verified Widgy/iOS diagnosis. There is no public primary
source confirming this exact bug. The current copy button uses plain-text
`navigator.clipboard.writeText`, without HTML or text colour attributes.

The Calendar City Country 1 export is 924464 characters on one physical line.
This change adds an enabled-by-default **העתקה בשורות** checkbox to its existing
copy page. It inserts LF whitespace at JSON structural delimiters outside
quoted strings when a line reaches about 160 characters. Literal spellings,
number precision, key order, escape sequences and all embedded strings are
preserved. No newline is appended at the end. Unchecking restores the exact
original compact text. Both clipboard fallbacks follow the selected format.

Formatting is prepared and validated after decryption, before any tap; the
clipboard write is still called directly within the click handler. No new
network request is made when selecting a format or copying. The encrypted
payload, decryption fragment key, widget JSON and all APIs/renderers remain
unchanged. This creates no new widget version.

Validation on the full private export:

- 924464 -> 927757 characters; 1 -> 3294 physical lines; median line 162
  characters. The longest line is still 14024 characters because long encoded
  strings cannot be split with literal newlines without altering valid JSON.
- Full parsed-object equality and exact JSON-token equality; removing the
  inserted LF characters reconstructs the original compact file byte for byte.
- Edge cases preserve escaped quotes/backslashes, Unicode, embedded JS,
  whitespace, exponent spelling, -0 and integer literals beyond JS precision.
- Actual copy-page script exercised: default multiline, compact toggle, return
  to multiline, Clipboard API denial/manual select-all, legacy copy, wrong key
  and tamper rejection. The handler makes no extra fetch.
- Full configured project build must pass before preview publication.

This is a concrete workaround candidate, NOT proof that native text becomes
visible. Widgy's import UI is not available in the execution environment. The
user only needs to paste the reformatted content to check visibility; they do
not need to import another copy merely for that check. If it remains blank, do
not claim longer JSON lines were the cause.

JSON whitespace reference: RFC 8259 section 2,
https://www.rfc-editor.org/rfc/rfc8259.html#section-2.
