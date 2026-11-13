---
title: Understand your stats
description: What HP, STR, VIT, SPD, LUK and the level-up values tell you about a build.
order: 2
section: Mechanics
---

Read a build in two parts: the stats it starts with, and how it grows during an adventure. The game resets the adventurer's level between runs, so both can matter.

## The five basic stats

| Stat | What it helps you understand |
| --- | --- |
| **HP** | Health. Reaching zero in battle ends the adventurer's ability to continue. |
| **STR** | Strength; affects damage dealt to enemies. |
| **VIT** | Vitality; affects damage received from enemies. |
| **SPD** | Speed; affects attack order, evasion and consecutive attacks. |
| **LUK** | Luck; affects the chance of obtaining items with abilities. |

These descriptions follow the explanations in the captured game text. They do not establish every formula or probability cap.

## Lv1, LvUP and boosts

- **Lv1** is the base value at the start of an adventure.
- **LvUP** is the amount added when the adventurer gains a level.
- **Boost** describes a multiplier affecting the final stat.

A flat increase can help immediately. A growth increase needs levels before its full value is felt. Neither is universally better: consider how long the run lasts and whether an enemy changes your level or other stats.

The reference shows base equipment contributions and their per-level gains separately. Your actual item and character can also have upgrades, corrosion, analysis, abilities, set effects and permanent progress.

## ATK and DEF are not the same as STR and VIT

Weapon power and character strength both contribute to an offensive setup. Armor power and character vitality contribute to defense. Enemy ATK and DEF in the reference are their base table values, not a prediction of the stats you will encounter at every miasma level or special floor.

Damage depends on the opponent as well as the player. A universal sum of HP, attack and defense is not enough to tell you which build will clear a particular dungeon.

## Read abilities as part of the build

First Strike, Double Strike, One Strike, poison and other abilities change what happens in combat. The [ability reference](../../enchantments/) preserves the game's descriptions and each recorded level/value.

Read the effect rather than inferring it from the English name. Some abilities use special conditions, and bosses can have exceptions. A number in a source table is not necessarily a final probability after all modifiers.

## How to diagnose a failed run

- **Defeated before you can do enough:** inspect starting HP, defense, turn order and the enemy's special rules.
- **Survive but cannot finish:** inspect damage, attack type and any resistance or healing mechanic.
- **Works sometimes:** consider probability-based effects, encounter variation and whether the claimed success rate came from enough runs.
- **An upgrade behaves unexpectedly:** check analysis/corrosion thresholds, the item type and any set or ring effect before assuming a calculation bug in the game.

## What is still being checked

Exact damage order, rounding, probability stacking, speed caps, poison timing and boss exceptions are not established by the static tables alone. Older wiki formulas and calculator outputs are community work, not a verified 7.3.1 combat specification. The [coverage page](../../coverage/) separates current table data from these observations.

## Earlier community reference

[Earlier combat formulas](../community-stats/) preserves the previous wiki's detailed notes, with their verification limits clearly marked.
