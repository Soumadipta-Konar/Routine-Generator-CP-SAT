from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/schedules/', include('apps.schedules.urls')),
    path('api/v1/imports/', include('apps.imports.urls')),
]
