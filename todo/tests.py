"""
"""
from django.test import Client
from django.test import TestCase
from todo.views import show_json

class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)

class TodoTest(TestCase):
    def test_show_json():
        pass
