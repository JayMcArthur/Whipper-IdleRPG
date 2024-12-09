from random import randint
from math import floor, log10

from json_to_python import monster_list, equip_list, custom_list, exp_to_level, enchantment_list

# This is the defaults of items
UPGRADE_MAX = 50000
ANALYSIS_LEVEL_MAX = 20
COMBAT_CHIP_BP = 50 * 5
ANALYSIS_BOOST_MAX = (166 * (20/5)) + COMBAT_CHIP_BP  # 914
# We give max to All damage types as I assume you will change boost to weapon type
ANALYSIS_BOOST_DEFAULT = [
    # Points Given, Possible, Name, Effect
    0,  # _ 0-200 | HP              | 0.5%/BP
    100,  # 0-200 | STR             | 0.5%/BP
    100,  # 0-200 | VIT             | 0.5%/BP
    0,  # _ 0-200 | SPD             | 0.5%/BP
    0,  # _ 0-200 | LUK             | 0.5%/BP
    0,  # _ 0-200 | Drop Rate       | 0.02%/BP
    100,  # 0-200 | Crit Rate       | 0.2%/BP
    0,  # _ 0-200 | Crit Dmg        | 0.5%/BP
    100,  # 0-200 | Slash Dmg       | 0.5%/BP
    100,  # 0-200 | Bludgeon Dmg    | 0.5%/BP
    100,  # 0-200 | Pierce Dmg      | 0.5%/BP
    100,  # 0-200 | Projectile Dmg  | 0.5%/BP
    0,  # _ 0-200 | Poison Dmg      | 0.01%/BP
    0,  # _ 0-200 | Xp Gain         | 0.5%/BP
    50,  #_ 00/50 | First Strike    | 50BP > Always attack first
    0,  # _ 00/50 | Poison          | 50BP > inflict poison
    50,  #_ 00/50 | Unyielding      | 50BP > revive at 1 hp
    50,  #_ 00/50 | One Strike      | 50BP > Crit chance increases by 20%
    50,  #_ 00/50 | Double Strike   | 50BP > Chance of double attacks 20%
    50,  #_ 00/50 | Three Paths     | 50BP > 50% chance for 3x crit damage
    0,  # _ 00/50 | Four Leaves     | 50BP > 20% chance for 2x drops
    0,  # _ 00/50 | Five Lights     | 50BP > 20% chance for 2x exp
    50,  #_ 00/50 | Sixth Sense     | 50BP > 20% chance to dodge attack
    50,  #_ 00/50 | Seven Blessings | 50BP > chance amounts are doubled
]
CORROSION_MAX = 2500


class Stats:
    def __init__(self, default: int = 0):
        self.hp: int = default
        self.str: int = default
        self.vit: int = default
        self.spd: int = default
        self.luk: int = default
        self.default: int = default

    def string_to_stat(self, stat: str, amount: int | float):
        if stat == "HP":
            self.hp += amount
        elif stat == "STR":
            self.str += amount
        elif stat == "VIT":
            self.vit += amount
        elif stat == "SPD":
            self.spd += amount
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
    def __init__(self, identifier: int):
        self.id: int = identifier
        self._type: int = equip_list[identifier]['itemType']
        self._specialized: str = ''
        self.attack_kind: str = ''
        if self._type == 1:
            self.attack_kind = equip_list[identifier]['attackKind']
        else:
            self._specialized = equip_list[identifier]["specialized"]

        self.param: int = equip_list[identifier]["param"]
        self.upgrade: int = 0
        self.upgrade_boost: float = 1
        self._upgrade_max: int = equip_list[identifier]["maxLv"]
        self.boost: float = 1
        self.corrosion: int = 0
        self.corrosion_boost: float = 1
        self._enchant1: int = 0
        self._enchant2: int = 0
        self._enchant3: int = 0
        # Used for real stats
        self.stats: Stats = Stats()
        self.stats.hp = equip_list[identifier]["hp"]
        self.stats.str = equip_list[identifier]["atk"]
        self.stats.vit = equip_list[identifier]["def"]
        self.up: Stats = Stats()
        self.up.hp = equip_list[identifier]["lvHp"]
        self.up.str = equip_list[identifier]["lvAtk"]
        self.up.vit = equip_list[identifier]["lvDef"]
        self.mult: Stats = Stats(1)
        self.effects: list[int] = []

    def apply_analysis_weapon(self, analysis: int, has_set: bool):
        if analysis >= 5:
            self.apply_effect(1101)  # Exceed upgrade limit
        if analysis >= 6 and self.corrosion >= 50:
            self.apply_effect(972)  # Attack Power Boost
        if analysis >= 7 and self.corrosion >= 100:
            self.apply_effect(1102)  # Exceed upgrade limit
        if analysis >= 8 and self.corrosion >= 150:
            self.apply_effect(1001)  # Upgrade Boost
        if analysis >= 9 and self.corrosion >= 200:
            self.apply_effect(3101, has_set=has_set)  # Set Boost
        if analysis >= 10 and self.corrosion >= 250:
            self.apply_effect(3101)  # Corrosion Level Boost
        if analysis >= 11 and self.corrosion >= 300:
            self.apply_effect(1103)  # Exceed upgrade limit
        if analysis >= 12 and self.corrosion >= 350:
            self.apply_effect(1001)  # Upgrade Boost
        if analysis >= 13 and self.corrosion >= 400:
            self.apply_effect(3101, has_set=has_set)  # Set Boost
        if analysis >= 14 and self.corrosion >= 450:
            self.apply_effect(1104)  # Exceed upgrade limit
        if analysis >= 15 and self.corrosion >= 500:
            self.apply_effect(3101)  # Corrosion Level Boost

    def apply_analysis_armor(self, analysis: int):
        if analysis >= 5:
            self.apply_effect(1101)  # Exceed upgrade limit
        if analysis >= 6 and self.corrosion >= 50:
            if self._specialized == "HP":
                self.apply_effect(2101)  # HP Boost
            elif self._specialized == "STR":
                self.apply_effect(2201)  # STR Boost
            elif self._specialized == "VIT":
                self.apply_effect(2301)  # VIT Boost
            elif self._specialized == "SPD":
                self.apply_effect(2401)  # SPD Boost
            elif self._specialized == "LUK":
                self.apply_effect(2501)  # LUK Boost
            else:
                print(f"Invalid Stat: {self._specialized}")
        if analysis >= 7 and self.corrosion >= 100:
            self.apply_effect(1102)  # Exceed upgrade limit
        if analysis >= 8 and self.corrosion >= 150:
            self.apply_effect(1001)  # Upgrade Boost
        if analysis >= 9 and self.corrosion >= 200:
            self.apply_effect(982)  # Defense Power Boost
        if analysis >= 10 and self.corrosion >= 250:
            self.apply_effect(3101)  # Corrosion Level Boost
        if analysis >= 11 and self.corrosion >= 300:
            self.apply_effect(1103)  # Exceed upgrade limit
        if analysis >= 12 and self.corrosion >= 350:
            self.apply_effect(1001)  # Upgrade Boost
        if analysis >= 13 and self.corrosion >= 400:
            self.apply_effect(2103)  # HP Boost
        if analysis >= 14 and self.corrosion >= 450:
            self.apply_effect(1104)  # Exceed upgrade limit
        if analysis >= 15 and self.corrosion >= 500:
            self.apply_effect(3101)  # Corrosion Level Boost

    def apply_analysis_ring(self, analysis: int, attack_kind: str, has_set: bool):
        if analysis >= 5:
            if self._specialized == "HP":
                self.apply_effect(2101)  # HP Boost
            elif self._specialized == "STR":
                self.apply_effect(2201)  # STR Boost
            elif self._specialized == "VIT":
                self.apply_effect(2301)  # VIT Boost
            elif self._specialized == "SPD":
                self.apply_effect(2401)  # SPD Boost
            elif self._specialized == "LUK":
                self.apply_effect(2501)  # LUK Boost
            else:
                print(f"Invalid Stat: {self._specialized}")
        if analysis >= 6 and self.corrosion >= 50:
            self.apply_effect(2601)  # All Stats Boost
        if analysis >= 7 and self.corrosion >= 100:
            worked = self.apply_effect(equip_list[self.id]["ability"], attack_kind, has_set)
            if not worked:
                print(f"Invalid ability Effect: {equip_list[self.id]['ability']}")
        if analysis >= 8 and self.corrosion >= 150:
            if self._specialized == "HP":
                self.apply_effect(2102)  # HP Boost
            elif self._specialized == "STR":
                self.apply_effect(2202)  # STR Boost
            elif self._specialized == "VIT":
                self.apply_effect(2302)  # VIT Boost
            elif self._specialized == "SPD":
                self.apply_effect(2402)  # SPD Boost
            elif self._specialized == "LUK":
                self.apply_effect(2502)  # LUK Boost
            else:
                print(f"Invalid Stat: {self._specialized}")
        if analysis >= 9 and self.corrosion >= 200:
            self.apply_effect(2602)  # All Stats Boost
        if analysis >= 10:
            self.apply_effect(3001)  # Ability Level Boost
        if analysis >= 11 and self.corrosion >= 300:
            if self._specialized == "HP":
                self.apply_effect(2103)  # HP Boost
            elif self._specialized == "STR":
                self.apply_effect(2203)  # STR Boost
            elif self._specialized == "VIT":
                self.apply_effect(2303)  # VIT Boost
            elif self._specialized == "SPD":
                self.apply_effect(2403)  # SPD Boost
            elif self._specialized == "LUK":
                self.apply_effect(2503)  # LUK Boost
            else:
                print(f"Invalid Stat: {self._specialized}")
        if analysis >= 12 and self.corrosion >= 350:
            self.apply_effect(2603)  # All Stats Boost
        if analysis >= 13 and self.corrosion >= 400:
            worked = self.apply_effect(equip_list[self.id]["next"], attack_kind, has_set)
            if not worked:
                print(f"Invalid Next Effect: {equip_list[self.id]['next']}")
        if analysis >= 14 and self.corrosion >= 450:
            if self._specialized == "HP":
                self.apply_effect(2104)  # HP Boost
            elif self._specialized == "STR":
                self.apply_effect(2204)  # STR Boost
            elif self._specialized == "VIT":
                self.apply_effect(2304)  # VIT Boost
            elif self._specialized == "SPD":
                self.apply_effect(2404)  # SPD Boost
            elif self._specialized == "LUK":
                self.apply_effect(2504)  # LUK Boost
            else:
                print(f"Invalid Stat: {self._specialized}")
        if analysis >= 15:
            self.apply_effect(3002)  # Ability Level Boost

    def apply_upgrade(self, amount: int):
        self.upgrade = min(amount, self._upgrade_max)

    def apply_enchantments(self, enchants: list[int]):
        self._enchant1 = enchants[0]
        self._enchant2 = enchants[1]
        self._enchant3 = enchants[2]
        for enchant in enchants:
            self.apply_effect(enchant)

    def apply_effect(self, effect: int, attack_kind: str = "", has_set: bool = False):
        match effect:
            # Normal Enchantments
            case 0:
                pass  # No Enchantment
            case _ if effect in enchantment_list['Endurance']:
                self.stats.hp += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Strength']:
                self.stats.str += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Sturdy']:
                self.stats.vit += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Agility']:
                self.stats.spd += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Lucky']:
                self.stats.luk += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Strength Training']:
                self.up.str += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Defense Training']:
                self.up.vit += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Endurance Training']:
                self.up.hp += custom_list[effect]["value"]
            # Special Enchantments
            case _ if effect in enchantment_list['First Strike']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['One Strike']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Double Strike']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Three Paths']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Four Leaves']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Five Lights']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Sixth Sense']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Seven Blessings']:
                self.effects.append(effect)
            # Ring Effects
            case _ if effect in enchantment_list['Mastery of Slashing']:
                if attack_kind == "Slashing":
                    self.mult.str += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['Mastery of Bludgeoning']:
                if attack_kind == "Bludgeoning":
                    self.mult.str += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['Mastery of Piercing']:
                if attack_kind == "Piercing":
                    self.mult.str += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['Mastery of Projectiles']:
                if attack_kind == "Projectile":
                    self.mult.str += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['Poison']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Solitude']:
                if not has_set:
                    self.mult.all_stats(custom_list[effect]["value"] / 100)
            case _ if effect in enchantment_list['Unyielding']:
                self.effects.append(effect)
            # These are the builtin Weapon/Armor analysis effects
            case _ if effect in enchantment_list['Attack Power Boost']:
                self.boost += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['Defense Power Boost']:
                self.boost += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['Upgrade Boost']:
                self.upgrade_boost *= custom_list[effect]["value"]
            case _ if effect in enchantment_list['Exceed upgrade limit']:
                self._upgrade_max += custom_list[effect]["value"]
            case _ if effect in enchantment_list['Corrosion Level Boost']:
                self.corrosion_boost *= custom_list[effect]["value"]
            # These are the builtin Ring analysis effects
            case _ if effect in enchantment_list['HP Boost']:
                self.mult.hp += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['STR Boost']:
                self.mult.str += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['VIT Boost']:
                self.mult.vit += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['SPD Boost']:
                self.mult.spd += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['LUK Boost']:
                self.mult.luk += custom_list[effect]["value"] / 100
            case _ if effect in enchantment_list['All Stats Boost']:
                self.mult.all_stats(custom_list[effect]["value"] / 100)
            case _ if effect in enchantment_list['Ability Level Boost']:
                self.effects.append(effect)
            case _ if effect in enchantment_list['Set Boost']:
                if has_set:
                    self.mult.str += custom_list[effect]["value"] / 100
            case _:
                print(f'Custom Effect {effect} not found')
                return False
        return True

    def print(self):
        return f'{equip_list[self.id]["nameId_EN"]}[{self.id}, {self._enchant1}, {self._enchant2}, {self._enchant3}]'


class Player(Stats):
    def __init__(self):
        super().__init__()
        self._has_set: bool = False
        self._attack_kind: str = ''
        self.weapon: Item | None = None
        self.armor: Item | None = None
        self.ring: Item | None = None
        self.effects: list[int] = []
        self.drop_rate: float = 1
        self.crit_rate: float = 0.05
        self.analysis_crit_rate: float = 1
        self.crit_damage: float = 2
        self.analysis_crit_damage: float = 1
        self.first_strike: bool = False
        self.double_strike: float = 0
        self.poison: bool = False
        self.poison_damage: float = 0.01
        self.experience_gain: float = 1
        self.revive: bool = False
        self.dodge: int = 0
        self.weapon_boost: float = 1
        self.attack: int = 0
        self.defense: int = 0
        self.current_hp: int = 0
        self.id: int = 0
        self.lvl: int = 1
        self.xp: int = 0
        self.type: str = 'Player'
        self.analysis_boost = Stats(1)

    def apply_corrosion(self, amount: list[int]):
        self.weapon.corrosion = amount[0]
        self.armor.corrosion = amount[1]
        self.ring.corrosion = amount[2]

    def apply_analysis(self, level: list[int], boost_points: list[int]):
        self.analysis_boost.hp += boost_points[0] * 0.005
        self.analysis_boost.str += boost_points[1] * 0.005
        self.analysis_boost.vit += boost_points[2] * 0.005
        self.analysis_boost.spd += boost_points[3] * 0.005
        self.analysis_boost.luk += boost_points[4] * 0.005
        self.drop_rate += boost_points[5] * 0.0002  # TODO - IDK if this is + or *
        self.analysis_crit_rate += boost_points[6] * 0.002  # TODO - IDK if this is + or *
        self.analysis_crit_damage += boost_points[7] * 0.005  # TODO - IDK if this is + or *
        if self.weapon.attack_kind == "Slashing":
            self.weapon_boost = boost_points[8] * 0.005
        if self.weapon.attack_kind == "Bludgeoning":
            self.weapon_boost = boost_points[9] * 0.005
        if self.weapon.attack_kind == "Piercing":
            self.weapon_boost = boost_points[10] * 0.005
        if self.weapon.attack_kind == "Projectile":
            self.weapon_boost = boost_points[11] * 0.005
        self.poison_damage += boost_points[12] * 0.0001  # TODO - IDK if this is + or * - is this before or after enchantments
        self.experience_gain += boost_points[13] * 0.005  # TODO - IDK if this is + or * - is this before or after enchantments
        if boost_points[14] == 50:
            self.effects += [66]
        if boost_points[15] == 50:
            self.effects += [941]
        if boost_points[16] == 50:
            self.effects += [961]
        if boost_points[17] == 50:
            self.effects += [68]
        if boost_points[18] == 50:
            self.effects += [67]
        if boost_points[19] == 50:
            self.effects += [803]
        if boost_points[20] == 50:
            self.effects += [804]
        if boost_points[21] == 50:
            self.effects += [805]
        if boost_points[22] == 50:
            self.effects += [806]
        if boost_points[23] == 50:
            self.effects += [807]
        self.weapon.apply_analysis_weapon(level[0], self._has_set)
        self.armor.apply_analysis_armor(level[1])
        self.ring.apply_analysis_ring(level[2], self.weapon.attack_kind, self._has_set)

    def apply_upgrade(self, amount: list[int]):
        self.weapon.apply_upgrade(amount[0])
        self.armor.apply_upgrade(amount[1])
        self.ring.apply_upgrade(amount[2])

    def apply_enchantment(self, w_enchant: list[int], a_enchant: list[int], r_enchant: list[int], ):
        self.weapon.apply_enchantments(w_enchant)
        self.armor.apply_enchantments(a_enchant)
        self.ring.apply_enchantments(r_enchant)

    def add_items(self, weapon: list[int], armor: list[int], ring: list[int], corrosion: list[int], analysis: list[int], analysis_boost: list[int], upgrade: list[int]):
        self.weapon = Item(weapon[0])
        self.armor = Item(armor[0])
        self.ring = Item(ring[0])
        self._has_set = equip_list[weapon[0]]["set_EN"] in [equip_list[armor[0]]["nameId_EN"], equip_list[ring[0]]["nameId_EN"]]
        self.apply_corrosion(corrosion)
        self.apply_analysis(analysis, analysis_boost)
        self.apply_upgrade(upgrade)
        self.apply_enchantment(weapon[1:], armor[1:], ring[1:])
        self.effects += self.weapon.effects + self.armor.effects + self.ring.effects
        self.apply_effects()

    def apply_effects(self):
        self.effects = list(set(self.effects))

        represented_effects = [66, 67, 68, 803, 804, 805, 806, 807, 941, 961]
        if not self.effects.issubset(represented_effects):
            print(f"Found invalid effects: {[x for x in self.effects if x not in represented_effects]}")

        # Seven Blessings: #807 (The probability of probability-based abilities is doubled)
        seven_blessings = 1 if 807 not in self.effects else custom_list[807]["value"]

        # First Strike: #66 (A preemptive strike (1/2 damage) triggers at the start of combat)
        self.first_strike = 66 in self.effects

        # Double Strike: #67 (20% chance to attack twice)
        double_strike = 67 in self.effects
        self.double_strike = (custom_list[67]["value"]/100 * double_strike * seven_blessings) + log10(self.spd)  # TODO SPD affects this but idk how

        # Three Paths: #803 (50% chance for critical damage to be *3)
        # Crit is 5% for 2x attack damage
        three_paths_chance = min(1, 0 if 803 not in self.effects else (custom_list[803]["value"]/100 * seven_blessings))
        self.crit_damage = (2 + three_paths_chance) * self.analysis_crit_damage

        # Four Leaves: #804 (20% chance to double enemy drops)
        self.drop_rate += 0 if 804 not in self.effects else custom_list[804]["value"]/100 * seven_blessings

        # Five Lights: # 805 (20% chance to double experience points)
        self.experience_gain += 0 if 805 not in self.effects else custom_list[805]["value"]/100 * seven_blessings

        # Six Sense: #806 (20% chance to dodge an attack)
        self.dodge += 0 if 806 not in self.effects else custom_list[806]["value"]/100 * seven_blessings + log10(self.spd)  # TODO SPD affects this but idk how

        # One Strike: #68  (Critical hit chance increases by 20%)
        self.crit_rate = 0.05 + (custom_list[68]["value"]/100 * (68 in self.effects) * seven_blessings) + self.analysis_crit_rate

        # Poison (941): Deals 0.5% of Max HP stacking damage at end of turn
        self.poison = 941 in self.effects

        # Unyielding 961 (Stay at 1 HP once during an adventure and deliver a critical hit on the next attack)
        self.revive = 961 in self.effects

    def print(self):
        mods = generate_attack_defense_mod(self)
        return (f'HP: {self.hp}, STR: {self.str}, VIT: {self.vit}, SPD: {self.spd}, LUK: {self.luk}, '
                f'Attack: {self.attack}, Defense: {self.defense}, '
                f'Current HP: {self.current_hp}, A Avg: {floor(self.attack * mods[0])}, D Avg: {floor(self.defense * mods[1])}, '
                f'[{self.weapon.print()}, '
                f'{self.armor.print()}, '
                f'{self.ring.print()}]')

    def apply_level(self, level: int):
        self.lvl = level
        # Get Base stats
        self.hp = 30 + self.weapon.stats.hp + self.armor.stats.hp + self.ring.stats.hp
        self.str = 10 + self.weapon.stats.str + self.armor.stats.str + self.ring.stats.str
        self.vit = 10 + self.weapon.stats.vit + self.armor.stats.vit + self.ring.stats.vit
        self.spd = 1 + self.weapon.stats.spd + self.armor.stats.spd + self.ring.stats.spd
        self.luk = 1 + self.weapon.stats.luk + self.armor.stats.luk + self.ring.stats.luk
        # Get Lvl up stats
        self.hp += (10 + self.weapon.up.hp + self.armor.up.hp + self.ring.up.hp) * (level - 1)
        self.str += (1 + self.weapon.up.str + self.armor.up.str + self.ring.up.str) * (level - 1)
        self.vit += (1 + self.weapon.up.vit + self.armor.up.vit + self.ring.up.vit) * (level - 1)
        self.spd += (level - 1)
        # Do Multiplier
        self.hp *= self.weapon.mult.hp + self.armor.mult.hp + self.ring.mult.hp + self.analysis_boost.hp - 3
        self.str *= self.weapon.mult.str + self.armor.mult.str + self.ring.mult.str + self.analysis_boost.str - 3
        self.vit *= self.weapon.mult.vit + self.armor.mult.vit + self.ring.mult.vit + self.analysis_boost.vit - 3
        self.spd *= self.weapon.mult.spd + self.armor.mult.spd + self.ring.mult.spd + self.analysis_boost.spd - 3
        self.luk *= self.weapon.mult.luk + self.armor.mult.luk + self.ring.mult.luk + self.analysis_boost.luk - 3
        # Floor values
        self.hp = floor(self.hp)
        self.str = floor(self.str)
        self.vit = floor(self.vit)
        self.spd = floor(self.spd)
        self.luk = floor(self.luk)
        # Add Weapon
        self.attack = self.str + (((self.weapon.upgrade * self.weapon.upgrade_boost) + (self.weapon.corrosion * 10 * self.weapon.corrosion_boost) + self.weapon.param) * self.weapon.boost)
        self.attack = floor(self.attack * self.weapon_boost)
        # Add Armor
        self.defense = self.vit + (((self.armor.upgrade * self.armor.upgrade_boost) + (self.armor.corrosion * 10 * self.armor.corrosion_boost) + self.armor.param) * self.armor.boost)
        # Floor values
        self.attack = floor(self.attack)
        self.defense = floor(self.defense)
        self.current_hp = self.hp

    def gain_xp(self, xp: int):
        self.xp += floor(xp * self.experience_gain)
        level = exp_to_level(self.xp)
        if level != self.lvl:
            self.apply_level(level)


class Monster(Stats):
    # See ./Dart_Code for Miasma Effect and Monster Generator
    # Thanks to Haap for dart code
    def __init__(self, monster_id: int, dungeon_id: int, dungeon_floor: int, dungeon_name: str = '', is_royal_tomb: bool = False, miasma_level: int = 50):
        super().__init__()
        self.id: int = monster_id
        self.name: str = monster_list[monster_id]['nameId_EN']
        self.xp: int = monster_list[monster_id]['exp']
        self.effects: list[int] = monster_list[monster_id]['effects']
        self.dungeon_id: int = dungeon_id
        self.floor: int = dungeon_floor
        self.type: str = 'Monster'

        f = dungeon_floor
        # Because Royal Tomb goes up forever, we normalise floor
        if is_royal_tomb:
            f = (dungeon_floor - 1) % 50 + 1
            miasma_level = dungeon_floor // 100

        self.lvl: int = miasma_level

        ###############################
        # Injected Miasma Effect Code #
        ###############################

        # Randomly Generated Dungeons get a boost
        # "峡谷" in self.dungeon_name
        dungeon_bias = 0
        if "The Fortress" in dungeon_name:
            dungeon_bias = 2
        elif "The Mausoleum" in dungeon_name:
            dungeon_bias = 4
        elif "The Ancient Citadel" in dungeon_name:
            dungeon_bias = 8

        base_param = (((500 * round(1 + dungeon_id / 4)) + (100 * dungeon_id)) + min(2500 * (miasma_level - 1), 10000))
        more_percent = (10 + (dungeon_id * 2) + dungeon_bias) * miasma_level
        minimum_damage_percent = min(miasma_level, 3)

        if is_royal_tomb and dungeon_floor % 100 == 0:
            base_param_prev = (((500 * round(1 + dungeon_id / 4)) + (100 * dungeon_id)) + min(2500 * (miasma_level - 2), 10000))
            more_percent_prev = (10 + (dungeon_id * 2) + dungeon_bias) * (miasma_level - 1)
            base_param = (base_param + base_param_prev) // 2
            more_percent = (more_percent + more_percent_prev) // 2

        #############################
        # Back to Monster Generator #
        #############################

        # If there is Miasma, The enemy gets 3% stronger every 4 floors
        more_percent += (f // 4) * (3 + miasma_level)
        if miasma_level == 0:
            more_percent = 0
            base_param = 0
            minimum_damage_percent = 0

        # Change in strength according to the level of miasma
        self.hp = floor((monster_list[monster_id]['hp'] + base_param) * ((more_percent * 2 + 100) / 100))
        if monster_id == 131:
            self.attack = monster_list[monster_id]['atk'] * (miasma_level ** 2)
        else:
            self.attack = floor((monster_list[monster_id]['atk'] + base_param) * ((more_percent + 100) / 100))
        self.minimum_damage = floor((self.attack * minimum_damage_percent) / 100)
        self.defense = floor((monster_list[monster_id]['def'] + base_param) * ((more_percent + 100) / 100))
        self.spd = floor(monster_list[monster_id]['spd'] * ((more_percent + 100) / 100))
        self.current_hp = self.hp

        self.analysis_boost: Stats = Stats(1)
        self.analysis_boost.drop_rate = 1
        self.analysis_boost.critical_hit_rate = 1
        self.analysis_boost.critical_damage = 1
        self.analysis_boost.slashing_damage = 1
        self.analysis_boost.bludgeoning_damage = 1
        self.analysis_boost.piercing_damage = 1
        self.analysis_boost.projectile_damage = 1
        self.analysis_boost.poison_damage = 1
        self.analysis_boost.experience_gain = 1

    def print(self):
        return (f'ID: {self.id}, Name: {self.name}, Effects: {self.effects}, '
                f'Dungeon ID: {self.dungeon_id}, Floor: {self.floor}, Level: {self.lvl}, '
                f'HP: {self.hp}, Attack: {self.attack}, Minimum Damage: {self.minimum_damage}, Defense: {self.defense}, SPD: {self.spd}')

    def print_dungeon(self):
        return (
            f'[{self.floor}, {self.id}, {self.name}]'
        )


class Fountain:
    def __init__(self, is_level_up: bool = False, is_junkyard: bool = False):
        self.type: str = 'Fountain'
        self.amount: int = 1
        if is_junkyard:
            self.amount = 49

        self.stat: str = ''
        if is_level_up:
            self.stat = 'Level'
        else:
            self.amount += randint(1, 4)
            number = randint(1, 5)
            match number:
                case 1:
                    self.stat = 'HP'
                case 2:
                    self.stat = 'VIT'
                case 3:
                    self.stat = 'SPD'
                case 4:
                    self.stat = 'STR'
                case 5:
                    self.stat = 'LUK'


def generate_attack_defense_mod(player: Player) -> list[float]:
    attack_mod = (1 + (player.crit_damage * player.crit_rate)) * (1 + player.double_strike)
    defense_mod = 1 + player.dodge
    return [attack_mod, defense_mod]
