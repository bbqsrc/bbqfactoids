import csv
import sys
import pymongo

factoids = pymongo.Connection().factoids.factoids
config = pymongo.Connection().factoids.config

factoids.remove()
config.remove()

slugs = []

for line in csv.reader(open(sys.argv[1])):
    factoids.insert({
        "content": line[0],
        "slug": line[1],
        "source_text": line[2],
        "source_url": line[3],
        "more_content": line[4],
        "button_text": line[5],
        "button_url": line[6]
    }, safe=True)
    slugs.append(line[1])


config.insert({"id": "keys", "keys": slugs}, safe=True)
