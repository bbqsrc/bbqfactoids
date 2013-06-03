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
        "content": line[0].strip(),
        "slug": line[1].strip().lower(),
        "source_text": line[2].strip(),
        "source_url": line[3].strip(),
        "more_content": line[4].strip()
    }, safe=True)
    slugs.append(line[1].strip())


config.insert({"id": "keys", "keys": slugs}, safe=True)
