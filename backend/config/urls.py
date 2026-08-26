from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import sys
from io import StringIO
import traceback

def health_check(request):
    import subprocess
    import traceback
    try:
        result = subprocess.run(["python", "init_db.py"], capture_output=True, text=True)
        status_msg = "healthy"
        init_output = result.stdout + "\n" + result.stderr
    except Exception as e:
        status_msg = "error"
        init_output = traceback.format_exc()
        
    return JsonResponse({
        "status": status_msg,
        "service": "Routine Generator API",
        "init_output": init_output,
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

