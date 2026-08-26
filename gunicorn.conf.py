# Gunicorn configuration file for Render deployment
import os

timeout = 180
graceful_timeout = 30
workers = 1
threads = 4
worker_class = "gthread"
keepalive = 5
