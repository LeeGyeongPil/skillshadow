# Commands (hand-written excerpt for parser tests)

| Command | Purpose |
| --- | --- |
| `/alpha [x]` | Does alpha things. |
| `/beta` | **[Skill](https://example.test/skills.md#bundled-skills).** A bundled skill. |
| `/flow` | **[Workflow](https://example.test/workflows.md).** A bundled workflow. |
| `/gamma` | Alias for `/alpha` |
| `/delta` | Alias of [`/alpha`](https://example.test/alpha) |
| `/epsilon` | Does epsilon things. Alias: `/eps` |
| `/zeta` | Does zeta things. Aliases: `/z1`, `/z2` |
| `/eta` | Does eta things. Also available as `/h` |
| `/old` | Removed in v1.0. Use `/alpha` instead |
| `/pipe [a\|b]` | Has an escaped pipe in the usage cell. |
| `/two words` | Multi-word entry keeps the first word only. |

Not a table row: `/ignored` mentioned in prose.
