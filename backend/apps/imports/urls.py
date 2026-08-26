from django.urls import path
from .views import MasterWorkbookImportView

urlpatterns = [
    path('master-workbook/', MasterWorkbookImportView.as_view(), name='master-workbook-import'),
]
