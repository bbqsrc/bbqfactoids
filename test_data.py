import pymongo

factoids = pymongo.Connection().factoids.factoids
config = pymongo.Connection().factoids.config

lorem = """Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras lorem lacus, vestibulum vitae faucibus in, euismod et lorem. In hac habitasse platea dictumst. Nulla facilisi."""

slugs = {
    "a-url": "First example.",
    "another-url": "Second example.",
    "best-url": "Third example.",
    "final-url": "Fourth example."
}

for k, v in slugs.items():
    factoids.insert({
        "slug": k,
        "content": v + lorem,
        "url": "http://brendan.so"
    })

config.insert({"id": "keys", "keys": list(slugs.keys())})
