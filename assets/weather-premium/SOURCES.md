# Weather Premium 1

Artwork: user's approved technical Weather mockup and revision 04 of all eleven
icons, approved 2026-10-09. Reproducible source: tools/weather-design/. No image
generation. Phenomena outlines use the original supplied font files.

Forecast data: Open-Meteo https://open-meteo.com/ under CC BY 4.0
https://creativecommons.org/licenses/by/4.0/. Values are rounded, summarized and
rendered; current conditions are model-based, not a local weather station.
Documentation: https://open-meteo.com/en/docs; terms: https://open-meteo.com/en/terms.
The free endpoint is intended for this noncommercial personal test, not a
commercial product. Credit appears beneath the forecast and on the copy page.

The existing Home weather provider, GPS, map and private Calendar are unchanged.
Versioned chrome-r1.png, chrome-r2.png and chrome-r3.png are exposed as static public assets. Font glyphs and icon
source data are bundled with the Weather function; no remote font loading.

Weather codes map to the eleven approved drawings. Overcast uses Cloudy artwork;
drizzle/moderate rain use the light-rain drawing, snow types share Snow. Windy is
selected at 40 km/h for otherwise dry, clear/cloudy weather; severe weather takes
precedence. Unknown conditions show a dash rather than a guessed sunny icon.


Revision 2 restores native BarlowCondensed-Light menu labels and native symbols
from the current Home/Calendar export, including figure.run. The static chrome
contains no menu labels or icons. Hourly icon boxes grow 46 → 60 logical pixels;
daily boxes 35 → 46; rain indicators 13 → 20 and 12 → 18. Approved icon geometry
is untouched. The old chrome and v=1 panel remain available for imported R1.


Revision 3 changes only the current-conditions card interior. The approved
condition icon grows 141 → 180, primary temperature cap height shrinks 110 → 82,
and the Celsius unit follows the measured number width. Condition text is
centered beneath the pair. Six metrics use aligned centers and tighter groups;
wind shows speed in km/h only. Outside-card chrome and forecast pixels are
unchanged. R1/R2 rendering is preserved through the versioned endpoint.
