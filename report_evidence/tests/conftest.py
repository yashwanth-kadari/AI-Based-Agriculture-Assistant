import sys
import os
import pytest
import httpx

# Ensure backend is in python path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import app as flask_app


@pytest.fixture(scope="session", autouse=True)
def configure_wsgi_transport():
    """
    Automatically routes all httpx calls to the Flask application in-memory via WSGITransport.
    Allows all test suites to execute against the real database and real Flask endpoints
    without needing a separate background process.
    """
    transport = httpx.WSGITransport(app=flask_app)
    original_client_init = httpx.Client.__init__

    def patched_client_init(self, *args, **kwargs):
        if 'transport' not in kwargs and 'mounts' not in kwargs:
            kwargs['transport'] = transport
        original_client_init(self, *args, **kwargs)

    httpx.Client.__init__ = patched_client_init
    yield
    httpx.Client.__init__ = original_client_init
