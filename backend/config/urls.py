from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "online",
        "service": "Routine Generator API",
        "endpoints": {
            "schedules": "/api/v1/schedules/",
            "imports": "/api/v1/imports/",
            "admin": "/admin/"
        }
    })

urlpatterns = [
    path('', health_check, name='root-health'),
    path('admin/', admin.site.urls),
    path('api/v1/schedules/', include('apps.schedules.urls')),
    path('api/v1/imports/', include('apps.imports.urls')),
]

