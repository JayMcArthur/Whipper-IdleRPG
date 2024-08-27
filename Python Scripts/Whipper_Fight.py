from math import floor, ceil
from itertools import combinations_with_replacement, combinations, product




from json_to_python import make_lists, monster_list, equip_list, custom_list, dungeon_list, level_list
from enitity import Monster, Player

# This is the defaults of items
UPGRADE_MAX = 20000
ANALYSIS_MAX = 15
CORROSION_MAX = 999


record_g = []


# This was made using the results from create_all_items_keys
# We take the best of every result and store them here for enchant use
# Enchants where processed and added as notes below
best_equips_normal = {
    "1": [[189, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [190, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [189, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [188, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [183, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [182, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [178, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [175, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [172, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [171, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "5": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "10": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "15": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "20": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "25": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "30": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "35": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "40": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "45": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
    "50": [[100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0],
          [100, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0]],
}
# Same as above but focused on str
# Updated to V63
best_equips_strength = {
    "1": [188, 230, 230, 230, 226, 230, 230, 230, 322, 67, 68, 807],
    "5": [188, 230, 230, 230, 226, 230, 230, 230, 322, 67, 68, 807],
    "10": [188, 230, 230, 230, 226, 230, 230, 230, 322, 67, 68, 807],
    "15": [188, 230, 230, 230, 226, 230, 230, 230, 322, 67, 68, 807],
    "20": [188, 230, 230, 230, 226, 230, 230, 230, 322, 67, 68, 807],
    "25": [188, 230, 230, 230, 226, 230, 230, 230, 322, 67, 68, 807],
    "30": [188, 630, 630, 630, 226, 630, 630, 630, 322, 67, 68, 807],
    "35": [188, 630, 630, 630, 226, 630, 630, 630, 322, 67, 68, 807],
    "40": [188, 630, 630, 630, 226, 630, 630, 630, 322, 67, 68, 807],
    "45": [188, 630, 630, 630, 226, 630, 630, 630, 322, 67, 68, 807],
    "50": [188, 630, 630, 630, 226, 630, 630, 630, 322, 67, 68, 807]
}


# TODO - OUTDATED
#  Equip Sets
#  171: 220, 220, 220 | 244: 320, 320, 320 | 303: 120, 120, 120
#  182: 220, 220, 320 | ^^^^^^^^^^^^^^^^^^ | 323: 120, 120, 120
#  182: 220, 220, 220 | ^^^^^^^^^^^^^^^^^^ | 323: 220, 120, 120
#  182: 615, 615, 615 | 244: 715, 715, 715 | 323: 615, 515, 515
#  175: 615, 615, 615 | 246: 715, 715, 715 | ^^^^^^^^^^^^^^^^^^

# TODO - OUTDATED
#  ID ______________________ Name: [LVL] Items
#  01 _______________Grassy Knoll: [02] W1, A1, R1
#  02 _______________ Lost Forest: [07] W1, A1, R1
#  03 _________________ Deep Cave: [14] W2, A1, R2
#  04 ____________ Twilight House: [14] W2, A1, R2
#  05 ____________ Secret Passage: [21] W2, A1, R3
#  06 ____ Old Battlefield of Fog: [04] W1, A1, R1
#  07 ____ Giant Tower of Justice: [42] W4, A2, R4
#  08 _____ Door to Another World: [01] W1, A1, R1
#  09 __________ Dimensional Rift: [29] W3, A1, R3
#  10 The Magic Castle of the End: [44] W4, A2, R4
#  99 ____________ Thousand Hands: [50] W5, A3, R4



def create_all_items_keys(lineup: list, print_stuff: bool) -> None:
    # Every Combination
    for w_key in [x for x in list(equip_list.keys()) if x < 200]:
        for a_key in [y for y in list(equip_list.keys()) if 200 < y < 300]:
            for r_key in [z for z in list(equip_list.keys()) if 300 < z]:
                lineup.append([w_key, 0, 0, 0, a_key, 0, 0, 0, r_key, 0, 0, 0])
    if print_stuff:
        print(f"Number of item combinations: {len(lineup)}")


def add_all_enchantments(lineup: list, lvl: int, print_stuff: bool) -> list[list[int]]:
    # Endurance 30: #130 (16000 HP)
    # Strength 30: #230 (16000 STR)
    # Sturdy 30: #330 (16000 VIT)
    # Agility 20: #420 (655 SPD) -- SKIPPED -- First Strike better
    # Luck 3: #30 (3 LUK) -- SKIPPED -- Apples better
    # Endurance Training 30: #530 (630 HP ^)
    # Strength Training 30: #630 (630 STR ^)
    # Defense Training 30: #730 (630 VIT ^)

    # These I will allow any amount of
    if lvl > 25:
        main_enchantments = [630, 730, 530]
    else:
        main_enchantments = [130, 230, 330]

    # First Strike: #66 (Can always attack first in battle)
    # Double Strike: #67 (20% chance to attack twice)
    # One Strike: #68 (Critical hit chance increases by 20%)
    # Three Paths: #803 (50% chance for critical damage to be tripled)
    # Sixth Sense: #806 (20% chance to dodge an attack)
    # Seven Blessings: #807 (The probability of probability-based abilities is doubled)
    # These can only be in a gear set once
    side_enchantments = [66, 67, 68, 803, 806, 807]

    enchantments = list(combinations_with_replacement(main_enchantments, 9))
    for i in range(1, min(len(side_enchantments), 10)):
        enchantments += list(a + b for a, b in product(combinations_with_replacement(main_enchantments, 9 - i), combinations(side_enchantments, i)))

    if print_stuff:
        print(f'Number of enchantment combinations: {len(enchantments)}')

    lineup_updated = []
    for enchant in enchantments:
        for player in lineup:
            lineup_updated.append([player[0]] + list(enchant[0:3]) + [player[4]] + list(enchant[3:6]) + [player[8]] + list(enchant[6:9]))
    return lineup_updated


def add_str_enchantments(lineup: list, lvl: int, print_stuff: bool) -> list[list[int]]:
    # Strength 30: #230 (16000 STR)
    # Strength Training 30: #630 (630 STR ^)
    # These I will allow any amount of
    if lvl > 25:
        main_enchantments = [630]
    else:
        main_enchantments = [230]

    # First Strike: #66 (Can always attack first in battle)
    # Double Strike: #67 (20% chance to attack twice)
    # One Strike: #68 (Critical hit chance increases by 20%)
    # Three Paths: #803 (50% chance for critical damage to be tripled)
    # Seven Blessings: #807 (The probability of probability-based abilities is doubled)
    # These can only be in a gear set once
    side_enchantments = [66, 67, 68, 803, 807]

    enchantments = list(combinations_with_replacement(main_enchantments, 9))
    for i in range(1, min(len(side_enchantments), 10)):
        enchantments += list(a + b for a, b in product(combinations_with_replacement(main_enchantments, 9 - i), combinations(side_enchantments, i)))

    if print_stuff:
        print(f'Number of enchantment combinations: {len(enchantments)}')

    lineup_updated = []
    for enchant in enchantments:
        for player in lineup:
            lineup_updated.append([player[0]] + list(enchant[0:3]) + [player[4]] + list(enchant[3:6]) + [player[8]] + list(enchant[6:9]))
    return lineup_updated

def rank_sort(e: list[int]) -> int:
    return e[4]


def str_sort(e: Player) -> int:
    return floor(e.attack * generate_attack_defense_mod(e)[0])

def hp_sort()

def s_print(records: list, lineup: list, lvl: int, name: str) -> None:
    f = open(f'{name} Level {lvl} Results.txt', "w")
    # print("Rank #: Player # - [Win, Tie, 1]")
    for i in range(len(records)):
        # print(f"Rank {records[i][4]:03}: {records[i][3]:03} - [{records[i][0]:03}, {records[i][2]:02}, {records[i][1]:03}] - {lineup[records[i][3]].print()}")
        f.write(f"Rank {records[i][4]:03}: {records[i][3]:03} - [{records[i][0]:03}, {records[i][2]:02}, {records[i][1]:03}] - {lineup[records[i][3]].print()}\n")
    f.close()


def run_custom_setups(levels: list[int]):
    setups = [
        [171, 130, 230, 230, 244, 230, 230, 330, 303, 330, 66, 806],
        [171, 130, 230, 230, 244, 230, 230, 330, 303, 330, 330, 66],
        [171, 130, 130, 230, 244, 230, 230, 230, 303, 330, 330, 806],
        [171, 130, 130, 130, 244, 230, 230, 230, 303, 230, 66, 67],
        [171, 130, 130, 230, 244, 230, 230, 230, 303, 330, 330, 330],
        [171, 130, 130, 230, 244, 230, 230, 230, 303, 330, 67, 806],
        [171, 130, 230, 230, 244, 230, 230, 330, 303, 330, 330, 330],
        [171, 130, 230, 230, 244, 230, 230, 330, 303, 330, 330, 806],
        [171, 130, 230, 230, 244, 230, 230, 230, 303, 230, 66, 67],
        [171, 130, 130, 130, 244, 230, 230, 230, 303, 230, 230, 67],
        [171, 130, 230, 230, 244, 230, 230, 230, 303, 330, 330, 67],
        [171, 130, 130, 130, 244, 230, 230, 230, 303, 230, 330, 67],
        [171, 130, 130, 230, 244, 230, 230, 230, 303, 230, 330, 67],
        [171, 130, 230, 230, 244, 230, 230, 330, 303, 330, 66, 67],
        [171, 130, 230, 230, 244, 230, 230, 330, 303, 330, 67, 806],
        [171, 130, 230, 230, 244, 230, 230, 230, 303, 330, 66, 67],
        [171, 130, 230, 230, 244, 230, 230, 330, 303, 330, 330, 67],
        [171, 130, 130, 230, 244, 230, 230, 230, 303, 330, 66, 67],
        [171, 130, 130, 230, 244, 230, 230, 230, 303, 330, 330, 67],
        [171, 130, 130, 230, 244, 230, 230, 230, 303, 230, 66, 67]
    ]

    # Custom Equips
    final_lineup = []
    for keys in setups:
        final_lineup.append(Player())
        final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)

    for lvl in levels:
        for i in range(len(final_lineup)):
            final_lineup[i].apply_level(lvl)
        # Initialize the record
        # Win, Lose, Tie, ID, Rank
        record = [[0, 0, 0, i, 0] for i in range(len(final_lineup))]
        run_lineup(final_lineup, record, lvl, False, False)

        s_print(record, final_lineup, max(1, lvl * 5), 'custom')


def main(run_custom: bool, run_str: bool, run_all: bool, run_enchant: bool) -> None:
    if run_custom:
        run_custom_setups([1, 50])

    # Best items for strength
    if run_str:
        lineup = []
        create_all_items_keys(lineup, True)

        # Initialize STR Players
        final_lineup = []
        for keys in lineup:
            final_lineup.append(Player())
            final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)

        # Run level 1 - 50
        for lvl in range(11):
            for i in range(len(final_lineup)):
                final_lineup[i].apply_level(max(1, lvl * 5))
            final_lineup.sort(key=str_sort)
            print(f"Best {max(1, lvl * 5)}: {final_lineup[-1].print()}")
            print(f"_2nd {max(1, lvl * 5)}: {final_lineup[-2].print()}")
            print(f"_3rd {max(1, lvl * 5)}: {final_lineup[-3].print()}")

        # Initialize STR Players with Enchants
        final_lineup = []
        lineup_enchanted = add_str_enchantments(lineup, 1, True)
        for keys in lineup_enchanted:
            final_lineup.append(Player())
            final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)
        del lineup_enchanted

        # Run level 1 - 25
        for lvl in range(6):
            for i in range(len(final_lineup)):
                final_lineup[i].apply_level(max(1, lvl * 5))
            final_lineup.sort(key=str_sort)
            print(f"Best {max(1, lvl * 5)}: {final_lineup[-1].print()}")
            print(f"_2nd {max(1, lvl * 5)}: {final_lineup[-2].print()}")
            print(f"_3rd {max(1, lvl * 5)}: {final_lineup[-3].print()}")

        # Initialize Players
        lineup_enchanted = add_str_enchantments(lineup, 50, True)
        final_lineup = []
        for keys in lineup_enchanted:
            final_lineup.append(Player())
            final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)
        del lineup_enchanted
        del lineup

        # Run level 30 - 50
        for lvl in range(6, 11):
            for i in range(len(final_lineup)):
                final_lineup[i].apply_level(max(1, lvl * 5))
            final_lineup.sort(key=str_sort)
            print(f"Best {max(1, lvl * 5)}: {final_lineup[-1].print()}")
            print(f"_2nd {max(1, lvl * 5)}: {final_lineup[-2].print()}")
            print(f"_3rd {max(1, lvl * 5)}: {final_lineup[-3].print()}")

    # Best items overall
    if run_all:
        lineup = []
        create_all_items_keys(lineup, True)

        # Initialize Players
        final_lineup = []
        for keys in lineup:
            final_lineup.append(Player())
            final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)
        del lineup

        # Run Sims
        for lvl in range(11):
            for i in range(len(final_lineup)):
                final_lineup[i].apply_level(max(1, lvl * 5))
            # Initialize the record
            # Win, Lose, Tie, ID, Rank
            # record = run_lineup_multiprocessing(final_lineup)  # This still is not faster and has memory errors
            record = [[0, 0, 0, i, 0] for i in range(len(final_lineup))]
            run_lineup(final_lineup, record, max(1, lvl * 5), True, True)
            s_print(record, final_lineup, max(1, lvl * 5), 'combination')
            best_equips_normal[f'{max(1, lvl * 5)}'] = [final_lineup[-1].weapon.id, 0, 0, 0, final_lineup[-1].armor.id, 0, 0, 0, final_lineup[-1].ring.id, 0, 0, 0]

    # Best Enchantments for Best Items
    if run_enchant:
        for lvl in range(11):
            lineup = add_all_enchantments([best_equips_normal[f'{max(1, lvl * 5)}']], max(1, lvl * 5), False)
            final_lineup = []
            for keys in lineup:
                final_lineup.append(Player())
                final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)
                final_lineup[-1].apply_level(max(1, lvl * 5))
            # Initialize the record
            # Win, Lose, Tie, ID, Rank
            record = [[0, 0, 0, i, 0] for i in range(len(final_lineup))]
            run_lineup(final_lineup, record, max(1, lvl * 5), True, False)
            s_print(record, final_lineup, max(1, lvl * 5), 'enchantment')


if __name__ == '__main__':
    make_lists()
    main(False, False, True, True)
