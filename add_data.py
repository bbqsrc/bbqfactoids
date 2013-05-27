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
        "content": "<p>%s</p>" % "</p><p>".join(line[0].split('\n')),
        "slug": line[1],
        "source_text": line[2],
        "source_url": line[3],
        "more_content": "<p>%s</p>" % "</p><p>".join(line[4].split('\n')),
        "button_text": line[5],
        "button_url": line[6]
    }, safe=True)
    slugs.append(line[1])


config.insert({"id": "keys", "keys": slugs}, safe=True)
