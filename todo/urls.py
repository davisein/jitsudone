
from django.conf.urls import patterns, url
from todo.views import ItemAPI


urlpatterns = patterns(
    '',
    # User pages routes
    url(r'^$', 'todo.views.list_items'),
    # API routes
    url(r'^api/$', ItemAPI.as_view()),
    url(r'^api/(?P<item_id>\d+)$', ItemAPI.as_view()),
    #url(r'^api/\d', 'todo.views.details'),
    #url(r'^api/\d/change', 'todo.views.change'),
)
