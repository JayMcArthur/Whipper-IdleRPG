from math import floor, ceil
from random import randint
from enitity import Player, Monster


def generate_attack_defense_mod(player: Player) -> list[float]:
    # Double Strike: #67  (20% chance to attack twice)
    double_strike = 67 in player.effects
    # Seven Blessings: #807 (The probability of probability-based abilities is doubled)
    seven_blessings = 1 + (807 in player.effects)
    # Three Paths: #803 (50% chance for critical damage to be *3)
    # Crit is 5% for 2x attack damage
    crit_damage = 1 + (0.5 * (803 in player.effects) * seven_blessings)
    # One Strike: #68  (Critical hit chance increases by 20%)
    crit_chance = 0.05 + (0.2 * (68 in player.effects) * seven_blessings)
    attack_mod = (1 + (crit_damage * crit_chance)) * (1 + (0.2 * double_strike * seven_blessings))
    defense_mod = 1 / (1 - (0.20 * (806 in player.effects) * seven_blessings))  # 1, 1.25, 1.66
    return [attack_mod, defense_mod]


def fight_realistic(attacker: Player | Monster, defender: Player | Monster, monster: int = 0, miasma: int = 5) -> list[int]:
    # Returns [attacker Win, Defender Win]

    # First Strike (66): Can always attack first in battle -- This happens outside
    # Poison (941): Deals ? damage at end of turn TODO This is wrong
    a_poison = 1 if 941 in attacker.effects else 0
    a_poisoned = 0
    d_poison = 1 if 941 in defender.effects else 0
    d_poisoned = 0
    # Seven Blessings (807): The probability of probability-based abilities is doubled
    a_seven_blessings = 1 + (807 in attacker.effects)
    d_seven_blessings = 1 + (807 in defender.effects)
    # Double Strike (67): 20% chance to attack twice
    a_double_strike = (0.2 * a_seven_blessings) if 67 in attacker.effects else 0
    d_double_strike = (0.2 * d_seven_blessings) if 67 in defender.effects else 0
    # Crit is 5% for 2x attack damage
    # Three Paths (803): 50% chance for critical damage to be *3
    a_three_paths = 803 in attacker.effects
    d_three_paths = 803 in defender.effects
    # One Strike (68): Critical hit chance increases by 20%
    a_crit_chance = 0.05 + (0.2 * (68 in attacker.effects) * a_seven_blessings)
    d_crit_chance = 0.05 + (0.2 * (68 in defender.effects) * d_seven_blessings)
    # Unyielding (961): Stay at 1 HP once during an adventure and deliver a critical hit on the next attack
    a_unyielding = 961 in attacker.effects
    d_unyielding = 961 in defender.effects
    if monster == 1:
        a_unyielding = attacker.effects.count(961)
    if monster == 2:
        d_unyielding = defender.effects.count(961)
    a_do_crit = False
    d_do_crit = False
    # Their HP
    a_hp = attacker.current_hp
    d_hp = defender.current_hp

    while True:
        # Attacker
        hits = 1
        check_double = randint(1, 100) / 100
        if check_double <= a_double_strike:
            hits += 1
        for i in range(hits):
            check_crit = randint(1, 100)/100
            if check_crit <= a_crit_chance or a_do_crit:
                if a_seven_blessings and a_three_paths:
                    crit_damage = 3
                elif a_three_paths:
                    crit_damage = 2 + randint(0, 1)
                else:
                    crit_damage = 2
                a_do_crit = False
            else:
                crit_damage = 1
            d_hp -= (max(attacker.attack - defender.defense, 0) + randint(0, 5) * miasma) * crit_damage
            d_poisoned += a_poison
            if d_hp <= 0:
                if not d_unyielding:
                    attacker.current_hp = a_hp
                    defender.current_hp = 0
                    return [1, 0]
                d_unyielding -= 1
                d_hp = 1
                d_do_crit = monster != 2
        a_hp -= a_poisoned
        if a_hp <= 0:
            if not a_unyielding:
                attacker.current_hp = 0
                defender.current_hp = d_hp
                return [0, 1]
            a_unyielding -= 1
            a_hp = 1
            a_do_crit = monster != 1

        # Defender
        hits = 1
        check_double = randint(1, 100) / 100
        if check_double <= d_double_strike:
            hits += 1
        for i in range(hits):
            check_crit = randint(1, 100)/100
            if check_crit <= d_crit_chance or d_do_crit:
                if d_seven_blessings and d_three_paths:
                    crit_damage = 3
                elif d_three_paths:
                    crit_damage = 2 + randint(0, 1)
                else:
                    crit_damage = 2
                d_do_crit = False
            else:
                crit_damage = 1
            a_hp -= (max(defender.attack - attacker.defense, 0) + randint(0, 5) * miasma) * crit_damage
            a_poisoned += d_poison
            if a_hp <= 0:
                if not a_unyielding:
                    attacker.current_hp = 0
                    defender.current_hp = d_hp
                    return [0, 1]
                a_unyielding -= 1
                a_hp = 1
                a_do_crit = monster != 1
        d_hp -= d_poisoned
        if d_hp <= 0:
            if not d_unyielding:
                attacker.current_hp = a_hp
                defender.current_hp = 0
                return [1, 0]
            d_unyielding -= 1
            d_hp = 1
            d_do_crit = monster != 2


def fight_quick(attacker: Player | Monster, defender: Player | Monster, monster: int = 0, do_both: bool = False) -> list[int]:
    # Returns [attacker Win, Defender Win]

    # First Strike (66): Can always attack first in battle -- This happens outside
    # Poison (941): Deals ? damage at end of turn TODO - I don't take this into account

    # Unyielding 961 (Stay at 1 HP once during an adventure and deliver a critical hit on the next attack)
    # I don't give the auto crit just keep the chance stuff
    a_unyielding = 961 in attacker.effects
    d_unyielding = 961 in defender.effects
    if monster == 1:
        a_unyielding = attacker.effects.count(961)
    if monster == 2:
        d_unyielding = defender.effects.count(961)

    a_mod = generate_attack_defense_mod(attacker)
    d_mod = generate_attack_defense_mod(defender)

    a_hp = attacker.current_hp
    a_damage = max(0, floor((attacker.attack * a_mod[0]) - (defender.defense * d_mod[1])))
    d_hp = defender.current_hp
    d_damage = max(0, floor((defender.attack * d_mod[0]) - (attacker.defense * a_mod[1])))

    # Simplify if you do near 0 damage in game
    #  In reality you would do some damage but uk
    if a_damage == 0 and d_damage == 0:
        attacker.current_hp = 0
        defender.current_hp = 0
        return [0, 0]
    if a_damage == 0:
        attacker.current_hp = 0
        return [0, 1 + do_both]
    if d_damage == 0:
        defender.current_hp = 0
        return [1 + do_both, 0]

    # Number of hits each can take
    a_hits = ceil(a_hp / d_damage) + a_unyielding
    d_hits = ceil(d_hp / a_damage) + d_unyielding

    if do_both and a_hits >= (d_hits + 1):
        attacker.current_hp -= floor(d_damage * d_hits)
        defender.current_hp = 0
        return [2, 0]
    elif do_both and a_hits == d_hits:
        attacker.current_hp = 0
        defender.current_hp = 0
        return [1, 1]
    elif do_both:
        attacker.current_hp = 0
        defender.current_hp -= floor(a_damage * a_hits)
        return [0, 2]

    if a_hits < d_hits:
        attacker.current_hp = 0
        defender.current_hp -= floor(a_damage * a_hits)
        return [0, 1, d_hp - floor(a_damage * a_hits)]
    attacker.current_hp -= floor(d_damage * (d_hits - 1))
    defender.current_hp = 0
    return [1, 0]

