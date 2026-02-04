import json
from typing import List


def read_csv(filename: str) -> list[list[str]]:
    """ read a simple csv file and return list of strings from file """
    data = []
    keywords = []
    with open(f'../json/{filename}', encoding='utf8') as csv:  # open file for reading, refer to it as csv
        for row in csv:  # read each row from file (row ends with \n line seperator
            fields = row.strip().split(',')  # split line on commas into list of str
            data.append(fields)  # add fields (list) to end of data list
            keywords.append(fields[0].replace('"','').replace("'","").strip())  # also record first word as keyword
            # note strip method removes leading and trailing spaces and newline characters
            # replace method replaces the first string with the second - used here to remove quotes
    return [data, keywords]  # return the nested list of data from the file


def add_translations(que: list[list[str]], translations: str):
    translation_data, keys = read_csv(translations)

    for file, checks in que:
        with open(f'../json/{file}.json', encoding='utf8') as f:
            data = json.load(f)
            data_list = data[file]
            for item in data_list:
                for check in checks:
                    if item[check] == "":
                        continue
                    found = False
                    for key, row in zip(keys, translation_data):
                        if key == item[check]:
                            item[check + '_EN'] = row[1]
                            found = True
                            break
                    if not found:
                        item[check + '_EN'] = item[check]
                        print(f'Couldn\'t find {check}: {item[check]} for {item["id"]} in {file}.json')

        final = {file: data_list}
        with open(f'../json/{file}_EN.json', 'w', encoding='utf8') as f:
            f.write(json.dumps(final, ensure_ascii=False, indent=2))


que = [
    ['customs', ['nameId', 'summaryId']],
    ['dungeons', ['nameId']],
    ['equips', ['nameId', 'set']],
    ['materials', ['nameId', 'efficacyId']],
    ['monsters', ['nameId']]
]

add_translations(que, 'langs.csv')
