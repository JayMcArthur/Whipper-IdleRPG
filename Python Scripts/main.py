from lineup import solve_lineup, solve_dungeon, find_best_str, find_best_vit, find_best_items, find_best_enchantments, rank_sort, get_max_damage
from json_to_python import make_lists, print_enchantments, print_materials
from enitity import Monster, Fountain

############################
# Enchantments & Abilities #
############################
# Produced by print_enchantments()
# 10200 - Endurance 200: Increases the HP base value by 300000.
# 20200 - Strength 200: Increases the STR base value by 300000.
# 30200 - Sturdy 200: Increases the VIT base value by 300000.
# 40200 - Agility 200: Increases the SPD base value by 50000.
# __898 - Lucky 8: Increases the LUK base value by 8.
# 60200 - Strength Training 200: Increases the STR growth value by 15000.
# 70200 - Defense Training 200: Increases the VIT growth value by 15000.
# 50200 - Endurance Training 200: Increases the HP growth value by 15000.
# ___66 - First Strike: Can always attack first in battle.
# ___67 - Double Strike: Chance of consecutive attacks increases by 20%
# ___68 - One Strike: Critical hit chance increases by 20%
# __803 - Three Paths: 50% chance for critical damage to be tripled
# __804 - Four Leaves: 20% chance for enemy drops to double
# __805 - Five Lights: 20% chance to double experience points
# __806 - Sixth Sense: 20% chance to dodge an attack
# __807 - Seven Blessings: The probability of probability-based abilities is doubled
# __901 - Mastery of Slashing: Equip a slashing weapon
# __911 - Mastery of Bludgeoning: Equip a bludgeoning weapon
# __921 - Mastery of Piercing: Equip a piercing weapon
# __931 - Mastery of Projectiles: Equip a projectile weapon
# __941 - Poison: Inflict poison with each attack
# __942 - Deadly Poison: Inflicts deadly poison with each attack
# __951 - Solitude: Increase all abilities when not equipping a set
# __961 - Unyielding: Stay at 1 HP once during an adventure and deliver a critical hit on the next attack
# __965 - Treasure Hunter: Easier to find treasure chests
# __966 - Water Source Detection: Easier to find springs
# __972 - Attack Power Boost 2: Weapon attack power increased by 30%
# __982 - Defense Power Boost 2: Shield defense power increased by 30%
# _1001 - Upgrade Boost: Upgrade increase by 2 times
# _1110 - Upgrade Limit Increase 9: Upgrade limit increased by 10000
# _1201 - Corrosion Level Boost: 侵蝕度上昇量ブースト
# _2105 - HP Boost 5: HP increased by 50%
# _2210 - STR Boost 10: STR increased by 100%
# _2305 - VIT Boost 5: VIT increased by 50%
# _2405 - SPD Boost 5: SPD increased by 50%
# _2505 - LUK Boost 5: LUK increased by 50%
# _2606 - All Stats Boost 3: All stats increased by 50%
# _3003 - Ability Level Boost 3: This item is more likely to gain high-level abilities
# _3101 - Set Boost: Increases the effect of set equipment

#################
# Dungeon Notes #
#################
# TODO - Make this an output of a function
# ID - Name ----------------- AVG Level
# 01 - The First Grassy Knoll ------ 02
# 02 - The Lost Forest ------------- 07
# 03 - Deep Cave ------------------- 14
# 04 - Twilight House -------------- 14
# 05 - The Secret Passage ---------- 21
# 06 - Old Battlefield of Fog ------ 04
# 07 - Giant Tower of Justice ------ 42
# 08 - The Door to Another World --- 01
# 09 - Dimensional Rift ------------ 29
# 10 - The Magic Castle of the End - 44
# 12 - The Illusory Royal Tomb ----- 50
# -- - 121: No Boss
# -- - 122: Anubis (133), 100F
# -- - 123: Necronomicon (134), 300F
# 13 - Fallen Junkyard ------------- 01
# -- - For part you are lvl 50
# -- - Only slashing damage works
# 16 - Random Dungeons ------------- 50
# -- - --------------------------------
# 75 - Random Dungeons ------------- 50


# TODO - Whipper v2.5
#  Balance adjustment.
#  > Fountains now give more stats (Maybe percent)

# TODO - Whipper v3.7
#  SPD now affects evasion rate and consecutive attack probability.

# TODO - Whipper v3.8
#  Added permanent boost item (released as progress is made)
#  > Does Permanent boost Poison Damage add or mult?

# TODO - Whipper v4.4
#  Added event items to the last dungeon.
#  > added combat core that can go to level 50

# TODO - Me
#  Huge refactor on how enchantments and effects are applied to the player
#  > I still need to rework the fights so they can use the premade stats

# TODO - Whipper v4.5
#  Epic Monsters Added
#  Thousand Hand Core added as Drop to Thousand Hands
#  Thousand Hands Spawn Changes
#  Rainbow Slime Drop Changes
#  Max Corrosion Level Change (Drop 1500, Enhancement 2500)

# TODO - Whipper v4.6
#  New Junkyard bosses

# TODO - Whipper v4.7
#  New Dungeon > Tomb
#  Item changes

# TODO - Whipper v4.6, 4.7, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.6
#  A lot.. I am so behind

def run_custom_setups():
    setups = [
        [184, 66, 630, 630, 246, 630, 630, 630, 314, 630, 68, 803],
        [172, 66, 630, 630, 252, 630, 630, 630, 314, 630, 68, 803],
        [172, 66, 630, 630, 252, 630, 630, 630, 314, 630, 68, 630],
        [188, 630, 630, 630, 226, 630, 630, 630, 315, 67, 68, 807]
    ]
    levels = [max(1, i * 5) for i in range(11)]
    levels = [50]
    file = "Custom"
    do_enchants = False
    enchant_str = False
    enchant_vit = False
    ignore_speed = False
    print_stuff = True

    get_max_damage(setups, levels, file, do_enchants=do_enchants, enchant_str=enchant_str, enchant_vit=enchant_vit, print_stuff=print_stuff)
    # solve_lineup(setups, levels, file, rank_sort, do_enchants=do_enchants, enchant_str=enchant_str, enchant_vit=enchant_vit, ignore_speed=ignore_speed, print_stuff=print_stuff)


def run_custom_dungeon():
    # I know this can get to the last Monster
    # So I need to edit my script to reflect this
    setups = [
        [184, 66, 630, 630, 246, 630, 630, 630, 314, 630, 630, 630],
        [172, 66, 630, 630, 252, 630, 630, 630, 314, 630, 630, 630]
    ]
    dungeon_id = 12
    end_floor = 2750 - 50

    fairy = 17
    knight = 26
    wizard = 27
    paladin = 28
    buddha = 31
    dragon = 44
    point = 59
    mist = 64
    armor = 127
    mummy = 132
    necronomicon = 134

    dungeon_temp = [
        [knight, fairy, knight, knight, knight, fairy, knight, knight],
        [knight, fairy, knight, fairy, knight],
        [knight, fairy, knight, fairy, knight],
        [fairy, fairy, knight, fairy, knight],
        [fairy, fairy, knight],
        [knight, knight, knight, fairy, knight],
        [knight, fairy, knight, fairy, knight],
        [fairy, knight, knight, knight, fairy, knight, fairy],
        [knight, knight, knight, fairy, fairy, knight, fairy],
        [knight, fairy, fairy, knight, fairy, fairy, knight],
        # 61
        [paladin, paladin, paladin, fairy, wizard],
        [paladin, fairy, knight, wizard, paladin, paladin],
        [wizard, fairy, paladin, paladin, paladin],
        [knight, wizard, knight, knight, wizard, knight],
        [fairy, wizard, fairy, knight, paladin, fairy],
        [fairy, knight, fairy, knight, wizard, knight],
        [paladin, wizard, wizard, knight, fairy, wizard],
        [paladin, wizard, fairy, fairy, knight, paladin],
        [wizard, fairy, knight, wizard, knight, wizard, fairy],
        [fairy, paladin, wizard],
        # 71
        [dragon, paladin, buddha, buddha, buddha, buddha, dragon],
        [paladin, paladin, dragon, dragon, dragon],
        [buddha, dragon, paladin, dragon, paladin],
        [buddha, buddha, paladin, buddha, paladin, dragon],
        [dragon, dragon, paladin, paladin, buddha, paladin],
        [paladin, dragon, dragon, buddha, buddha, buddha],
        [dragon, dragon, buddha, dragon, buddha],
        [paladin, buddha, dragon, buddha, paladin, dragon],
        [dragon, buddha, buddha, dragon, paladin],
        [dragon, dragon, buddha, paladin, dragon, dragon],
        # 81
        [point, point, dragon, buddha, mummy, point],
        [point, mummy, point, buddha, point, mummy, point],
        [point, point, point, point, buddha, point],
        [buddha, mummy, point, mummy, buddha, mummy],
        [mummy, dragon, dragon, dragon, dragon, mummy],
        [mummy, dragon, dragon, point, dragon, point, dragon],
        [buddha, point, point, buddha, point],
        [point, point, buddha, mummy, dragon, point],
        [dragon, dragon, point, point, point],
        [point, point, buddha, buddha, point, point],
        # 91
        [point, armor, armor, point, mist],
        [mist, mummy, point, point],
        [point, armor, mummy, mummy],
        [mummy, mummy, mummy, point, armor, mist, mummy],
        [armor, armor, point, point, mummy],
        [armor, mist, point, armor, mummy, mummy],
        [mist, mummy, mist, armor, armor],
        [mummy, armor, armor, mummy, mummy, mummy],
        [point, mist, armor, point, mummy],
        [point, point, mummy, armor, point, necronomicon]
    ]

    dungeon = []
    for floor_id, floor in enumerate(dungeon_temp):
        for encounter in floor:
            dungeon.append(Monster(encounter, dungeon_id, end_floor + floor_id, is_royal_tomb=True))
        dungeon.append(Fountain(is_level_up=True))

    file = "Custom Dungeon"
    do_enchants = False
    enchant_str = False
    enchant_vit = False
    print_stuff = True
    end_floor += 50

    solve_dungeon(file, dungeon_id, lineup=setups, end_floor=end_floor, do_enchants=do_enchants, enchant_str=enchant_str, enchant_vit=enchant_vit, print_stuff=print_stuff)


def main(custom_equip: bool, custom_dungeon: bool, dungeon: bool, combination: bool, strength: bool, vitality: bool, enchantment: bool) -> None:
    # m = Monster(134, 12, 2700, is_royal_tomb=True)
    # print(m.print())
    # m = Monster(17, 12, 2660, is_royal_tomb=True)
    # print(m.print())

    # m = Monster(30, 11, 1, dungeon_name="The Ancient Citadel of Wisdom", miasma_level=50)
    # ID: 30, Name: <Alpha>Mist Dragon, Effects: [], Dungeon ID: 11, Floor: 1, Level: 50, HP: 1332375, Attack: 272422, Minimum Damage: 8334, Defense: 271138, SPD: 16435
    # ID: 30, Name: <Bloody>Mist Dragon, Effects: [], Dungeon ID: 11, Floor: 1, Level: 50, HP: 1901025, Attack: 277514, Minimum Damage: 8334, Defense: 276206, SPD: 17069
    # print(m.print())
    m = Monster(26, 11, 1, dungeon_name="The Ancient Citadel of Wisdom", miasma_level=5)
    # ID: 26, Name: <Alpha>Ghost Knight, Effects: [], Dungeon ID: 11, Floor: 1, Level: 50, HP: 1327150, Attack: 271352, Minimum Damage: 8303, Defense: 270710, SPD: 16392
    # ID: 26, Name: <Bloody>Ghost Knight, Effects: [], Dungeon ID: 11, Floor: 1, Level: 50, HP: 1893570, Attack: 276424, Minimum Damage: 8303, Defense: 275770, SPD: 17025
    print(m.print())
    # HP
    # Base Param + 135
    # more_percent + 5 & Base + 3
    # ATK & Defense
    # Base Param - 500
    # SPD
    # IDK

    # m = Monster(34, 11, 1, dungeon_name="The Ancient Citadel of Wisdom", miasma_level=50)
    # ID: 34, Name: <Bloody>Security, Effects: [], Dungeon ID: 11, Floor: 1, Level: 50, HP: 1909971, Attack: 277732, Minimum Damage: 8303, Defense: 277143, SPD: 17222
    # ID: 34, Name: <Alpha>Security, Effects: [], Dungeon ID: 11, Floor: 1, Level: 50, HP: 1338645, Attack: 272636, Minimum Damage: 8303, Defense: 272058, SPD: 16585
    # print(m.print())

    if custom_equip:
        run_custom_setups()
    if custom_dungeon:
        run_custom_dungeon()

    if dungeon:
        dungeon_id = 12
        end_floor = 7600
        file = f"Dungeon {dungeon_id}"
        do_enchants = True
        enchant_str = False
        enchant_vit = False
        print_stuff = True

        solve_dungeon(file, dungeon_id, end_floor=end_floor, do_enchants=do_enchants, enchant_str=enchant_str, enchant_vit=enchant_vit, print_stuff=print_stuff)

    if strength:
        find_best_str(True)
    if vitality:
        find_best_vit(True)
    if combination:
        find_best_items(True)
    if enchantment:
        find_best_enchantments(best_equips_normal, True)

    print("Done")


if __name__ == '__main__':
    make_lists()
    print_enchantments()
    print_materials()
    # main(True, True, False, False, False, False, False)
