---
title: Earlier combat formulas
description: Earlier wiki observations, retained for reference and not revalidated against 7.3.1.
order: 10
section: Reference
---

## Read these as earlier observations

These notes preserve information from the previous wiki. **Their exact formulas, caps, unlock thresholds, loot schedules and build recommendations have not been independently revalidated against Android 7.3.1.** They can differ from the current game or the experimental tools. Use the current in-game descriptions and results to check a claim before relying on it.

The [current coverage page](../../coverage/) explains the evidence levels. For a new player, start with [your first adventures](../getting-started/).

## Retained earlier notes

<div>


      <div>
        <h3>Base Stats</h3>
        <p><strong>HP</strong> — Health. If it hits 0, you die and adventure's over.</p>
        <p><strong>STR</strong> — Strength. Affects damage dealt. Base ATK = Weapon ATK + STR.</p>
        <p><strong>VIT</strong> — Vitality. Affects damage taken. Base DEF = Shield DEF + VIT.</p>
        <p><strong>SPD</strong> — Speed. Affects turn order, dodge rate, and consecutive attack probability. The one with higher speed goes first (unless First Strike). Dodge Rate and Consecutive Attack scale linearly with SPD up to cap of 80% at 16,000 SPD.</p>
        <div>
          4,000 SPD = +20% each | 8,000 SPD = +40% | 16,000 SPD = +80% (cap)
        </div>
        <p><strong>LUK</strong> — Luck. Affects item rarity rate (higher rarity = more abilities). Does not affect drop rate or crit chance. Max rarity from luck is red; does not affect legendary rate. ~90 luck guarantees at least red.</p>
      </div>

      <div>
        <h3>Damage Formulas</h3>
        <h4>Dealing Damage</h4>
        <div>
          Dmg = (Player ATK - Monster DEF)
        </div>
        <p>If monster DEF > player ATK, you deal 1-5 damage. All multipliers (attack type, crits) are applied to this value, not to raw ATK.</p>

        <h4>Taking Damage (M1+)</h4>
        <div>
          Dmg = max(Monster ATK × 0.03, Monster ATK - Player DEF) + 1~5
        </div>
        <p>Beyond M0, incoming damage can never be fully negated. Minimum is ~3% of monster's ATK + 1-5. Still worth investing in DEF up to monster's ATK value.</p>

        <h4>Taking Damage (M0)</h4>
        <div>
          Dmg = max(0, Monster ATK - Player DEF) + 1~5
        </div>

        <h4>Full Formula with Boosts</h4>
        <div>
          Dmg = ((Weapon ATK + Base STR × STR Boost) - Monster DEF) × Crit Dmg × ATK Type Dmg
        </div>
        <div>
          Taken = max(Monster ATK × 0.03, Monster ATK - (Shield DEF + Base VIT × VIT Boost)) + 1~5
        </div>
      </div>

      <div>
        <h3>Probability Stats</h3>
        <p><strong>Dodge Rate</strong> — Capped at 80%. Chance to dodge an enemy attack (0 damage). Scales with SPD or via Sixth Sense enchantment/boost.</p>
        <p><strong>Consecutive Attack</strong> — Capped at 80%. Chance to strike a second time before enemy attacks. Scales with SPD or via Double Strike. A consecutive attack cannot trigger another consecutive attack.</p>
      </div>

      <div>
        <h3>Critical Hits</h3>
        <p>Crit rate hard cap: <strong>90%</strong>. Max achievable crit damage: <strong>×7.5</strong>.</p>
        <div>
          Crit Dmg = (Player ATK - Monster DEF) × Crit Damage Multiplier
        </div>
        <p>Base crit damage is ×2 and base crit rate is 5%.</p>
        <p><strong>One Strike</strong> replaces base 5% crit rate with 20% (40% with Seven Blessings).</p>
        <p><strong>Three Paths</strong> provides 50% chance (100% with Seven Blessings) to replace ×2 with ×3.</p>
        <p>The crit damage boost from BP applies multiplicatively.</p>
        <p>To hit max crit rate and damage, you need to kill high level Adam (8 for rate, 10 for damage).</p>
      </div>

      <div>
        <h3>Poison</h3>
        <p>1 stack applied per attack landed when poison is enabled. Stacks indefinitely. Each stack deals a proportion of enemy's max HP before your turn.</p>
        <p><strong>Deadly Poison</strong> doubles the effect per stack.</p>
        <p>Bosses are immune to or greatly mitigate poison damage.</p>
      </div>

      <div>
        <h3>Attack Type Damage Boosts</h3>
        <p>Slashing, Bludgeoning, Piercing, and Projectile damage % boosts are available as permanent boosts. They function as multiplicative increases to damage (with the correct weapon type).</p>
        <div>
          Dmg = (Player ATK - Monster DEF) × Crit Dmg × ATK Type Dmg%
        </div>
        <p>Usually more worth the BP than putting points in STR, unless your ATK is barely above monster DEF.</p>
      </div>

      <div>
        <h3>Boost Multipliers</h3>
        <p>All boosts stack additively. So if a weapon's set bonus is listed as STR ×1.5, it really adds 0.5 to the STR boost value. If you also have +30% STR from permanent bonuses, that adds another 0.3, totaling ×1.8.</p>
        <p>Note: Values under Lv1 Status in the stats screen reflect the boost multiplier, while LvUP values do not.</p>
      </div>

      <div>
        <h3>Power Rating</h3>
        <p>Just all of your stats added together at ~Lv25. It's a rough measure of your hard numbers. Don't worry too much about it — you can crush or get crushed against the same enemy without your power rating changing at all depending on your setup.</p>
      </div>

    </div>

## Original source

[Earlier wiki source](https://github.com/JayMcArthur/Whipper-IdleRPG/blob/a9aba81d1a132e11f04b93fd7529e8ed68875163/guide-stats.html), preserved as community reference. Dates in platform release histories are separate from these observations.
