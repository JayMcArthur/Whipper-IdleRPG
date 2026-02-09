from math import ceil
from copy import deepcopy
import json
import csv

translations = {}
material_list = {}
monster_list = {}
equip_list = {}
custom_list = {}
enchantment_list = {}
dungeon_list = {}
constants_list = {
    'MAX_JUNKYARD_BOSS_LVL': 10,
    'THE_LOST_NATIONS_MAGNIFYING_GLASS_ANALYSIS_BOOST': 5,
    'PANOPTES_EYE_ANALYSIS_BOOST': 1
    # Corrosion limit (?) > Killing Stone(500)
    # Enchantment Level (?) > Ancient Blacksmith's Hammer - Increases Enchantment level limit to 30. Complete M0 Magic Castle of the End
    # Misima Level (0) > Necklace of Mist - Unlocks M1. Complete M0 Magic Castle of the End
    # Misima Level (2-5) > Core Fragment - Unlocks M2-5. Complete M1 Magic Castle of the End
    # Misima Level (6-100?) > Origin Core - Unlocks M6+. Complete M2-5 Magic Castle of the End to assemble 4 Origin Core Shards
}

level_list = {}

base_path = "../data/"

# This generates all the data to use from the files provide by the game
def make_lists():
    # Make Translations
    with open(base_path + 'langs.csv', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            translations[row['str']] = row

    # Make Materials
    with open(base_path + 'materials.json', encoding='utf-8') as f:
        data = json.load(f)
        for material in data['materials']:
            material['name'] = translate_key(material['nameId'])
            material['efficacy'] = translate_key(material['efficacyId'])
            material_list[material["id"]] = material

    # Base 10, 5 for The Lost Nation's Magnifying Glass (Complete M0 Magic Castle of the End). 10 for Panoptes' Eye (Killing Panoptes)
    constants_list['MAX_ANALYSIS_LEVEL'] = 10 + constants_list['THE_LOST_NATIONS_MAGNIFYING_GLASS_ANALYSIS_BOOST'] + (constants_list['MAX_JUNKYARD_BOSS_LVL'] * constants_list['PANOPTES_EYE_ANALYSIS_BOOST'])

    # Make Monster List
    with open(base_path + 'monsters.json', encoding='utf8') as f:
        data = json.load(f)
        for monster in data['monsters']:
            monster['name'] = translate_key(monster['nameId']) # Translate name
            monster['encounter_level'] = {
                'min': [],
                'max': [],
                'avg': [],
            }
            monster['effects'] = []
            # Add in custom monster effects
            if monster['id'] == 132:
                monster['effects'] = [961]
            if monster['id'] == 133:
                monster['effects'] = [961]*3
            monster_list[monster["id"]] = monster

    # Make Equip List
    with open(base_path + 'equips.json', encoding='utf8') as f:
        data = json.load(f)
        for item in data['equips']:
            # Translate name and set (set is moved to setId)
            item['name'] = translate_key(item['nameId'])
            item['setId'] = item['set']
            item['set'] = translate_key(item['setId'])
            equip_list[item["id"]] = item

    # Make Custom List
    with open(base_path + 'customs.json', encoding='utf8') as f:
        data = json.load(f)
        for custom in data['customs']:
            # translate name and summary
            custom['name'] = translate_key(custom['nameId'])
            custom['summary'] = translate_key(custom['summaryId'])
            custom_list[custom["id"]] = custom

        # Generate enchantment chains
        for id, custom in custom_list.items():
            if custom['nameId'] not in enchantment_list.keys():
                enchantment_list[custom['nameId']] = [custom['id']]
            else:
                enchantment_list[custom['nameId']].append(custom['id'])

    # Make Dungeon List
    with open(base_path + 'dungeons.json', encoding='utf8') as f:
        data = json.load(f)
        # Reduce max floor to make them work
        data['dungeons'][10]["maxFloor"] = 50
        data['dungeons'][11]["maxFloor"] = 0
        data['dungeons'][12]["maxFloor"] = 0
        # Fix Royal Tomb so it has floors
        temp = {}
        for i in range(1, 51):
            temp[f'{i}'] = data['dungeons'][10]["monsters"][f'{ceil(i/10)}']
        # Fix Alchemist Island so it has something
        data['dungeons'][10]["monsters"]["1"] = [1]
        data['dungeons'][10]["monsters"]["2"] = [1]
        data['dungeons'][10]["monsters"]["3"] = [1]
        # Add In Royal Tombs withs bosses
        data['dungeons'][10]["monsters"] = temp
        data['dungeons'][10]["id"] = 121  # Change ID to 12.1, 12.2, 12.3
        data['dungeons'].append(deepcopy(data['dungeons'][10]))
        data['dungeons'][-1]["id"] = 122
        data['dungeons'][-1]["nameId"] += ' Anubis'
        data['dungeons'].append(deepcopy(data['dungeons'][10]))
        data['dungeons'][-1]["id"] = 123
        data['dungeons'][-1]["nameId"] += ' Necronomicon'

        for dungeon in data['dungeons']:
            dungeon['name'] = translate_key(dungeon['nameId']) # translate name
            dungeon["boss"] = True if dungeon["id"] in [7, 9, 10, 122, 123, 13] else False
            if dungeon["id"] == 7:
                boss_id = 108
            elif dungeon["id"] == 9:
                boss_id = 109
            elif dungeon["id"] == 10:
                boss_id = 129
            elif dungeon["id"] == 122:
                boss_id = 133
            elif dungeon["id"] == 123:
                boss_id = 134
            elif dungeon["id"] == 13:
                boss_id = 200
            else:
                boss_id = 0
            if dungeon["boss"]:
                dungeon['monsters'][f'{dungeon["maxFloor"] + 1}'] = [boss_id]
            dungeon_list[dungeon["id"]] = dungeon

        # Create Random Dungeons
        for d_id in range(60):
            dungeon = {'condition': 0, 'modLv': 8, 'id': 16 + d_id}
            front = d_id // 20  # Makes 3 different fronts
            behind = (d_id % 20) // 5  # Makes 4 different behinds
            dungeon['maxFloor'] = 14 + 10  # Only using max floor config but 0 - 14 are valid
            dungeon['minutesPerFloor'] = 15 + 5  # Only using max time config but 0 - 15 are valid
            monster_pos = ((d_id % 20) % 5) + 1  # Makes 5 different starting pos
            behind_words = ['The Canyon', 'The Fortress', 'The Mausoleum', 'The Ancient Citadel']
            dungeon['nameId'] = behind_words[behind]
            monster_pos += 10 + 5 * behind

            front_words = ['of Courage', 'of Judgment', 'of Wisdom']
            dungeon['nameId'] += ' ' + front_words[front]
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
            if dungeon['nameId'] == 'The Ancient Citadel of Wisdom' and dungeon['maxFloor'] > 20:
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



def print_enchantments() -> None:
    for key in enchantment_list.keys():
        best = enchantment_list[key][-1]
        print(f'# {best:_>5} - {custom_list[best]["name"]}{" " + str(custom_list[best]["dispLv"]) if custom_list[best]["dispLv"] > 1 else ""}: {custom_list[best]["summary"].replace("{value}", str(custom_list[best]["value"]))}')

def print_materials() -> None:
    for key in material_list.keys():
        material = material_list[key]
        print(f'# {str(material["id"]):_>4} - {material["name"]: <49} - Use:{str(material["use"]):_>3} - {material["efficacy"]}')


def translate_key(key: str, lang: str = 'en_US') -> str:
    try:
        return translations[key][lang]
    except KeyError:
        return key

# Returns level based on xp
def exp_to_level(exp: int) -> int:
    required = 10
    level = 1
    while True:
        exp -= required
        if exp <= 0:
            return level
        required += 10
        level += 1
