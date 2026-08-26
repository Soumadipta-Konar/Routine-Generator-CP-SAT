from django.urls import path
from .views import MasterWorkbookImportView, TemplateDownloadView

urlpatterns = [
    path('master-workbook/', MasterWorkbookImportView.as_view(), name='master-workbook-import'),
    path('download-template/', TemplateDownloadView.as_view(), name='download-template'),
]

