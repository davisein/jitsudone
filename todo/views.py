"""
Views for todo list

They are organized with first the HTML returning views
and then the API json views.
"""
from django.core import serializers
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import render
from restless.views import Endpoint
from restless.models import serialize
from restless.auth import login_required
from simple_rest import Resource

from todo.models import Item


# HTML views
def list_items(request):
    """
    List all tasks. If user is not logged in it will see an empty list
    """
    items = Item.objects.filter(user=request.user)
    return render(request, 'todo/list.html', {'items': items})


# API json views
class ItemAPI(Endpoint):
    """ API for Item based on Django-restless """
    def request_to_item(self, request, item):
        """
        Gets the relevant fields of request and saves them to item
        If they are not existing, item does not change in that field
        """
        if request.data.get('title'):
            item.title = request.data.get('title')
        if request.data.get('description'):
            item.description = request.data.get('description')
        if request.data.get('date'):
            item.date = request.data.get('date')
        if request.data.get('done'):
            item.done = request.data.get('done')

    @login_required
    def get(self, request):
        items = Item.objects.filter(user=request.user)
        #name = request.params.get('name', 'World')
        return serialize(items)

    @login_required
    def put(self, request, item_id):
        item = Item.objects.get(pk=item_id)
        if item.user != request.user:
            return HttpResponseForbidden()
        self.request_to_item(request, item)
        item.user = request.user
        item.save()
        return serialize(item)

    @login_required
    def post(self, request):
        item = Item()
        item.user = request.user
        self.request_to_item(request, item)
        item.save()
        return serialize(item)

    @login_required
    def delete(self, request, item_id):
        item = Item.objects.get(pk=item_id)
        if item.user != request.user:
            return HttpResponseForbidden()
        item.delete()
        return {}
