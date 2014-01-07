"""
Model for lists of tasks to do
Items save the information.
"""
from django.db import models
from django.contrib import admin
from django.contrib.auth.models import User


class Item(models.Model):
    """
    Item in the To Do list
    """
    title = models.CharField(max_length=200)
    description = models.CharField()
    date = models.DateTimeField('date published')
    created_at = models.DateTimeField('date created', auto_now_add=True)
    done = models.BooleanField(default=False)
    user = models.OneToOneField(User)


#class ItemAdmin(admin.ModelAdmin):
    #""" Configure for the administration interface"""
    #list_display = ["title", "date", "state", "created_at"]
    #search_fields = ["title", "date", "state"]

#admin.site.register(Item, ItemAdmin)
admin.site.register(Item)
