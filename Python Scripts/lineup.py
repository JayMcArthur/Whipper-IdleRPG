from itertools import combinations_with_replacement, combinations, product
from multiprocessing import Pool, shared_memory
from math import floor, ceil
from random import randint
import numpy as np

from enitity import Player, Monster, generate_attack_defense_mod, UPGRADE_MAX, ANALYSIS_MAX, CORROSION_MAX
from json_to_python import dungeon_list, equip_list


def run_lineup_quick(lineup: list[Player], record: list, lvl: int, print_stuff: bool, ignore_spd: bool) -> None:
    fights = 0
    total_fights = floor((len(lineup) * (len(lineup) + 1)) / 2)
    percent = 0

    for id_a, per_a in enumerate(lineup):
        for id_b, per_b in enumerate(lineup[id_a + 1::]):
            id_b += id_a + 1

            # First Strike (66)
            if ignore_spd:
                results = fight_quick(per_a, per_b, 0, True)
            elif 66 not in per_b.effects and (66 in per_a.effects or per_a.spd > per_a.spd):
                results = fight_quick(per_a, per_b)
            elif not ignore_spd and 66 not in per_a.effects and (66 in per_b.effects or per_b.spd > per_a.spd):
                results = fight_quick(per_b, per_a)[::-1]
            else:
                results = fight_quick(per_a, per_b, 0, True)
                # results = [a + b for a, b in zip(fight_func(per_a, per_b, True), fight_func(per_b, per_a, True)[::-1])]

            per_a.current_hp = per_a.hp
            per_b.current_hp = per_b.hp

            if results[0] > 0 and results[1] == 0:
                record[id_a][0] += 1
                record[id_b][1] += 1
            elif results[0] == 0 and results[1] > 0:
                record[id_a][1] += 1
                record[id_b][0] += 1
            else:
                record[id_a][2] += 1
                record[id_b][2] += 1
            fights += 1
            if print_stuff and floor(fights / total_fights * 100) >= percent + 5:
                percent = floor(fights / total_fights * 100)
                print(f'Level {lvl} - {floor(fights / total_fights * 100):2}% - {fights} / {total_fights}')


def run_dungeon_quick(lineup: list[Player], dungeon: list[Monster], record: list, print_stuff: bool) -> None:
    # This expects player lineup vs a monster lineup
    # Players keep xp and level up
    fights = 0
    total_fights = len(lineup) * len(dungeon)
    percent = 0

    for id_a, per in enumerate(lineup):
        for id_b, mon in enumerate(dungeon):

            # First Strike (66)
            if 66 in per.effects or per.spd > mon.spd:
                results = fight_quick(per, mon, 2)
            elif mon.spd > per.spd:
                results = fight_quick(mon, per, 1)[::-1]
            else:
                results = fight_quick(per, mon, 2, True)
                # results = [a + b for a, b in zip(fight_func(per_a, per_b, True), fight_func(per_b, per_a, True)[::-1])]

            mon.current_hp = mon.hp

            # Save the win
            if results[0] > 0 and results[1] == 0:
                record[id_a][0] += 1
                fights += 1
                per.gain_xp(mon.xp)
            else:
                record[id_a][0] += 1
                fights += 1 + len(dungeon) - id_b
                break

            if print_stuff and floor(fights / total_fights * 100) >= percent + 5:
                percent = floor(fights / total_fights * 100)
                print(f'{floor(fights / total_fights * 100):2}% - {fights} / {total_fights}')
        record[id_a][1] = per.current_hp


##################
# Sort Functions #
##################


def rank_sort(r: list[int]) -> int:
    # 3 points for win, 1 point for tie
    return (r[0] * 3) + r[2]


def str_sort(e: Player, include_modifier: bool = True) -> int:
    mod = generate_attack_defense_mod(e)[0] if include_modifier else 1
    return floor(e.attack * mod)


def vit_sort(e: Player, include_modifier: bool = False) -> int:
    mod = generate_attack_defense_mod(e)[1] if include_modifier else 1
    return floor(e.defense * mod)


def hp_sort(e: Player):
    return e.current_hp


def dungeon_sort(r: list[int]) -> int:
    # Wins + HP
    return r[0] + r[1]


#############################
# Multiprocessing functions #
#############################
# These do not work yet


def worker(arg) -> list[int]:
    idx_a, idx_b, shm_name, shape, ignore_spd = arg

    # Access shared memory
    existing_shm = shared_memory.SharedMemory(name=shm_name)
    stats_array = np.ndarray(shape, dtype=np.int32, buffer=existing_shm.buf)

    # Extract player stats
    a_hp, a_attack, a_def, a_unyielding, a_spd, a_fs = stats_array[idx_a]
    b_hp, b_attack, b_def, b_unyielding, b_spd, b_fs = stats_array[idx_b]

    # (HP, ATK, DEF, Unyielding, SPD, First_Strike)
    # 66 - First Strike
    if not ignore_spd and not b_fs and (a_fs or a_spd > b_spd):
        results = 1  # fight_multiprocessing(a_hp, a_attack, a_def, a_unyielding, b_hp, b_attack, b_def, b_unyielding)
    elif not ignore_spd and not a_fs and (b_fs or b_spd > a_spd):
        results = 1  # fight_multiprocessing(b_hp, b_attack, b_def, b_unyielding, a_hp, a_attack, a_def, a_unyielding)[::-1]
    else:
        results = 1  # [a + b for a, b in zip(fight_multiprocessing(a_hp, a_attack, a_def, a_unyielding, b_hp, b_attack, b_def, b_unyielding), fight_multiprocessing(b_hp, b_attack, b_def, b_unyielding, a_hp, a_attack, a_def, a_unyielding)[::-1])]
    return [idx_a, idx_b, results]


def process_fight_results(arg) -> None:
    id_a, id_b, result = arg
    if result[0] > 0 and result[1] == 0:
        record_g[id_a][0] += 1
        record_g[id_b][1] += 1
    elif result[0] == 0 and result[1] > 0:
        record_g[id_a][1] += 1
        record_g[id_b][0] += 1
    else:
        record_g[id_a][2] += 1
        record_g[id_b][2] += 1


def run_lineup_multiprocessing(lineup: list[Player], ignore_spd: bool) -> None:
    global record_g

    # Initialize the record: [Wins, Losses, Ties, ID, Rank]
    record_g = [[0, 0, 0, i, 0] for i in range(len(lineup))]

    # Calculate the size of the shared memory needed
    shm = shared_memory.SharedMemory(create=True, size=len(lineup) * 6 * np.dtype(np.int32).itemsize)
    stats_array = np.ndarray((len(lineup), 6), dtype=np.int32, buffer=shm.buf)

    # Create the NumPy array to hold player stats
    for i, player in enumerate(lineup):
        # mods = generate_attack_defense_mod(player)
        stats_array[i] = [player.hp, floor(player.attack), floor(player.defense), int(961 in player.effects), player.spd, int(66 in player.effects)]

    # Setup multiprocessing
    pool = Pool(4)

    # Use apply_async with callback to process results as they complete
    for idx_a, idx_b in combinations(range(len(lineup)), 2):
        # pool.apply_async(worker, [(idx_a, idx_b, shm.name, stats_array.shape)], callback=process_fight_results_temp)
        pool.apply_async(worker, [(idx_a, idx_b, shm.name, stats_array.shape, ignore_spd)], callback=process_fight_results)

    # Close the pool and wait for all workers to finish
    pool.close()
    pool.join()

    # Cleanup shared memory
    shm.close()
    shm.unlink()

    # Calculate the rank based on Wins and Ties
    for i in range(len(lineup)):
        record_g[i][4] = (record_g[i][0] * 3) + record_g[i][2]


####################
# Battle Functions #
####################


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
            check_crit = randint(1, 100) / 100
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
            check_crit = randint(1, 100) / 100
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
    a_damage = max(0, floor((attacker.attack - defender.defense) * a_mod[0]))
    d_hp = defender.current_hp
    d_damage = max(0, floor((defender.attack - attacker.defense) * d_mod[0]))

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
    # a_unyielding is Resurrect for Monsters
    a_hits = ceil(a_hp / d_damage * a_mod[1]) + a_unyielding
    if monster == 1:
        a_hits = ceil(a_hp / d_damage * a_mod[1]) * (a_unyielding + 1)
    d_hits = ceil(d_hp / a_damage * d_mod[1]) + d_unyielding
    if monster == 2:
        d_hits = ceil(d_hp / a_damage * d_mod[1]) * (d_unyielding + 1)

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
        return [0, 1]
    attacker.current_hp -= floor(d_damage * (d_hits - 1))
    defender.current_hp = 0
    return [1, 0]


###########################
# Create Lineup / Dungeon #
###########################

def create_dungeon(dungeon: list[Monster], identifier: int, end_floor: int = 0):
    # Floor type determines the amount of monsters you fight
    # 1/60 Demon Nest:     80% Monster, 01% Treasure, 05% Fountain, 14% Nothing
    # 1/60 Treasure Floor: 10% Monster, 50% Treasure, 10% Fountain, 30% Nothing
    # 1/60 Oasis Floor:    10% Monster, 10% Treasure, 50% Fountain, 30% Nothing
    # 57/60 Normal Floor   55% Monster, 02% Treasure, 03% Fountain, 40% Nothing
    # Total: 53.916 Monster, 2.916 Treasure, 3.933 Fountain, 39.233 Nothing
    # We use average for normal dungeon
    # We use Demon Nest for Royal Tomb
    chance_mon = 53916
    chance_treasure = chance_mon + 2916
    chance_fountain = chance_treasure + 3933
    chance_nothing = chance_fountain + 39233

    royal_tomb = False
    if identifier == 12:
        royal_tomb = True
        if end_floor == 0 or end_floor % 50 != 0:
            print(f'Royal Tomb needs a correct ending floor number')
            return
        if end_floor % 300 == 0:
            list_id = 123
        elif end_floor % 100 == 0:
            list_id = 122
        else:
            list_id = 121
        chance_mon = 80000
        chance_treasure = chance_mon + 1000
        chance_fountain = chance_treasure + 5000
        chance_nothing = chance_fountain + 14000
    else:
        list_id = identifier

    if list_id not in dungeon_list.keys():
        print(f'No Dungeon with ID {list_id}')
        return

    for floor_id in range(1, dungeon_list[list_id]['maxFloor'] + 1):
        # We waste 1 minute just displaying the floor type
        for minute in range(dungeon_list[list_id]['minutesPerFloor'] - 1):
            while True:
                event = randint(1, 100000)
                if event <= chance_nothing:
                    # The % are repeating numbers in avg
                    # so we throw away all results in that small region
                    # This keeps the chance per option correct
                    break

            if event <= chance_mon:
                monster_index = randint(0, len(dungeon_list[list_id]['monsters'][f'{floor_id}']) - 1)
                monster_id = dungeon_list[list_id]['monsters'][f'{floor_id}'][monster_index]
                dungeon.append(Monster(monster_id, identifier, end_floor, dungeon_list[list_id]['nameId_EN'], royal_tomb))
                pass
            elif event <= chance_treasure:
                # Gives Treasure which we don't care about
                pass
            elif event <= chance_fountain:
                # TODO - This should do something but right now I don't
                #  It should roll for each stat and then give 1 to 4
                pass
            elif event <= chance_nothing:
                # Nothing happens
                pass

    if dungeon_list[list_id]['boss']:
        monster_id = dungeon_list[list_id]['monsters'][f'{dungeon_list[list_id]["maxFloor"] + 1}'][0]
        dungeon.append(Monster(monster_id, identifier, end_floor, dungeon_list[list_id]['nameId_EN'], royal_tomb))


def create_all_items_keys(lineup: list, print_stuff: bool) -> None:
    # Every Combination
    for w_key in [x for x in list(equip_list.keys()) if x < 200]:
        for a_key in [y for y in list(equip_list.keys()) if 200 < y < 300]:
            for r_key in [z for z in list(equip_list.keys()) if 300 < z]:
                lineup.append([w_key, 0, 0, 0, a_key, 0, 0, 0, r_key, 0, 0, 0])
    if print_stuff:
        print(f"Number of item combinations: {len(lineup)}")


def add_enchantments(lineup: list, lvl: int, only_str: bool, only_vit: bool, print_stuff: bool) -> list[list[int]]:
    # Endurance 30: #130 (16000 HP)
    # Strength 30: #230 (16000 STR)
    # Sturdy 30: #330 (16000 VIT)
    # Agility 20: #420 (655 SPD) -- SKIPPED -- First Strike better
    # Luck 3: #30 (3 LUK) -- SKIPPED -- Apples better
    # Endurance Training 30: #530 (630 HP ^)
    # Strength Training 30: #630 (630 STR ^)
    # Defense Training 30: #730 (630 VIT ^)

    # These I will allow any amount of
    if lvl == -1:
        main_enchantments = [130, 230, 330, 530, 630, 730]
    elif 25 < lvl < 51:
        main_enchantments = [530, 630, 730]
        if only_str:
            main_enchantments = [630]
        elif only_vit:
            main_enchantments = [730]
    else:
        main_enchantments = [130, 230, 330]
        if only_str:
            main_enchantments = [230]
        elif only_vit:
            main_enchantments = [330]

    # First Strike: #66 (Can always attack first in battle)
    # Double Strike: #67 (20% chance to attack twice)
    # One Strike: #68 (Critical hit chance increases by 20%)
    # Three Paths: #803 (50% chance for critical damage to be tripled)
    # Sixth Sense: #806 (20% chance to dodge an attack)
    # Seven Blessings: #807 (The probability of probability-based abilities is doubled)
    # These can only be in a gear set once
    side_enchantments = [66, 67, 68, 803, 806, 807]
    if only_str:
        side_enchantments = [66, 67, 68, 803, 807]
    if only_vit:
        side_enchantments = [806, 807]

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


######################
# Generate Functions #
######################


def solve_lineup(lineup: list[list[int]], level: list[int], file_name: str, sort_function, do_enchants: bool = False, enchant_str: bool = False, enchant_vit: bool = False, run_lineup: bool = False, ignore_speed: bool = False, print_stuff: bool = False):
    # Enchant Lineup
    enchanted_lineup = lineup
    if do_enchants:
        enchanted_lineup = add_enchantments(lineup, level[0], enchant_str, enchant_vit, print_stuff)

    # Initialize Players
    final_lineup = []
    for keys in enchanted_lineup:
        final_lineup.append(Player())
        final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)

    # Run Lineup
    for lvl in level:
        for i in range(len(final_lineup)):
            final_lineup[i].apply_level(lvl)
        # Initialize the record
        # Win, Lose, Tie, ID
        record = [[0, 0, 0, i] for i in range(len(final_lineup))]

        if run_lineup:
            run_lineup_quick(final_lineup, record, lvl, print_stuff, ignore_speed)
            record.sort(key=sort_function)
            if print_stuff:
                print(f"{lvl:02} - Best: {final_lineup[record[-1][3]].print()}")
                print(f"{lvl:02} - _2nd: {final_lineup[record[-2][3]].print()}")
                print(f"{lvl:02} - _3rd: {final_lineup[record[-3][3]].print()}")
            f = open(f'{file_name} - Level {lvl:02} Results.txt', "w")
            for i in range(max(len(final_lineup) - 1000, 0), len(final_lineup)):
                f.write(f"Rank {rank_sort(record[i]):03}: {record[i][3]:03} - [{record[i][0]:03}, {record[i][2]:02}, {record[i][1]:03}] - {final_lineup[record[i][3]].print()}\n")
        else:
            final_lineup.sort(key=sort_function)
            if print_stuff:
                print(f"{lvl:02} - Best: {final_lineup[-1].print()}")
                print(f"{lvl:02} - _2nd: {final_lineup[-2].print()}")
                print(f"{lvl:02} - _3rd: {final_lineup[-3].print()}")
            f = open(f'{file_name} - Level {lvl:02} Results.txt', "w")
            for i in range(max(len(final_lineup) - 1000, 0), len(final_lineup)):
                f.write(f"Rank {len(final_lineup) - i:03}: {final_lineup[i].print()}\n")
        f.close()


def solve_dungeon(lineup: list[int], file_name: str, dungeon_id: int, dungeon: list[Monster] = None, end_floor: int = 0, do_enchants: bool = False, enchant_str: bool = False, enchant_vit: bool = False, print_stuff: bool = False):
    # Enchant Lineup
    enchanted_lineup = lineup
    if do_enchants:
        enchanted_lineup = add_enchantments(lineup, -1, enchant_str, enchant_vit, print_stuff)

    # Initialize Players
    final_lineup = []
    for keys in enchanted_lineup:
        final_lineup.append(Player())
        final_lineup[-1].add_items(keys[0:4], keys[4:8], keys[8:12], [CORROSION_MAX] * 3, [ANALYSIS_MAX] * 3, [UPGRADE_MAX] * 3)
        final_lineup[-1].apply_level(1)

    if dungeon is None:
        dungeon = []
        create_dungeon(dungeon, dungeon_id, end_floor)

    # Initialize the record
    # Wins, HP, ID
    record = [[0, 0, i] for i in range(len(final_lineup))]

    # Run Dungeon
    run_dungeon_quick(final_lineup, dungeon, record, print_stuff)
    record.sort(key=dungeon_sort)

    # Save Results
    f = open(f'{file_name} Results.txt', "w")
    if print_stuff:
        print(f"{dungeon_id:02} - Best: {final_lineup[record[-1][2]].print()}")
        print(f"{dungeon_id:02} - _2nd: {final_lineup[record[-2][2]].print()}")
        print(f"{dungeon_id:02} - _3rd: {final_lineup[record[-3][2]].print()}")
    for i in range(max(len(final_lineup) - 1000, 0), len(final_lineup)):
        f.write(f"Rank {dungeon_sort(record[i]):03}: {record[i][2]:03} - {final_lineup[record[i][2]].print()}\n")
    f.close()


def find_best_str(print_stuff: bool = False):
    lineup = []
    create_all_items_keys(lineup, print_stuff)

    # Do plain Items
    levels = [max(1, i * 5) for i in range(11)]
    file = "Best Str Item"
    solve_lineup(lineup, levels, file, str_sort, print_stuff=print_stuff)

    # Do Enchantments
    file = "Best Str Item with Enchantment"

    # Do First half enchants
    levels = [max(1, i * 5) for i in range(6)]
    solve_lineup(lineup, levels, file, str_sort, do_enchants=True, enchant_str=True, print_stuff=print_stuff)

    # Do Second half enchants
    levels = [max(1, i * 5) for i in range(6, 11)]
    solve_lineup(lineup, levels, file, str_sort, do_enchants=True, enchant_str=True, print_stuff=print_stuff)


def find_best_vit(print_stuff: bool = False):
    lineup = []
    create_all_items_keys(lineup, print_stuff)

    # Do plain Items
    levels = [max(1, i * 5) for i in range(11)]
    file = "Best Vit Item"
    solve_lineup(lineup, levels, file, vit_sort, print_stuff=print_stuff)

    # Do Enchantments
    file = "Best Vit Item with Enchantment"

    # Do First half enchants
    levels = [max(1, i * 5) for i in range(6)]
    solve_lineup(lineup, levels, file, vit_sort, do_enchants=True, enchant_vit=True, print_stuff=print_stuff)

    # Do Second half enchants
    levels = [max(1, i * 5) for i in range(6, 11)]
    solve_lineup(lineup, levels, file, vit_sort, do_enchants=True, enchant_vit=True, print_stuff=print_stuff)


def find_best_items(print_stuff: bool = False):
    lineup = []
    create_all_items_keys(lineup, print_stuff)
    levels = [max(1, i * 5) for i in range(11)]
    file = "Best Item Combinations"
    solve_lineup(lineup, levels, file, rank_sort, run_lineup=True, ignore_speed=True, print_stuff=print_stuff)


def find_best_enchantments(lineup: dict[str, list[list[int]]], print_stuff: bool = False):
    file = "Best Item Enchantments"

    for level in [max(1, i * 5) for i in range(11)]:
        solve_lineup(lineup[f'{level}'], [level], file, rank_sort, do_enchants=True, run_lineup=True, ignore_speed=True, print_stuff=print_stuff)
