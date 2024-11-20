from math import ceil
from copy import deepcopy
import json


monster_list = {}
equip_list = {}
custom_list = {}
enchantment_list = {}
dungeon_list = {}
level_list = {}


# This generates all the data to use from the json files provide by the game
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
            monster['effects'] = []
            # Add in custom monster effects
            if monster['id'] == 132:
                monster['effects'] = [961]
            if monster['id'] == 133:
                monster['effects'] = [961]*3
            monster_list[monster["id"]] = monster

    # Make Equip List
    with open('../json/equips_EN.json', encoding='utf8') as f:
        data = json.load(f)
        for item in data['equips']:
            equip_list[item["id"]] = item

    # Make Custom List
    with open('../json/customs_EN.json', encoding='utf8') as f:
        data = json.load(f)
        for custom in data['customs']:
            custom_list[custom["id"]] = custom

        # Generate enchantment chains
        for id, custom in custom_list.items():
            if custom['nameId_EN'] not in enchantment_list.keys():
                enchantment_list[custom['nameId_EN']] = [custom['id']]
            else:
                enchantment_list[custom['nameId_EN']].append(custom['id'])

    # Make Dungeon List
    with open('../json/dungeons_EN.json', encoding='utf8') as f:
        data = json.load(f)
        # Reduce max floor to make them work
        data['dungeons'][10]["maxFloor"] = 50
        data['dungeons'][11]["maxFloor"] = 0
        # Fix Royal Tomb so it has floors
        temp = {}
        for i in range(1, 51):
            temp[f'{i}'] = data['dungeons'][10]["monsters"][f'{ceil(i/10)}']
        # Add In Royal Tombs withs bosses
        data['dungeons'][10]["monsters"] = temp
        data['dungeons'][10]["id"] = 121  # Change ID to 12.1, 12.2, 12.3
        data['dungeons'].append(deepcopy(data['dungeons'][10]))
        data['dungeons'][-1]["id"] = 122
        data['dungeons'][-1]["nameId_EN"] += ' Anubis'
        data['dungeons'].append(deepcopy(data['dungeons'][10]))
        data['dungeons'][-1]["id"] = 123
        data['dungeons'][-1]["nameId_EN"] += ' Necronomicon'

        for dungeon in data['dungeons']:
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


def print_enchantments():
    for key in enchantment_list.keys():
        best = enchantment_list[key][-1]
        print(f'# {best:_>4} - {custom_list[best]["nameId_EN"]}{" " + str(custom_list[best]["dispLv"]) if custom_list[best]["dispLv"] > 1 else ""}: {custom_list[best]["summaryId_EN"].replace("{value}", str(custom_list[best]["value"]))}')


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
