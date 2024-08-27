from multiprocessing import Pool, shared_memory
from math import floor
import numpy as np

from enitity import Player, Monster
from fight import fight_quick


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
        record[id_a][4] = (record[id_a][0] * 3) + record[id_a][2]


def run_dungeon_quick(lineup: list[Player], dungeon: list[Monster], record: list,):
    # This expects player lineup vs a monster lineup
    # Players keep xp and levelup
    # TODO - This is not made yet
    fights = 0
    total_fights = floor((len(lineup) * (len(lineup) + 1)) / 2)
    fight_all = False
    percent = 0

    for id_a, per in enumerate(lineup):
        for id_b, mon in enumerate(dungeon):

            # First Strike (66)
            if 66 in per.effects or per.spd > per.spd:
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
            else:
                record[id_a][1] += 1
                break

            fights += 1
            if print_stuff and floor(fights / total_fights * 100) >= percent + 5:
                percent = floor(fights / total_fights * 100)
                print(f'Level {lvl} - {floor(fights / total_fights * 100):2}% - {fights} / {total_fights}')
        record[id_a][4] = (record[id_a][0] * 3) + record[id_a][2]
    record.sort(key=rank_sort)

#################################
# All Multiprocessing functions #
#################################
# These do not work yet


def worker(arg):
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
        results = fight_multiprocessing(a_hp, a_attack, a_def, a_unyielding, b_hp, b_attack, b_def, b_unyielding)
    elif not ignore_spd and not a_fs and (b_fs or b_spd > a_spd):
        results = fight_multiprocessing(b_hp, b_attack, b_def, b_unyielding, a_hp, a_attack, a_def, a_unyielding)[::-1]
    else:
        results = [a + b for a, b in zip(fight_multiprocessing(a_hp, a_attack, a_def, a_unyielding, b_hp, b_attack, b_def, b_unyielding), fight_multiprocessing(b_hp, b_attack, b_def, b_unyielding, a_hp, a_attack, a_def, a_unyielding)[::-1])]
    return [idx_a, idx_b, results]


def process_fight_results(arg):
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


def run_lineup_multiprocessing(lineup: list[Player], ignore_spd: bool) -> list[list[int]]:
    global record_g

    # Initialize the record: [Wins, Losses, Ties, ID, Rank]
    record_g = [[0, 0, 0, i, 0] for i in range(len(lineup))]

    # Calculate the size of the shared memory needed
    shm = shared_memory.SharedMemory(create=True, size=len(lineup) * 6 * np.dtype(np.int32).itemsize)
    stats_array = np.ndarray((len(lineup), 6), dtype=np.int32, buffer=shm.buf)

    # Create the NumPy array to hold player stats
    for i, player in enumerate(lineup):
        mods = generate_attack_defense_mod(player)
        stats_array[i] = [player.hp, floor(player.attack * mods[0]), floor(player.defense * mods[1]), int(961 in player.effects), player.spd, int(66 in player.effects)]

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
    record_g.sort(key=rank_sort)  # Sort based on rank
    return record_g


