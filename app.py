import random

import pymongo
import tornado.web
import tornado.options
import tornado.ioloop
import logging

from bson.json_util import dumps
from tornado.options import define, options
from tornado.web import StaticFileHandler, HTTPError

define("port", default=8888)


class Application(tornado.web.Application):
    def __init__(self, handlers, **settings):
        tornado.web.Application.__init__(self, handlers, **settings)
        self.config_collection = pymongo.Connection().factoids.config
        self.factoids_collection = pymongo.Connection().factoids.factoids


def get_factoid(factoids_collection, slug=None, keys=None):
    if slug is None:
        count = factoids_collection.count()
        k = random.randint(0, count-1)
        slug = keys[k]

    factoid = factoids_collection.find_one({"slug": slug})
    if factoid is not None:
        del factoid['_id']
    logging.debug("Factoid: %r" % factoid)
    return factoid


class RandomFactoidHandler(tornado.web.RequestHandler):
    def get(self, datatype=None):
        keys = self.application.config_collection.find_one({"id": "keys"})['keys']
        factoid = get_factoid(self.application.factoids_collection, keys=keys)

        if factoid is None:
            self.get(datatype)
            return
        factoid['error'] = None

        # No caching!
        self.set_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.set_header("Pragma", "no-cache")
        self.set_header("Expires", "0")

        if datatype == "json":
            self.set_header("Content-Type", 'application/json')
            self.write(dumps(factoid))
        else:
            self.render("templates/index.html", **factoid)


class FactoidHandler(tornado.web.RequestHandler):
    def get(self, slug, datatype=None):
        factoid = get_factoid(self.application.factoids_collection, slug)

        if factoid is None:
            self.set_status(404)
            factoid = {
                 "slug": slug,
                 "error": "No factoid found with that URL."
            }
        else:
            factoid['error'] = None

        if datatype == "json":
            self.set_header("Content-Type", 'application/json')
            self.write(dumps(factoid))
        else:
            self.render("templates/index.html", **factoid)


class AllFactoidHandler(tornado.web.RequestHandler):
    def get(self, datatype=None):
        x = list(self.application.factoids_collection.find())
        for i in x:
            del i['_id']

        factoids = {
            "factoids": x
        }

        if datatype == "json":
            self.set_header("Content-Type", 'application/json')
            self.write(dumps(factoids))
        else:
            self.render("templates/all.html", **factoids)


if __name__ == "__main__":
    tornado.options.parse_command_line()

    application = Application([
        (r"/static/(.*)", StaticFileHandler, {"path": "./static"}),
        (r"/random(?:\.(json))?", RandomFactoidHandler),
        (r"/all(?:\.(json))?", AllFactoidHandler),
        (r"/", RandomFactoidHandler),
        (r"/([^\.]+?)(?:\.(json))?", FactoidHandler),
    ])
    
    '''
        (r"/admin", AdminHandler),
        (r"/admin/users", AdminUserHandler),
        (r"/admin/factoids", AdminFactoidHandler)
        '''
    
    application.listen(options.port, xheaders=True)
    tornado.ioloop.IOLoop.instance().start()
