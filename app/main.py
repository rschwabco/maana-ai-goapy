# --- External imports
from ariadne.asgi import GraphQL
from ariadne import ObjectType, QueryType, gql, make_executable_schema
import numpy as np
import threading
import time
import json
import sys
import os
from asgi_lifespan import Lifespan, LifespanMiddleware
from app.goapy import World, Planner, Action_List

# --- GraphQL


# Map resolver functions to Query and Mutation fields
query = QueryType()

# Define types using Schema Definition Language (https://graphql.org/learn/schema/)
# Wrapping string in gql function provides validation and better error traceback
type_defs = gql("""

# Boilerplate
type Info {
  id: ID!
  name: String!
  description: String
}

type GoapVar {
  id: ID!
  val: Boolean!
}

type GoapAction {
  id: ID!
  pre: [GoapVar!]!
  post: [GoapVar!]!
}

type GoapScenario {
  id: ID!
  goal: [GoapVar!]!
  state: [GoapVar!]!
  actions: [GoapAction!]!
}

input GoapVarInput {
  id: ID!
  val: Boolean!
}

input GoapActionInput {
  id: ID!
  pre: [GoapVarInput!]!
  post: [GoapVarInput!]!
}

input GoapScenarioInput {
  id: ID!
  goal: [GoapVarInput!]!
  state: [GoapVarInput!]!
  actions: [GoapActionInput!]!
}

type Query {
  info: Info!
  plan(scenario: GoapScenarioInput!): [ID!]!
}

""")


def makeObject(vars):
    obj = {}
    for x in vars:
        obj[x["id"]] = x["val"]
    return obj


def plan(scenario):

    keys = [x["id"] for x in scenario["state"]]
    _world = Planner(*keys)

    initial_state = makeObject(scenario["state"])
    _world.set_start_state(**initial_state)

    goal_state = makeObject(scenario["goal"])
    _world.set_goal_state(**goal_state)

    _actions = Action_List()

    for action in scenario["actions"]:
        name = action["id"]
        pre = makeObject(action["pre"])
        post = makeObject(action["post"])
        _actions.add_condition(name, **pre)
        _actions.add_reaction(name, **post)
    _world.set_action_list(_actions)

    _t = time.time()
    _path = _world.calculate()
    _took_time = time.time() - _t

    plan = [p["name"] for p in _path]

    print('\nTook:', _took_time)

    return plan


def info():
    return {
        'id': "maana-ai-goap",
        'name': "Goal-Oriented Action Planning in Python",
        'description': ""
    }

# Resolvers are simple python functions
@query.field("info")
def resolve_info(*_):
    return info()


@query.field("plan")
def resolve_plan(*_, scenario):
    return plan(scenario)


# Create executable GraphQL schema
schema = make_executable_schema(type_defs, [query])

# --- ASGI app

# 'Lifespan' is a standalone ASGI app.
# It implements the lifespan protocol,
# and allows registering lifespan event handlers.
lifespan = Lifespan()


@lifespan.on_event("startup")
async def startup():
    print("Starting up...")
    print("... done!")


@lifespan.on_event("shutdown")
async def shutdown():
    print("Shutting down...")
    print("... done!")

# Create an ASGI app using the schema, running in debug mode
app = GraphQL(schema, debug=True)

# 'LifespanMiddleware' returns an ASGI app.
# It forwards lifespan requests to 'lifespan',
# and anything else goes to 'app'.
app = LifespanMiddleware(app, lifespan=lifespan)
