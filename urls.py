from django.conf.urls.defaults import *
from django.contrib import admin
import dbindexer

handler500 = 'djangotoolbox.errorviews.server_error'

# django admin
admin.autodiscover()

# search for dbindexes.py in all INSTALLED_APPS and load them
dbindexer.autodiscover()

urlpatterns = patterns(
    '',
    ('^_ah/warmup$', 'djangoappengine.views.warmup'),
    (r'^accounts/', include('registration.backends.default.urls')),
    #(r'^accounts/', include('registration.backends.simple.urls')),
    ('^$', 'django.views.generic.simple.direct_to_template', {'template': 'home.html'}),
    (r'^todo/', include('todo.urls')),
    ('^admin/', include(admin.site.urls)),
)
