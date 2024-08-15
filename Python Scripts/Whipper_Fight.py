from math import floor, ceil
from itertools import combinations_with_replacement, combinations, product
import random
import json

monster_list = {}
equip_list = {}
custom_list = {}
dungeon_list = {}
level_list = {}

UPGRADE_MAX = 20000
ANALYSIS_MAX = 15
MIASMA_MAX = 999
MIASMA_APPLES = 99

# This was made using the results from generate_all_items_levels_stats
# We take the best of every result and store them here for enchant use
# Enchants where processed and stored as notes
best_equips_normal = {
    "1": [171, 244, 303],
    "5": [171, 244, 303],
    "10": [171, 244, 303],
    "15": [182, 244, 323],
    "20": [182, 244, 323],
    "25": [182, 244, 323],
    "30": [182, 244, 323],
    "35": [182, 244, 323],
    "40": [182, 244, 323],
    "45": [182, 244, 323],
    "50": [175, 246, 323]
}
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


def make_lists():
    # Make Monster List
    with open('../json/monsters_EN.json', encoding='utf8') as f:
        data = json.load(f)
        for monster in data['monsters']:
            monster['encounter_level'] = {
                'min': [],
                'max': [],
                'avg': [],
            }
            monster_list[monster["id"]] = monster

    # Make Equip List
    with open('../json/equips_EN.json', encoding='utf8') as f:
        data = json.load(f)

        for item in data['equips']:
            hp = []
            str = []
            vit = []
            for lvl in range(51):
                hp.append(item["hp"] + lvl * item["lvHp"])
                str.append(item["atk"] + lvl * item["lvAtk"])
                vit.append(item["def"] + lvl * item["lvDef"])
            item["results"] = {
                "hp": hp,
                "str": str,
                "vit": vit,
            }

            equip_list[item["id"]] = item

    # Make Custom List
    with open('../json/customs_EN.json', encoding='utf8') as f:
        data = json.load(f)
        for custom in data['customs']:
            custom_list[custom["id"]] = custom

    # Make Dungeon List
    with open('../json/dungeons_EN.json', encoding='utf8') as f:
        data = json.load(f)
        data['dungeons'][10]["maxFloor"] = 50  # Reduce max floor to make it work
        temp = {}
        for i in range(1, 51):
            temp[f'{i}'] = data['dungeons'][10]["monsters"][f'{ceil(i/10)}']
        data['dungeons'][10]["monsters"] = temp
        data['dungeons'][10]["id"] = 121  # Change ID to 12.1, 12.2, 12.3
        data['dungeons'].append(data['dungeons'][10])
        data['dungeons'][-1]["id"] = 122
        data['dungeons'].append(data['dungeons'][10])
        data['dungeons'][-1]["id"] = 123

        for dungeon in data['dungeons']:
            if dungeon["id"] == 13:
                continue  # Skip new dungeon that isn't finished
            dungeon["boss"] = True if dungeon["id"] in [7, 9, 10, 121, 122, 123] else False
            if dungeon["id"] == 7:
                boss_id = 108
            elif dungeon["id"] == 9:
                boss_id = 109
            elif dungeon["id"] == 10:
                boss_id = 129
            elif dungeon["id"] == 121:
                boss_id = 132
            elif dungeon["id"] == 122:
                boss_id = 133
            elif dungeon["id"] == 123:
                boss_id = 134
            else:
                boss_id = 0
            if dungeon["boss"]:
                dungeon['monsters'][f'{dungeon["maxFloor"] + 1}'] = [boss_id]
            dungeon_list[dungeon["id"]] = dungeon

        # Create Random Dungeons
        for d_id in range(60):
            dungeon = {'condition': 0, 'modLv': 8, 'id': 16 + d_id}
            front = d_id // 20  # Makes 4 different fronts
            behind = (d_id % 20) // 5  # Makes 3 different behinds
            dungeon['maxFloor'] = 14 + 10  # Only using max floor config but 0 - 14 are valid
            dungeon['minutesPerFloor'] = 15 + 5  # Only using max time config but 0 - 15 are valid
            monster_pos = ((d_id % 20) % 5) + 1  # Makes 5 different starting pos
            behind_words = ['The Canyon', 'The Fortress', 'The Mausoleum', 'The Ancient Citadel']
            dungeon['nameId_EN'] = behind_words[behind]
            monster_pos += 10 + 5 * behind

            front_words = ['of Courage', 'of Judgment', 'of Wisdom']
            dungeon['nameId_EN'] += ' ' + front_words[front]
            skips = front + 2

            dungeon['monsters'] = {}
            for floor_num in range(1, dungeon['maxFloor'] + 1):
                dungeon['monsters'][f'{floor_num}'] = [
                    monster_pos,
                    monster_pos + skips,
                    monster_pos + skips + skips
                ]
                if floor_num % 4 == 0:
                    monster_pos += skips + skips + skips

            # Really a 10% chance if Max Floor > 20
            # And a 50% chance if Max Floor == 24
            if dungeon['nameId_EN'] == 'The Ancient Citadel of Wisdom' and dungeon['maxFloor'] > 20:
                dungeon["boss"] = True
                dungeon['monsters'][f'{dungeon["maxFloor"] + 1}'] = [boss_id]
            else:
                dungeon["boss"] = False

            dungeon_list[dungeon["id"]] = dungeon

    # Make Level List
    for d_id, dungeon in dungeon_list.items():
        level_list[d_id] = {}
        for floor_num in range(1, dungeon['maxFloor'] + (2 if dungeon['boss'] else 1)):
            level_list[d_id][f'{floor_num}'] = {
                'drop': {},
                'floor': {},
                'total': {},
                'level': {}
            }
            exp_amounts = []
            # Determine Drop EXP
            for monster in dungeon['monsters'][f'{floor_num}']:
                exp_amounts.append(monster_list[monster]['exp'])
            level_list[d_id][f'{floor_num}']['drop'] = {
                'min': min(exp_amounts),
                'max': max(exp_amounts),
                'avg': sum(exp_amounts) // len(exp_amounts)
            }

            # Determine Floor EXP
            if dungeon['boss'] and floor_num == dungeon['maxFloor'] + 1:
                level_list[d_id][f'{floor_num}']['floor'] = {
                    'min': min(exp_amounts),
                    'max': max(exp_amounts),
                    'avg': sum(exp_amounts) // len(exp_amounts)
                }
            else:
                # Floor type determines the amount of monsters you fight
                # 1/60 Demon Nest:     80% Monster, 01% Treasure, 05% Fountain, 14% Nothing
                # 1/60 Treasure Floor: 10% Monster, 50% Treasure, 10% Fountain, 30% Nothing
                # 1/60 Oasis Floor:    10% Monster, 10% Treasure, 50% Fountain, 30% Nothing
                # 57/60 Normal Floor   55% Monster, 02% Treasure, 03% Fountain, 40% Nothing
                #
                # Total: 53.916 Monster, 2.916 Treasure, 3.93 Fountain, 39.23 Nothing
                level_list[d_id][f'{floor_num}']['floor'] = {
                    'min': min(exp_amounts) * dungeon['minutesPerFloor'] * 0.10,
                    'max': max(exp_amounts) * dungeon['minutesPerFloor'] * 0.80,
                    'avg': sum(exp_amounts) // len(exp_amounts) * dungeon['minutesPerFloor'] * 0.5391666
                }
            # Get Total EXP when done and Level when entering
            if floor_num == 1:
                level_list[d_id][f'{floor_num}']['total'] = {
                    'min': level_list[d_id][f'{floor_num}']['floor']['min'],
                    'max': level_list[d_id][f'{floor_num}']['floor']['max'],
                    'avg': level_list[d_id][f'{floor_num}']['floor']['avg']
                }
                level_list[d_id][f'{floor_num}']['level'] = {
                    'min': 1,
                    'max': 1,
                    'avg': 1
                }
            else:
                level_list[d_id][f'{floor_num}']['total'] = {
                    'min': level_list[d_id][f'{floor_num - 1}']['total']['avg'] + level_list[d_id][f'{floor_num}']['floor']['min'],
                    'max': level_list[d_id][f'{floor_num - 1}']['total']['avg'] + level_list[d_id][f'{floor_num}']['floor']['max'],
                    'avg': level_list[d_id][f'{floor_num - 1}']['total']['avg'] + level_list[d_id][f'{floor_num}']['floor']['avg']
                }
                level_list[d_id][f'{floor_num}']['level'] = {
                    'min': exp_to_level(level_list[d_id][f'{floor_num - 1}']['total']['min']),
                    'max': exp_to_level(level_list[d_id][f'{floor_num - 1}']['total']['max']),
                    'avg': exp_to_level(level_list[d_id][f'{floor_num - 1}']['total']['avg'])
                }

    # Add in monster encounter
    for d_id, dungeon in dungeon_list.items():
        for floor_num in range(1, dungeon['maxFloor'] + (2 if dungeon['boss'] else 1)):
            for monster in dungeon['monsters'][f'{floor_num}']:
                monster_list[monster]['encounter_level']['min'].append(level_list[d_id][f'{floor_num}']['level']['min'])
                monster_list[monster]['encounter_level']['max'].append(level_list[d_id][f'{floor_num}']['level']['max'])
                monster_list[monster]['encounter_level']['avg'].append(level_list[d_id][f'{floor_num}']['level']['avg'])


def exp_to_level(exp: int) -> int:
    required = 10
    level = 1
    while True:
        exp -= required
        if exp <= 0:
            return level
        required += 10
        level += 1


WIN = 0
LOSE = 1
TIE = 2


class Stats:
    def __init__(self):
        self.hp = 1
        self.str = 1
        self.vit = 1
        self.spd = 1
        self.luk = 1

    def string_to_stat(self, stat: str, amount: int | float):
        if stat == "HP":
            self.hp += amount
        elif stat == "VIT":
            self.vit += amount
        elif stat == "SPD":
            self.spd += amount
        elif stat == "STR":
            self.str += amount
        elif stat == "LUK":
            self.luk += amount
        else:
            print(f"Invalid Stat: {stat}")

    def all_stats(self, amount: int | float):
        self.hp += amount
        self.str += amount
        self.vit += amount
        self.spd += amount
        self.luk += amount


class Item:
    def __init__(self, identifier):
        self.id = identifier
        self.boost = 1
        self.upgrade = 0
        self.upgrade_max = equip_list[identifier]["maxLv"]
        self.upgrade_boost = 1
        self.miasma = 0
        self.miasma_boost = 1
        self.custom1 = 0
        self.custom2 = 0
        self.custom3 = 0
        # Used for real stats
        self.stats = Stats()
        self.mult = Stats()
        self.effects = []


class Player(Stats):
    def __init__(self, weapon: Item, armor: Item, ring: Item):
        super().__init__()
        self.weapon = weapon
        self.armor = armor
        self.ring = ring
        self.effects = []
        self.attack = 0
        self.defense = 0

    def print_stuff(self):
        mods = generate_attack_defense_mod(self)
        return (f'HP: {self.hp}, STR: {self.str}, VIT: {self.vit}, SPD: {self.spd}, LUK: {self.luk}, '
                f'Attack: {self.attack}, Defense: {self.defense}, '
                f'A Scaled: {floor(self.attack * mods[0])}, D Scaled: {floor(self.defense * mods[1])}, '
                f'[{equip_list[self.weapon.id]["nameId_EN"]}({self.weapon.id}) [{self.weapon.custom1}, {self.weapon.custom2}, {self.weapon.custom3}], '
                f'{equip_list[self.armor.id]["nameId_EN"]}({self.armor.id}) [{self.armor.custom1}, {self.armor.custom2}, {self.armor.custom3}], '
                f'{equip_list[self.ring.id]["nameId_EN"]}({self.ring.id}) [{self.ring.custom1}, {self.ring.custom2}, {self.ring.custom3}]]')


def find_set(equip_ids: list):
    weapon, armor, ring = equip_ids
    names = [equip_list[armor]["nameId_EN"], equip_list[ring]["nameId_EN"]]
    return equip_list[weapon]["set_EN"] in names


def apply_upgrade(item: Item, upgrade: int) -> Item:
    item.upgrade = min(upgrade, item.upgrade_max)
    return item


def apply_level(item: Item, level: int) -> Item:
    item.stats.hp = equip_list[item.id]["results"]["hp"][level - 1]
    item.stats.str = equip_list[item.id]["results"]["str"][level - 1]
    item.stats.vit = equip_list[item.id]["results"]["vit"][level - 1]
    item.stats.spd = 0
    item.stats.luk = 0
    return item


def apply_analysis(item: Item, analysis: int, equip_ids: list) -> Item:
    if equip_list[item.id]['itemType'] == 1:
        if analysis >= 5:
            item.upgrade_max += 100
        if analysis >= 6 and item.miasma >= 50:
            item.boost = 1.3
        if analysis >= 7 and item.miasma >= 100:
            item.upgrade_max += 1000
        if analysis >= 8 and item.miasma >= 150:
            item.upgrade_boost *= 2
        if analysis >= 9 and item.miasma >= 200 and find_set(equip_ids):
            item.mult.str += 0.5
        if analysis >= 10 and item.miasma >= 250:
            item.miasma_boost *= 2
        if analysis >= 11 and item.miasma >= 300:
            item.upgrade_max += 2000
        if analysis >= 12 and item.miasma >= 350:
            item.upgrade_boost *= 2
        if analysis >= 13 and item.miasma >= 400 and find_set(equip_ids):
            item.mult.str += 0.5
        if analysis >= 14 and item.miasma >= 450:
            item.upgrade_max += 3000
        if analysis >= 15 and item.miasma >= 500:
            item.miasma_boost *= 2

    elif equip_list[item.id]['itemType'] == 2:
        if analysis >= 5:
            item.upgrade_max += 100
        if analysis >= 6 and item.miasma >= 50:
            item.mult.string_to_stat(equip_list[item.id]["specialized"], 0.1)
        if analysis >= 7 and item.miasma >= 100:
            item.upgrade_max += 1000
        if analysis >= 8 and item.miasma >= 150:
            item.upgrade_boost *= 2
        if analysis >= 9 and item.miasma >= 200:
            item.boost = 1.3
        if analysis >= 10 and item.miasma >= 250:
            item.miasma_boost *= 2
        if analysis >= 11 and item.miasma >= 300:
            item.upgrade_max += 2000
        if analysis >= 12 and item.miasma >= 350:
            item.upgrade_boost *= 2
        if analysis >= 13 and item.miasma >= 400:
            item.mult.hp += 0.3
        if analysis >= 14 and item.miasma >= 450:
            item.upgrade_max += 3000
        if analysis >= 15 and item.miasma >= 500:
            item.miasma_boost *= 2

    elif equip_list[item.id]['itemType'] == 3:
        if analysis >= 5:
            item.mult.string_to_stat(equip_list[item.id]["specialized"], 0.1)
        if analysis >= 6 and item.miasma >= 50:
            item.mult.all_stats(0.1)
        if analysis >= 7 and item.miasma >= 100:
            # First Strike
            if equip_list[item.id]["ability"] == 66:
                item.effects.append(66)
            # Double Strike
            elif equip_list[item.id]["ability"] == 67:
                item.effects.append(67)
            # One Strike
            elif equip_list[item.id]["ability"] == 68:
                item.effects.append(68)
            # Slashing Mastery
            elif equip_list[item.id]["ability"] == 901:
                if equip_list[equip_ids[0]]["attackKind"] == "Slashing":
                    item.mult.str += 0.3
            # Bludgeoning Mastery
            elif equip_list[item.id]["ability"] == 911:
                if equip_list[equip_ids[0]]["attackKind"] == "Bludgeoning":
                    item.mult.str += 0.3
            # Piercing Mastery
            elif equip_list[item.id]["ability"] == 921:
                if equip_list[equip_ids[0]]["attackKind"] == "Piercing":
                    item.mult.str += 0.3
            # Projectile Mastery
            elif equip_list[item.id]["ability"] == 931:
                if equip_list[equip_ids[0]]["attackKind"] == "Projectile":
                    item.mult.str += 0.3
            # Poison
            elif equip_list[item.id]["ability"] == 941:
                item.effects.append(941)
            # Solitude
            elif equip_list[item.id]["ability"] == 951:
                if not find_set(equip_ids):
                    item.mult.all_stats(0.1)
            # Unyielding
            elif equip_list[item.id]["ability"] == 961:
                item.effects.append(961)
            # HP Boost
            elif equip_list[item.id]["ability"] == 2103:
                item.mult.hp += 0.3
            # SPD Boost
            elif equip_list[item.id]["ability"] == 2403:
                item.mult.spd += 0.3
            else:
                print(f"Invalid ability Effect: {equip_list[item.id]['ability']}")
        if analysis >= 8 and item.miasma >= 150:
            item.mult.string_to_stat(equip_list[item.id]["specialized"], 0.2)
        if analysis >= 9 and item.miasma >= 200:
            item.mult.all_stats(0.2)
        # analysis 10 >= More likely to find better enchants
        if analysis >= 11 and item.miasma >= 300:
            item.mult.string_to_stat(equip_list[item.id]["specialized"], 0.3)
        if analysis >= 12 and item.miasma >= 350:
            item.mult.all_stats(0.3)
        if analysis >= 13 and item.miasma >= 400:
            # Three Paths (Crit Damage)
            if equip_list[item.id]["next"] == 803:
                item.effects.append(803)
            # Four Leaves (Double Drops)
            elif equip_list[item.id]["next"] == 804:
                item.effects.append(804)
            # Five Lights (Double XP)
            elif equip_list[item.id]["next"] == 805:
                item.effects.append(805)
            # Sixth Sense (Dodge Attack)
            elif equip_list[item.id]["next"] == 806:
                item.effects.append(806)
            # Seven Blessings (Probability Increase)
            elif equip_list[item.id]["next"] == 807:
                item.effects.append(807)
            # Slashing Mastery
            elif equip_list[item.id]["next"] == 901:
                if equip_list[equip_ids[0]]["attackKind"] == "Slashing":
                    item.mult.str += 0.3
            # Bludgeoning Mastery
            elif equip_list[item.id]["next"] == 911:
                if equip_list[equip_ids[0]]["attackKind"] == "Bludgeoning":
                    item.mult.str += 0.3
            # Piercing Mastery
            elif equip_list[item.id]["next"] == 921:
                if equip_list[equip_ids[0]]["attackKind"] == "Piercing":
                    item.mult.str += 0.3
            # Projectile Mastery
            elif equip_list[item.id]["next"] == 931:
                if equip_list[equip_ids[0]]["attackKind"] == "Projectile":
                    item.mult.str += 0.3
            # Solitude
            elif equip_list[item.id]["next"] == 951:
                if not find_set(equip_ids):
                    item.mult.all_stats(0.1)
            # HP Boost
            elif equip_list[item.id]["next"] == 2103:
                item.mult.hp += 0.3
            else:
                print(f"Invalid Next Effect: {equip_list[item.id]['next']}")
        if analysis >= 14 and item.miasma >= 450:
            item.mult.string_to_stat(equip_list[item.id]["specialized"], 0.4)
        # analysis 15 >= More likely to find better enchants
    return item


def apply_custom(item: Item, level: int) -> Item:
    checks = [item.custom1, item.custom2, item.custom3]
    for check in checks:
        if check == 0:
            continue
        if custom_list[check]["nameId_EN"] == "Endurance":
            item.stats.hp += custom_list[check]["value"]
        elif custom_list[check]["nameId_EN"] == "Strength":
            item.stats.str += custom_list[check]["value"]
        elif custom_list[check]["nameId_EN"] == "Sturdy":
            item.stats.vit += custom_list[check]["value"]
        elif custom_list[check]["nameId_EN"] == "Agility":
            item.stats.spd += custom_list[check]["value"]
        elif custom_list[check]["nameId_EN"] == "Lucky":
            item.stats.luk += custom_list[check]["value"]
        elif custom_list[check]["nameId_EN"] == "Endurance Training":
            item.stats.hp += custom_list[check]["value"] * (level - 1)
        elif custom_list[check]["nameId_EN"] == "Strength Training":
            item.stats.str += custom_list[check]["value"] * (level - 1)
        elif custom_list[check]["nameId_EN"] == "Defense Training":
            item.stats.vit += custom_list[check]["value"] * (level - 1)
        elif custom_list[check]["nameId_EN"] == "First Strike":
            item.effects.append(66)
        elif custom_list[check]["nameId_EN"] == "Double Strike":
            item.effects.append(67)
        elif custom_list[check]["nameId_EN"] == "One Strike":
            item.effects.append(68)
        elif custom_list[check]["nameId_EN"] == "Three Paths":
            item.effects.append(803)
        elif custom_list[check]["nameId_EN"] == "Sixth Sense":
            item.effects.append(806)
        elif custom_list[check]["nameId_EN"] == "Seven Blessings":
            item.effects.append(807)
        else:
            print(f'Custom Effect {check} not found')
    return item


def update_stats(player: Player, weapon: Item, armor: Item, ring: Item, upgrade: list[int], level: int, analysis: list[int], miasma: list[int]):
    ids = [weapon.id, armor.id, ring.id]
    weapon.miasma = miasma[0]
    armor.miasma = miasma[1]
    ring.miasma = miasma[2]

    # Apply Analysis
    weapon = apply_analysis(weapon, analysis[0], ids)
    armor = apply_analysis(armor, analysis[1], ids)
    ring = apply_analysis(ring, analysis[2], ids)

    # Apply Upgrades
    weapon = apply_upgrade(weapon, upgrade[0])
    armor = apply_upgrade(armor, upgrade[1])
    # Apply Level
    weapon = apply_level(weapon, level)
    armor = apply_level(armor, level)
    ring = apply_level(ring, level)

    # Apply Custom
    weapon = apply_custom(weapon, level)
    armor = apply_custom(armor, level)
    ring = apply_custom(ring, level)
    # Get all effects
    player.effects += weapon.effects + armor.effects + ring.effects
    # Get stats
    player.hp = 20 + 10 * level + weapon.stats.hp + armor.stats.hp + ring.stats.hp
    player.str = 9 + 1 * level + weapon.stats.str + armor.stats.str + ring.stats.str
    player.vit = 9 + 1 * level + weapon.stats.vit + armor.stats.vit + ring.stats.vit
    player.spd = 1 * level + weapon.stats.spd + armor.stats.spd + ring.stats.spd
    player.luk = 1 + weapon.stats.luk + armor.stats.luk + ring.stats.luk + MIASMA_APPLES
    # Do Multiplier
    player.hp *= weapon.mult.hp + armor.mult.hp + ring.mult.hp - 2
    player.str *= weapon.mult.str + armor.mult.str + ring.mult.str - 2
    player.vit *= weapon.mult.vit + armor.mult.vit + ring.mult.vit - 2
    player.spd *= weapon.mult.spd + armor.mult.spd + ring.mult.spd - 2
    player.luk *= weapon.mult.luk + armor.mult.luk + ring.mult.luk - 2
    # Floor values
    player.hp = floor(player.hp)
    player.str = floor(player.str)
    player.vit = floor(player.vit)
    player.spd = floor(player.spd)
    player.luk = floor(player.luk)
    # Add Weapon
    player.attack = player.str + ((weapon.upgrade * weapon.upgrade_boost + weapon.miasma * 10 * weapon.miasma_boost + equip_list[weapon.id]["param"]) * weapon.boost)
    # Add Armor
    player.defense = player.vit + ((armor.upgrade * armor.upgrade_boost + armor.miasma * 10 * armor.miasma_boost + equip_list[armor.id]["param"]) * armor.boost)

    # Floor values
    player.attack = floor(player.attack)
    player.defense = floor(player.defense)

    return player


def create_leveled_player(lvl: int, keys: list) -> Player:
    weapon = Item(keys[0])
    weapon.custom1 = keys[1]
    weapon.custom2 = keys[2]
    weapon.custom3 = keys[3]
    armor = Item(keys[4])
    armor.custom1 = keys[5]
    armor.custom2 = keys[6]
    armor.custom3 = keys[7]
    ring = Item(keys[8])
    ring.custom1 = keys[9]
    ring.custom2 = keys[10]
    ring.custom3 = keys[11]
    return update_stats(Player(weapon, armor, ring), weapon, armor, ring, [UPGRADE_MAX, UPGRADE_MAX], lvl, [ANALYSIS_MAX, ANALYSIS_MAX, ANALYSIS_MAX],
                        [MIASMA_MAX, MIASMA_MAX, MIASMA_MAX])


def create_all_items_lineup(lineup: list, print_stuff: bool) -> list[list[int]]:
    # Every Combination
    for w_key in [x for x in list(equip_list.keys()) if x < 200]:
        for a_key in [y for y in list(equip_list.keys()) if 200 < y < 300]:
            for r_key in [z for z in list(equip_list.keys()) if 300 < z]:
                lineup.append([w_key, 0, 0, 0, a_key, 0, 0, 0, r_key, 0, 0, 0])
    if print_stuff:
        print(f"Number of item combinations: {len(lineup)}")
    return lineup


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
            lineup_updated.append([player[0]] + list(enchant[0:3]) + player[4] + list(enchant[3:6]) + player[8] + list(enchant[6:9]))
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


def generate_all_items_levels_lineup() -> None:
    for lvl in range(11):
        lineup = create_all_items_lineup([], False)
        final_lineup = []
        for keys in lineup:
            final_lineup.append(create_leveled_player(max(1, lvl * 5), keys))
        run_lineup(final_lineup, lvl)


def run_lineup(lineup: list[Player], lvl: int, print_stuff: bool):
    record = []
    fights = 0
    total_fights = floor((len(lineup) * (len(lineup) + 1)) / 2)
    percent = 0
    for i in range(len(lineup)):
        # Win, Lose, Tie, ID, Rank
        record.append([0, 0, 0, i, 0])

    for id_a, per_a in enumerate(lineup):
        for id_b, per_b in enumerate(lineup[id_a + 1::]):
            id_b += id_a + 1

            # 66 - First Strike
            if 66 not in per_b.effects and (66 in per_a.effects or per_a.spd > per_a.spd):
                results = fight(per_a, per_b)
            elif 66 not in per_a.effects and (66 in per_b.effects or per_b.spd > per_a.spd):
                results = fight(per_b, per_a)[::-1]
            else:
                results = [a + b for a, b in zip(fight(per_a, per_b), fight(per_b, per_a)[::-1])]

            if results[0] > 0 and results[1] == 0:
                record[id_a][WIN] += 1
                record[id_b][LOSE] += 1
            elif results[0] == 0 and results[1] > 0:
                record[id_a][LOSE] += 1
                record[id_b][WIN] += 1
            else:
                record[id_a][TIE] += 1
                record[id_b][TIE] += 1
            fights += 1
            if print_stuff and floor(fights / total_fights * 100) >= percent + 5:
                percent = floor(fights / total_fights * 100)
                print(f'Level {lvl} - {floor(fights / total_fights * 100):2}% - {fights} / {total_fights}')
        record[id_a][4] = record[id_a][WIN] * 3 + record[id_a][TIE]
    record.sort(key=rank_sort)
    return [record, lineup]


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
    attack = (1 + (crit_damage * crit_chance)) * (1 + (0.2 * double_strike * seven_blessings))
    defense = 1 / (1 - (0.20 * (806 in player.effects) * seven_blessings))  # 1, 1.25, 1.66
    return [attack, defense]


def fight(attacker: Player, defender: Player, miasma: int = 5) -> list[int]:
    # First Strike:    #66  (Can always attack first in battle) -- This happens outside

    # Poison  941 TODO

    # Unyielding 961 (Stay at 1 HP once during an adventure and deliver a critical hit on the next attack)
    a_unyielding = 961 in attacker.effects
    d_unyielding = 961 in defender.effects
    # I don't give the auto crit just keep the chance stuff

    a_mod = generate_attack_defense_mod(attacker)
    d_mod = generate_attack_defense_mod(defender)

    a_hp = attacker.hp
    a_damage = max(0, (attacker.attack * a_mod[0]) - (defender.defense * d_mod[1]))
    d_hp = defender.hp
    d_damage = max(0, (defender.attack * d_mod[0]) - (attacker.defense * a_mod[1]))

    if a_damage == 0 and d_damage == 0:
        return [0, 0]

    while True:
        d_hp -= a_damage + (random.randint(0, 5) * miasma)
        if d_hp < 1:
            if not d_unyielding:
                return [1, 0]
            d_unyielding = False
            d_hp = 1

        a_hp -= d_damage + (random.randint(0, 5) * miasma)
        if a_hp < 1:
            if not a_unyielding:
                return [0, 1]
            a_unyielding = False
            a_hp = 1


def rank_sort(e: list[int]) -> int:
    return e[4]


def str_sort(e: Player) -> int:
    return e.attack * generate_attack_defense_mod(e)[0]


def s_print(records: list, lineup: list, lvl: int, name: str) -> None:
    f = open(f'{name} Level {lvl} Results.txt', "w")
    # print("Rank #: Player # - [Win, Tie, Lose]")
    for i in range(len(records)):
        # print(f"Rank {records[i][4]:03}: {records[i][3]:03} - [{records[i][WIN]:03}, {records[i][TIE]:02}, {records[i][LOSE]:03}] - {lineup[records[i][3]].print_stuff()}")
        f.write(f"Rank {records[i][4]:03}: {records[i][3]:03} - [{records[i][WIN]:03}, {records[i][TIE]:02}, {records[i][LOSE]:03}] - {lineup[records[i][3]].print_stuff()}\n")
    f.close()


def run_custom_setups():
    lineup = []
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
    setups = [
        # [172, 230, 230, 230, 252, 630, 630, 630, 314, 230, 230, 0],
        [188, 66, 67, 68, 226, 807, 630, 630, 322, 630, 630, 630],
        [172, 66, 67, 68, 252, 803, 807, 630, 314, 630, 630, 630]
    ]

    # Custom Equips
    for keys in setups:
        lineup.append(create_leveled_player(50, keys))
    lineup.sort(key=str_sort)
    for player in lineup:
        print(player.print_stuff())


def main() -> None:
    # run_custom_setups()

    # Best items for strength
    # for lvl in range(11):
    #     lineup = create_all_items_lineup([], not lvl)
    #     lineup = add_str_enchantments(lineup, max(1, lvl * 5), not lvl)
    #     final_lineup = []
    #     for keys in lineup:
    #         final_lineup.append(create_leveled_player(max(1, lvl * 5), keys))
    #     final_lineup.sort(key=str_sort)
    #     print(f"Best {max(1, lvl * 5)}: {final_lineup[-1].print_stuff()}")
    #     best_equips_strength[f'{max(1, lvl * 5)}'] = final_lineup[-1]

    # Best items overall
    for lvl in range(11):
        lineup = create_all_items_lineup([], not lvl)
        final_lineup = []
        for keys in lineup:
            final_lineup.append(create_leveled_player(max(1, lvl * 5), keys))
        record, lineup = run_lineup(final_lineup, max(1, lvl * 5), True)
        s_print(record, lineup, max(1, lvl * 5), 'combination')
        best_equips_normal[f'{max(1, lvl * 5)}'] = [lineup[-1].weapon.id, 0, 0, 0, lineup[-1].armor.id, 0, 0, 0, lineup[-1].ring.id, 0, 0, 0]

    # Best Enchantments for Best Items
    for lvl in range(11):
        lineup = add_all_enchantments([best_equips_normal[f'{max(1, lvl * 5)}']], max(1, lvl * 5), False)
        final_lineup = []
        for keys in lineup:
            final_lineup.append(create_leveled_player(max(1, lvl * 5), keys))
        record, lineup = run_lineup(final_lineup, max(1, lvl * 5), True)
        s_print(record, lineup, max(1, lvl * 5), 'enchantment')


make_lists()
main()
