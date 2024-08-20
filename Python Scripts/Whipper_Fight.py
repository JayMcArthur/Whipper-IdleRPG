from math import floor, ceil
from itertools import combinations_with_replacement, combinations, product
import random
import json
from multiprocessing import Pool, shared_memory, Lock
import numpy as np

monster_list = {}
equip_list = {}
custom_list = {}
dungeon_list = {}
level_list = {}

UPGRADE_MAX = 20000
ANALYSIS_MAX = 15
CORROSION_MAX = 999
MIASMA_APPLES = 99


# Global lock for safe concurrent access to the record_g
lock = Lock()
record_g = []

# This was made using the results from generate_all_items_levels_stats
# We take the best of every result and store them here for enchant use
# Enchants where processed and stored as notes
best_equips_normal = {
    "1": [171, 0, 0, 0, 244, 0, 0, 0, 303, 0, 0, 0],
    "5": [171, 0, 0, 0, 244, 0, 0, 0, 303, 0, 0, 0],
    "10": [171, 0, 0, 0, 244, 0, 0, 0, 303, 0, 0, 0],
    "15": [182, 0, 0, 0, 244, 0, 0, 0, 323, 0, 0, 0],
    "20": [182, 0, 0, 0, 244, 0, 0, 0, 323, 0, 0, 0],
    "25": [182, 0, 0, 0, 244, 0, 0, 0, 323, 0, 0, 0],
    "30": [182, 0, 0, 0, 244, 0, 0, 0, 323, 0, 0, 0],
    "35": [182, 0, 0, 0, 244, 0, 0, 0, 323, 0, 0, 0],
    "40": [182, 0, 0, 0, 244, 0, 0, 0, 323, 0, 0, 0],
    "45": [182, 0, 0, 0, 244, 0, 0, 0, 323, 0, 0, 0],
    "50": [175, 0, 0, 0, 246, 0, 0, 0, 323, 0, 0, 0]
}
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
                continue  # Skip Adam Dungeon
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


class Stats:
    def __init__(self, default: int = 0):
        self.hp = default
        self.str = default
        self.vit = default
        self.spd = default
        self.luk = default
        self.default = default

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

    def reset(self):
        self.hp = self.default
        self.str = self.default
        self.vit = self.default
        self.spd = self.default
        self.luk = self.default


class Item:
    def __init__(self, identifier):
        self.id = identifier
        self._type = equip_list[identifier]['itemType']
        if self._type == 1:
            self._specialized = None
            self.attack_kind = equip_list[identifier]['attackKind']
        else:
            self._specialized = equip_list[identifier]["specialized"]
            self.attack_kind = ''
        self.param = equip_list[identifier]["param"]
        self.upgrade = 0
        self.upgrade_boost = 1
        self._upgrade_max = equip_list[identifier]["maxLv"]
        self.boost = 1
        self.corrosion = 0
        self.corrosion_boost = 1
        self._enchant1 = 0
        self._enchant2 = 0
        self._enchant3 = 0
        # Used for real stats
        self.stats = Stats()
        self.stats.hp = equip_list[identifier]["hp"]
        self.stats.str = equip_list[identifier]["atk"]
        self.stats.vit = equip_list[identifier]["def"]
        self.up = Stats()
        self.up.hp = equip_list[identifier]["lvHp"]
        self.up.str = equip_list[identifier]["lvAtk"]
        self.up.vit = equip_list[identifier]["lvDef"]
        self.mult = Stats(1)
        self.effects = []

    def apply_analysis_weapon(self, analysis: int, has_set: bool):
        if analysis >= 5:
            self._upgrade_max += 100
        if analysis >= 6 and self.corrosion >= 50:
            self.boost += 0.3
        if analysis >= 7 and self.corrosion >= 100:
            self._upgrade_max += 1000
        if analysis >= 8 and self.corrosion >= 150:
            self.upgrade_boost *= 2
        if analysis >= 9 and self.corrosion >= 200 and has_set:
            self.mult.str += 0.5
        if analysis >= 10 and self.corrosion >= 250:
            self.corrosion_boost *= 2
        if analysis >= 11 and self.corrosion >= 300:
            self._upgrade_max += 2000
        if analysis >= 12 and self.corrosion >= 350:
            self.upgrade_boost *= 2
        if analysis >= 13 and self.corrosion >= 400 and has_set:
            self.mult.str += 0.5
        if analysis >= 14 and self.corrosion >= 450:
            self._upgrade_max += 3000
        if analysis >= 15 and self.corrosion >= 500:
            self.corrosion_boost *= 2

    def apply_analysis_armor(self, analysis: int):
        if analysis >= 5:
            self._upgrade_max += 100
        if analysis >= 6 and self.corrosion >= 50:
            self.mult.string_to_stat(self._specialized, 0.1)
        if analysis >= 7 and self.corrosion >= 100:
            self._upgrade_max += 1000
        if analysis >= 8 and self.corrosion >= 150:
            self.upgrade_boost *= 2
        if analysis >= 9 and self.corrosion >= 200:
            self.boost = 1.3
        if analysis >= 10 and self.corrosion >= 250:
            self.corrosion_boost *= 2
        if analysis >= 11 and self.corrosion >= 300:
            self._upgrade_max += 2000
        if analysis >= 12 and self.corrosion >= 350:
            self.upgrade_boost *= 2
        if analysis >= 13 and self.corrosion >= 400:
            self.mult.hp += 0.3
        if analysis >= 14 and self.corrosion >= 450:
            self._upgrade_max += 3000
        if analysis >= 15 and self.corrosion >= 500:
            self.corrosion_boost *= 2

    def apply_analysis_ring(self, analysis: int, attack_kind: str, has_set: bool):
        if analysis >= 5:
            self.mult.string_to_stat(self._specialized, 0.1)
        if analysis >= 6 and self.corrosion >= 50:
            self.mult.all_stats(0.1)
        if analysis >= 7 and self.corrosion >= 100:
            match equip_list[self.id]["ability"]:
                # First Strike
                case 66:
                    self.effects.append(66)
                # Double Strike
                case 67:
                    self.effects.append(67)
                # One Strike
                case 68:
                    self.effects.append(68)
                # Slashing Mastery
                case 901:
                    if attack_kind == "Slashing":
                        self.mult.str += 0.3
                # Bludgeoning Mastery
                case 911:
                    if attack_kind == "Bludgeoning":
                        self.mult.str += 0.3
                # Piercing Mastery
                case 921:
                    if attack_kind == "Piercing":
                        self.mult.str += 0.3
                # Projectile Mastery
                case 931:
                    if attack_kind == "Projectile":
                        self.mult.str += 0.3
                # Poison
                case 941:
                    self.effects.append(941)
                # Solitude
                case 951:
                    if not has_set:
                        self.mult.all_stats(0.1)
                # Unyielding
                case 961:
                    self.effects.append(961)
                # HP Boost
                case 2103:
                    self.mult.hp += 0.3
                # SPD Boost
                case 2403:
                    self.mult.spd += 0.3
                case _:
                    print(f"Invalid ability Effect: {equip_list[self.id]['ability']}")
        if analysis >= 8 and self.corrosion >= 150:
            self.mult.string_to_stat(self._specialized, 0.2)
        if analysis >= 9 and self.corrosion >= 200:
            self.mult.all_stats(0.2)
        # analysis 10 >= More likely to find better enchants
        if analysis >= 11 and self.corrosion >= 300:
            self.mult.string_to_stat(self._specialized, 0.3)
        if analysis >= 12 and self.corrosion >= 350:
            self.mult.all_stats(0.3)
        if analysis >= 13 and self.corrosion >= 400:
            match equip_list[self.id]["next"]:
                # Three Paths (Crit Damage)
                case 803:
                    self.effects.append(803)
                # Four Leaves (Double Drops)
                case 804:
                    self.effects.append(804)
                # Five Lights (Double XP)
                case 805:
                    self.effects.append(805)
                # Sixth Sense (Dodge Attack)
                case 806:
                    self.effects.append(806)
                # Seven Blessings (Probability Increase)
                case 807:
                    self.effects.append(807)
                # Slashing Mastery
                case 901:
                    if attack_kind == "Slashing":
                        self.mult.str += 0.3
                # Bludgeoning Mastery
                case 911:
                    if attack_kind == "Bludgeoning":
                        self.mult.str += 0.3
                # Piercing Mastery
                case 921:
                    if attack_kind == "Piercing":
                        self.mult.str += 0.3
                # Projectile Mastery
                case 931:
                    if attack_kind == "Projectile":
                        self.mult.str += 0.3
                # Solitude
                case 951:
                    if not has_set:
                        self.mult.all_stats(0.1)
                # HP Boost
                case 2103:
                    self.mult.hp += 0.3
                case _:
                    print(f"Invalid Next Effect: {equip_list[self.id]['next']}")
        if analysis >= 14 and self.corrosion >= 450:
            self.mult.string_to_stat(self._specialized, 0.4)
        # analysis 15 >= More likely to find better enchants

    def apply_upgrade(self, amount: int):
        self.upgrade = min(amount, self._upgrade_max)

    def apply_enchantment(self, enchants: list[int]):
        self._enchant1 = enchants[0]
        self._enchant2 = enchants[1]
        self._enchant3 = enchants[2]
        for check in enchants:
            match check:
                case 0:
                    continue
                case 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 55 | 56 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129 | 130:
                    self.stats.hp += custom_list[check]["value"]  # Endurance
                case 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 57 | 58 | 211 | 212 | 213 | 214 | 215 | 216 | 217 | 218 | 219 | 220 | 221 | 222 | 223 | 224 | 225 | 226 | 227 | 228 | 229 | 230:
                    self.stats.str += custom_list[check]["value"]  # Strength
                case 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 59 | 60 | 311 | 312 | 313 | 314 | 315 | 316 | 317 | 318 | 319 | 320 | 321 | 322 | 323 | 324 | 325 | 326 | 327 | 328 | 329 | 330:
                    self.stats.vit += custom_list[check]["value"]  # Sturdy
                case 25 | 26 | 27 | 61 | 62 | 63 | 64 | 65 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 419 | 420:
                    self.stats.spd += custom_list[check]["value"]  # Agility
                case 28 | 29 | 30:
                    self.stats.luk += custom_list[check]["value"]  # Lucky
                case 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 609 | 610 | 611 | 612 | 613 | 614 | 615 | 616 | 617 | 618 | 619 | 620 | 621 | 622 | 623 | 624 | 625 | 626 | 627 | 628 | 629 | 630:
                    self.up.str += custom_list[check]["value"]  # Strength Training
                case 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 709 | 710 | 711 | 712 | 713 | 714 | 715 | 716 | 717 | 718 | 719 | 720 | 721 | 722 | 723 | 724 | 725 | 726 | 727 | 728 | 729 | 730:
                    self.up.vit += custom_list[check]["value"]  # Defense Training
                case 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 509 | 510 | 511 | 512 | 513 | 514 | 515 | 516 | 517 | 518 | 519 | 520 | 521 | 522 | 523 | 524 | 525 | 526 | 527 | 528 | 529 | 530:
                    self.up.hp += custom_list[check]["value"]  # Endurance Training
                case 66 | 67 | 68 | 803 | 806 | 807:
                    # First Strike, Double Strike, One Strike, Three Paths, Sixth Sense, Seven Blessings
                    self.effects.append(check)
                case _:
                    print(f'Custom Effect {check} not found')

    def print(self):
        return f'{equip_list[self.id]["nameId_EN"]}({self.id})[{self._enchant1}, {self._enchant2}, {self._enchant3}]'


class Player(Stats):
    def __init__(self):
        super().__init__()
        self._has_set: bool = False
        self._attack_kind = ''
        self.weapon: Item | None = None
        self.armor: Item | None = None
        self.ring: Item | None = None
        self.effects: list[int] = []
        self.attack: int = 0
        self.defense: int = 0
        self.id: int = 0
        self.lvl: int = 1

    def apply_corrosion(self, amount: list[int]):
        self.weapon.corrosion = amount[0]
        self.armor.corrosion = amount[1]
        self.ring.corrosion = amount[2]

    def apply_analysis(self, amount: list[int]):
        self.weapon.apply_analysis_weapon(amount[0], self._has_set)
        self.armor.apply_analysis_armor(amount[1])
        self.ring.apply_analysis_ring(amount[2], self.weapon.attack_kind, self._has_set)

    def apply_upgrade(self, amount: list[int]):
        self.weapon.apply_upgrade(amount[0])
        self.armor.apply_upgrade(amount[1])
        self.ring.apply_upgrade(amount[2])

    def apply_enchantment(self, w_enchant: list[int], a_enchant: list[int], r_enchant: list[int],):
        self.weapon.apply_enchantment(w_enchant)
        self.armor.apply_enchantment(a_enchant)
        self.ring.apply_enchantment(r_enchant)

    def add_items(self, weapon: list[int], armor: list[int], ring: list[int], corrosion: list[int], analysis: list[int], upgrade: list[int]):
        self.weapon = Item(weapon[0])
        self.armor = Item(armor[0])
        self.ring = Item(ring[0])
        self._has_set = equip_list[weapon[0]]["set_EN"] in [equip_list[armor[0]]["nameId_EN"], equip_list[ring[0]]["nameId_EN"]]
        self.apply_corrosion(corrosion)
        self.apply_analysis(analysis)
        self.apply_upgrade(upgrade)
        self.apply_enchantment(weapon[1:], armor[1:], ring[1:])
        self.effects += self.weapon.effects + self.armor.effects + self.ring.effects

    def convert_monster(self, monster_id: int, miasma: int = 5):
        # TODO miasma's affect isn't correct
        self.hp = monster_list[monster_id]['hp'] * miasma
        self.attack = monster_list[monster_id]['atk'] * miasma
        self.defense = monster_list[monster_id]['def'] * miasma
        self.spd = monster_list[monster_id]['spd'] * miasma

    def print(self):
        mods = generate_attack_defense_mod(self)
        return (f'HP: {self.hp}, STR: {self.str}, VIT: {self.vit}, SPD: {self.spd}, LUK: {self.luk}, '
                f'Attack: {self.attack}, Defense: {self.defense}, '
                f'A Scaled: {floor(self.attack * mods[0])}, D Scaled: {floor(self.defense * mods[1])}, '
                f'[{self.weapon.print()}, '
                f'{self.armor.print()}, '
                f'{self.ring.print()}]')

    def apply_level(self, level: int):
        # Get Base stats
        self.hp = 30 + self.weapon.stats.hp + self.armor.stats.hp + self.ring.stats.hp
        self.str = 10 + self.weapon.stats.str + self.armor.stats.str + self.ring.stats.str
        self.vit = 10 + self.weapon.stats.vit + self.armor.stats.vit + self.ring.stats.vit
        self.spd = 1 + self.weapon.stats.spd + self.armor.stats.spd + self.ring.stats.spd
        self.luk = 1 + self.weapon.stats.luk + self.armor.stats.luk + self.ring.stats.luk + MIASMA_APPLES
        # Get Lvl up stats
        self.hp += (10 + self.weapon.up.hp + self.armor.up.hp + self.ring.up.hp) * (level - 1)
        self.str += (1 + self.weapon.up.str + self.armor.up.str + self.ring.up.str) * (level - 1)
        self.vit += (1 + self.weapon.up.vit + self.armor.up.vit + self.ring.up.vit) * (level - 1)
        self.spd += (level - 1)
        # Do Multiplier
        self.hp *= self.weapon.mult.hp + self.armor.mult.hp + self.ring.mult.hp - 2
        self.str *= self.weapon.mult.str + self.armor.mult.str + self.ring.mult.str - 2
        self.vit *= self.weapon.mult.vit + self.armor.mult.vit + self.ring.mult.vit - 2
        self.spd *= self.weapon.mult.spd + self.armor.mult.spd + self.ring.mult.spd - 2
        self.luk *= self.weapon.mult.luk + self.armor.mult.luk + self.ring.mult.luk - 2
        # Floor values
        self.hp = floor(self.hp)
        self.str = floor(self.str)
        self.vit = floor(self.vit)
        self.spd = floor(self.spd)
        self.luk = floor(self.luk)
        # Add Weapon
        self.attack = self.str + (((self.weapon.upgrade * self.weapon.upgrade_boost) + (self.weapon.corrosion * 10 * self.weapon.corrosion_boost) + self.weapon.param) * self.weapon.boost)
        # Add Armor
        self.defense = self.vit + ((self.armor.upgrade * self.armor.upgrade_boost + self.armor.corrosion * 10 * self.armor.corrosion_boost + self.armor.param) * self.armor.boost)
        # Floor values
        self.attack = floor(self.attack)
        self.defense = floor(self.defense)


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


def run_lineup(lineup: list[Player], record: list, lvl: int, print_stuff: bool) -> None:
    fights = 0
    total_fights = floor((len(lineup) * (len(lineup) + 1)) / 2)
    percent = 0

    for id_a, per_a in enumerate(lineup):
        for id_b, per_b in enumerate(lineup[id_a + 1::]):
            id_b += id_a + 1

            # 66 - First Strike
            if 66 not in per_b.effects and (66 in per_a.effects or per_a.spd > per_a.spd):
                results = fight(per_a, per_b, True)
            elif 66 not in per_a.effects and (66 in per_b.effects or per_b.spd > per_a.spd):
                results = fight(per_b, per_a, True)[::-1]
            else:
                results = [a + b for a, b in zip(fight(per_a, per_b, True), fight(per_b, per_a, True)[::-1])]

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
    record.sort(key=rank_sort)


def worker(arg):
    idx_a, idx_b, shm_name, shape = arg

    # Access shared memory
    existing_shm = shared_memory.SharedMemory(name=shm_name)
    stats_array = np.ndarray(shape, dtype=np.int32, buffer=existing_shm.buf)

    # Extract player stats
    a_hp, a_attack, a_def, a_unyielding, a_spd, a_fs = stats_array[idx_a]
    b_hp, b_attack, b_def, b_unyielding, b_spd, b_fs = stats_array[idx_b]

    # (HP, ATK, DEF, Unyielding, SPD, First_Strike)
    # 66 - First Strike
    if not b_fs and (a_fs or a_spd > b_spd):
        results = fight_multiprocessing(a_hp, a_attack, a_def, a_unyielding, b_hp, b_attack, b_def, b_unyielding)
    elif not a_fs and (b_fs or b_spd > a_spd):
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


def run_lineup_multiprocessing(lineup: list[Player]) -> list[list[int]]:
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
        pool.apply_async(worker, [(idx_a, idx_b, shm.name, stats_array.shape)], callback=process_fight_results)

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


def fight(attacker: Player, defender: Player, alt: bool = False, miasma: int = 5) -> list[int]:
    # First Strike:    #66  (Can always attack first in battle) -- This happens outside

    # Poison  941 TODO

    # Unyielding 961 (Stay at 1 HP once during an adventure and deliver a critical hit on the next attack)
    a_unyielding = 961 in attacker.effects
    d_unyielding = 961 in defender.effects
    # I don't give the auto crit just keep the chance stuff

    a_mod = generate_attack_defense_mod(attacker)
    d_mod = generate_attack_defense_mod(defender)

    a_hp = attacker.hp
    a_damage = max(0, floor((attacker.attack * a_mod[0]) - (defender.defense * d_mod[1])))
    d_hp = defender.hp
    d_damage = max(0, floor((defender.attack * d_mod[0]) - (attacker.defense * a_mod[1])))

    # Simplify if you do near 0 damage in game
    #  In reality you would do some damage but uk
    if a_damage == 0 and d_damage == 0:
        return [0, 0]
    if a_damage == 0:
        return [0, 1]
    if d_damage == 0:
        return [1, 0]

    if alt:
        a_hits = ceil(a_hp / d_damage) + a_unyielding
        d_hits = ceil(d_hp / a_damage) + d_unyielding
        if a_hits < d_hits:
            return [0, 1]
        return [1, 0]

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


def fight_multiprocessing(a_hp: int, a_attack: int, a_defense: int, a_unyielding: bool, d_hp: int, d_attack: int, d_defense: int, d_unyielding: bool) -> list[int]:
    # First Strike:    #66  (Can always attack first in battle) -- This happens outside
    # Poison  941 TODO
    # Unyielding 961 (Stay at 1 HP once during an adventure and deliver a critical hit on the next attack)

    a_damage = max(0, floor(a_attack - d_defense))
    d_damage = max(0, floor(d_attack - a_defense))

    if a_damage == 0 and d_damage == 0:
        return [0, 0]
    if a_damage == 0:
        return [0, 1]
    if d_damage == 0:
        return [1, 0]

    a_hits = ceil(a_hp / d_damage) + a_unyielding
    d_hits = ceil(d_hp / a_damage) + d_unyielding
    if a_hits < d_hits:
        return [0, 1]
    return [1, 0]


def rank_sort(e: list[int]) -> int:
    return e[4]


def str_sort(e: Player) -> int:
    return floor(e.attack * generate_attack_defense_mod(e)[0])


def s_print(records: list, lineup: list, lvl: int, name: str) -> None:
    f = open(f'{name} Level {lvl} Results.txt', "w")
    # print("Rank #: Player # - [Win, Tie, 1]")
    for i in range(len(records)):
        # print(f"Rank {records[i][4]:03}: {records[i][3]:03} - [{records[i][0]:03}, {records[i][2]:02}, {records[i][1]:03}] - {lineup[records[i][3]].print()}")
        f.write(f"Rank {records[i][4]:03}: {records[i][3]:03} - [{records[i][0]:03}, {records[i][2]:02}, {records[i][1]:03}] - {lineup[records[i][3]].print()}\n")
    f.close()


def run_custom_setups(levels: list[int]):
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
        run_lineup(final_lineup, record, lvl, False)

        s_print(record, lineup, max(1, lvl * 5), 'custom')


def main(run_custom: bool, run_str: bool, run_all: bool, run_enchant: bool) -> None:
    if run_custom:
        run_custom_setups([1, 50])

    # Best items for strength
    if run_str:
        lineup = []
        create_all_items_keys(lineup, True)

        # Initialize Players
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
            record = run_lineup_multiprocessing(final_lineup)  # This still is not faster and has memory errors
            # run_lineup(final_lineup, record, max(1, lvl * 5), True)
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
            run_lineup(final_lineup, record, max(1, lvl * 5), True)
            s_print(record, final_lineup, max(1, lvl * 5), 'enchantment')


if __name__ == '__main__':
    make_lists()
    main(False, False, True, True)
