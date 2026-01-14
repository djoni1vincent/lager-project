import os
import unittest
import sys

# Add the parent directory to the path so we can import the server
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.server import app

class BasicTests(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_root_status_code(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 404)

    def test_items_route(self):
        response = self.app.get('/items')
        self.assertEqual(response.status_code, 200)

    def test_users_route(self):
        response = self.app.get('/users')
        self.assertEqual(response.status_code, 200)

    def test_admin_users_route_unauthorized(self):
        response = self.app.get('/admin/users')
        self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()
