from math import floor

from json_to_python import monster_list, equip_list, custom_list, exp_to_level


# This is the defaults of items
UPGRADE_MAX = 20000
ANALYSIS_MAX = 15
CORROSION_MAX = 999


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
        self.attack: int = 0
        self.defense: int = 0
        self.current_hp: int = 0
        self.id: int = 0
        self.lvl: int = 1
        self.xp: int = 0

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

    def apply_enchantment(self, w_enchant: list[int], a_enchant: list[int], r_enchant: list[int], ):
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
        self.current_hp = self.hp

    def gain_xp(self, xp: int):
        self.xp += xp
        level = exp_to_level(self.xp)
        if level != self.lvl:
            self.apply_level(level)


class Monster(Stats):
    # See ./Dart_Code for Miasma Effect and Monster Generator
    # Thanks to Haap for dart code
    def __init__(self, monster_id: int, dungeon_id: int, dungeon_floor: int, dungeon_name: str = '', is_royal_tomb: bool = False, miasma_level: int = 5):
        super().__init__()
        self.id: int = monster_id
        self.name: str = monster_list[monster_id]['nameId_EN']
        self.xp: int = monster_list[monster_id]['exp']
        self.effects: list[int] = monster_list[monster_id]['effects']
        self.dungeon_id: int = dungeon_id
        self.floor: int = dungeon_floor

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
        if "砦" in dungeon_name:
            dungeon_bias = 2
        elif "霊廟" in dungeon_name:
            dungeon_bias = 4
        elif "古城" in dungeon_name:
            dungeon_bias = 8

        base_param = (((500 * round(1 + dungeon_id / 4)) + (100 * dungeon_id)) + min(2500 * (miasma_level - 1), 10000))
        more_percent = (10 + (dungeon_id * 2) + dungeon_bias) * miasma_level

        if is_royal_tomb and dungeon_floor % 100 == 0:
            base_param_prev = (((500 * round(1 + dungeon_id / 4)) + (100 * dungeon_id)) + min(2500 * (miasma_level - 2), 10000))
            more_percent_prev = (10 + (dungeon_id * 2) + dungeon_bias) * (miasma_level - 1)
            base_param = (base_param + base_param_prev) // 2
            more_percent = (more_percent + more_percent_prev) // 2

        #############################
        # Back to Monster Generator #
        #############################

        # If there is Miasma, The enemy gets 3% stronger every 4 floors
        more_percent = more_percent + (f // 4) * (3 + miasma_level)
        if miasma_level == 0:
            more_percent = 0

        # Change in strength according to the level of miasma
        self.hp = floor((monster_list[monster_id]['hp'] + base_param) * ((more_percent * 2 + 100) / 100))
        if monster_id == 131:
            self.attack = monster_list[monster_id]['atk'] * (miasma_level ** 2)
        else:
            self.attack = floor((monster_list[monster_id]['atk'] + base_param) * ((more_percent + 100) / 100))
        self.defense = floor((monster_list[monster_id]['def'] + base_param) * ((more_percent + 100) / 100))
        self.spd = floor(monster_list[monster_id]['spd'] * ((more_percent + 100) / 100))
        self.current_hp = self.hp

    def print(self):
        return (f'ID: {self.id}, Name: {self.name}, Effects: {self.effects}, '
                f'Dungeon ID: {self.dungeon_id}, Floor: {self.floor}, Level: {self.lvl}, '
                f'HP: {self.hp}, Attack: {self.attack}, Defense: {self.defense}, SPD: {self.spd}')


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
    defense_mod = 1 + (0.20 * (806 in player.effects) * seven_blessings)  # 1, 1.2, 1.4
    return [attack_mod, defense_mod]
