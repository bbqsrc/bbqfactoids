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
            self.set_status(404)
            factoid = {"error": "No factoid found with that URL."}
        else:
            factoid['error'] = None

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
            factoid = {"error": "No factoid found with that URL."}
        else:
            factoid['error'] = None

        if datatype == "json":
            self.set_header("Content-Type", 'application/json')
            self.write(dumps(factoid))
        else:
            self.render("templates/index.html", **factoid)


class AllFactoidHandler(tornado.web.RequestHandler):
    def get(self, datatype=None):
        factoids = {
            "factoids": list(self.application.factoids_collection.find())
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
    
        (r"/", RandomFactoidHandler),
        (r"/random(?:\.(.+))?", RandomFactoidHandler),
        (r"/all(?:\.(.+))?", AllFactoidHandler),
        (r"/(.+?)(?:\.(.+))?", FactoidHandler),
    ])
    
    '''
        (r"/admin", AdminHandler),
        (r"/admin/users", AdminUserHandler),
        (r"/admin/factoids", AdminFactoidHandler)
        '''
    
    application.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
