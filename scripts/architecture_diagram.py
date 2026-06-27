"""Regenerates .github/assets/architecture.png.

Not part of the app -- a one-off documentation tool. Run with:
    pip install diagrams && python3 scripts/architecture_diagram.py
(requires graphviz: `brew install graphviz` / `apt install graphviz`)
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.client import Client
from diagrams.onprem.database import Mongodb
from diagrams.programming.framework import React
from diagrams.programming.language import Nodejs

graph_attr = {"fontsize": "14", "bgcolor": "white", "pad": "0.4", "nodesep": "0.7", "ranksep": "1.0"}

with Diagram(
    "TaskForge Architecture",
    filename=".github/assets/architecture",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
):
    browser = Client("browser")

    with Cluster("frontend (nginx)"):
        spa = React("React + TS SPA\n(Vite build)")

    with Cluster("backend (Express + TS)"):
        api = Nodejs("REST API")
        auth = Nodejs("auth + OTP\n(JWT, bcrypt)")
        projects = Nodejs("projects + tasks\n(membership checks)")
        api >> auth
        api >> projects

    mongo = Mongodb("MongoDB\n(users, projects,\ntasks, OTP tokens\nwith TTL index)")
    mailer = Client("SMTP\n(or console-fallback\nin dev/CI)")

    browser >> Edge(label="static assets") >> spa
    browser >> Edge(label="fetch() + JWT") >> api
    auth >> Edge(label="send OTP") >> mailer
    auth >> mongo
    projects >> mongo
