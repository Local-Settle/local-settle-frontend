# Dark theme contrast audit

Contrast ratios below use the WCAG relative-luminance formula. Normal text requires 4.5:1; large text and non-text controls require 3:1.

| UI color | Background | Ratio | Result |
| --- | --- | ---: | --- |
| Muted text `#9BABB7` | App background `#081521` | 7.81:1 | Pass |
| Muted text `#9BABB7` | Surface `#0D1D2C` | 7.24:1 | Pass |
| Accent `#55D6BE` | App background `#081521` | 10.31:1 | Pass |
| Disabled button text `#B8C5CE` | Raised surface `#11212E` | 9.30:1 | Pass |
| Disabled button text `#B8C5CE` | Neutral action `#2A292F` | 8.18:1 | Pass |

The shared muted and accent colors already pass AA on the primary dark surfaces. Disabled buttons were the weak case: individual controls applied reduced opacity to their text and icons. The global disabled-button rule now keeps their foreground fully legible while preserving each control's disabled background and behavior.

Checked representative shared surfaces and controls: app body, raised cards, recent-session refresh, and the P2P mark-as-paid action. Recheck any new foreground/background pair when adding a new theme color.
