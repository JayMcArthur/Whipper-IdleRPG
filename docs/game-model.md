# Public tool model

The build editor, equipment comparison, graphs and encounter tester share `src/lib/game/`. Browser storage, localization, file import/export and UI rendering stay outside the calculation functions. Public game-table imports update this model's data without editing page templates.

## Items and builds

Each piece identifies actual game equipment and ability records. Ability values come from `customs.json`, not an interpolated curve or category/level arithmetic. `migrateLegacyBuild` converts the previous browser tool's category × 10000 + level encoding to those identities, including its different training-category order.

The model separates flat HP/STR/VIT/SPD/LUK, per-level growth, additive stat boosts, equipment power and attack-type BP. Character level 1 has no growth steps. Apples add one LUK each, including the valid zero-apple case. Permanent HP is entered as the actual bonus from the game; an old proof label does not invent a bonus.

All three ordinary slots allow the same normal effects, including rare combat abilities: fusion and shifting can change their positions. The separate tiered bonus uses only records classified as Legendary (`modLv=10000`), Mythic (`11000`), Noir (`12000`) or Omega (`13000`). Grade follows the actual effect record; Noir STR Boost 60% and Omega All Stats Boost 30% both display level 3. Intrinsic analysis effects are applied through analysis rules, not offered as ordinary slot choices. Saved rarity text remains metadata. Older imported selections outside a slot's pool remain visible and exportable, with a warning; they are excluded from calculations until corrected. This is slot-pool checking, not complete crafting or inventory legality validation.

Analysis effects require both analysis level and corrosion. Weapon/shield power uses base power + upgrade × upgrade factor + corrosion × 10 × corrosion factor, followed by the equipment power boost. Upgrade-limit increments add to the item's own base limit. Set matching uses source equipment identities. Ring specialization, matching attack-type mastery, solitude and all-stat effects are conditional and additive, rather than blanket high-analysis multipliers.

The retained community analysis extension supplies levels 21–25; current runtime parity for those rules is not established. Builds exceeding a modeled upgrade limit are identified in the editor. These tools do not establish inventory ownership or complete native-save legality.

Final character values and ATK/DEF are truncated to integer values. Historical workbooks sometimes retained fractional values, omitted corrosion gates, used strict `>` instead of `>=`, or subtracted one from STR/VIT. Those spreadsheet outputs are recorded as historical evidence, not treated as a rounding oracle.

## Curves and comparison

Graphs support standalone item contributions, a candidate swapped into the current build, and saved-build comparisons. Standalone values omit the character's base stats; swapping recalculates the entire build, including sets and mastery. Level ranges use character levels, with growth steps = level − 1. Large ranges are sampled with an explicitly reported step. Interactive charts have keyboard inspection and a comparison table; CSV and SVG exports are local downloads.

Weighted score is `floor(HP × hpWeight + ATK × attackWeight + DEF × defenseWeight)`. Its default 0/.5/.5 follows the old graph workbook's weighting, with the equipment-power contribution labelled as ATK/DEF. It is a user-selected comparison, not universal combat power or a dungeon recommendation.

## Dungeon layouts

Normal dungeon codes use an Android-compatible UTF-16 code-unit sum followed by the Dart VM's seeded MWC stream. Numeric seeds are a separate explicit mode. The implementation performs the same five bounded random calls for prefix, location, floor count, floor time and starting monster. Four-floor bands advance by three monster slots; prefixes choose strides 2, 3 or 4. Known public long/short code fixtures guard the stream and layout. Dart notes that [random streams can change across releases](https://api.dart.dev/dart-math/Random/Random.html); [the VM implementation](https://github.com/dart-lang/sdk/blob/main/sdk/lib/_internal/vm/lib/math_patch.dart) and its BSD notice are retained as attribution.

Code layout does not predict an adventure's random events or guarantee a possible endpoint boss. `wonderland` selects the recorded story dungeon. Known special codes and runtime-generated areas are distinct from normal random generation. Sparse or sentinel encounter tables do not imply zero enemies. An observed floor-pool input supports special/custom areas without silently inventing their rules.

Miasma scaling follows the developer-published monster arithmetic retained with the earlier wiki: integer truncation for the dungeon base factor, per-four-floor scaling, the special Emperor Teba attack expression, and the documented older Royal Tomb group/miasma calculation. Tomb endpoints, elites, new modes and special bosses need additional current runtime evidence.

## Encounter benchmarks

Each listed enemy is tested independently at full player HP and the chosen character level. Results show modeled wins, draws, mean remaining HP and a bounded, repeatable action trace. This is **not** a complete adventure-clear probability: there is no cumulative adventure HP, XP leveling, fountain/event generation or loot simulation.

The scenario model uses post-defense critical damage, the imported probability abilities and their Seven Blessings modifier, an additional Double Strike hit, and one Unyielding revival per independent fight. Initiative uses speed and First Strike. Speed-derived dodge/extra-hit curves are not inferred; their bonuses are explicit scenario inputs. Damage roll and poison-stack fractions are visible settings. Enemy special abilities and boss phases are not supplied by the base monster table; affected phase-dependent encounters remain unmodeled rather than receiving an apparent win rate. Actions stop immediately when a combatant dies; the round budget yields a draw rather than an invented result.

## Manual Item Book

The current table determines which items appear. Existing records and records for unknown IDs are preserved. Known cumulative XP thresholds through level 25 come from the retained community table; extra XP rolls through those known thresholds. Higher levels are retained without inventing another threshold. Book BP uses the older `floor(analysis / 5)` estimate and is labelled accordingly; native progression and proofs determine the actual available budget.

## Workbook references

- [Whipper 3.0](https://docs.google.com/spreadsheets/d/1CEHI31u0ZrdNPDLg2yH6M5YVw9gNvo0B8mnf7p7yP60/edit): editor dimensions, raw data tabs, analysis table and item-strength formulas. Several final calculator references are broken.
- [Whipper Charts](https://docs.google.com/spreadsheets/d/1KNLxanQtWw1b4sK8csrTu0L_7nzu36Hz6WyjcZkFNFw/edit): twelve HP/STR/VIT/weighted curves and adjustable weights. Cached chart points predate current tables.
- [Whipper Backup 22/12/22](https://docs.google.com/spreadsheets/d/1UdhoJtvZEdnUhYAaH1LgsnsuhaC378OgTpw1Ly3bDF8/edit): working historical comparison and alternating combat trace, including guaranteed-crit and post-death continuation defects corrected by this model.
- [Whipper integrated reference](https://docs.google.com/spreadsheets/d/1WAH8x1Bw6Y6A5kXe1LfM1CXEQTXT-9ldbCX_iq2uVTs/edit) and [imported copy](https://docs.google.com/spreadsheets/d/12py-HY5uMEma8FKLVwgMlFoix5sS_rIq/edit): analysis matrices, conditional set/mastery/specialization, item curves and four-floor monster pools. These related copies are not independent proof of current game mechanics.
