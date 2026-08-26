import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .parser import run_ingestion_pipeline

class MasterWorkbookImportView(APIView):
    """
    POST /api/v1/imports/master-workbook/
    Accepts multipart/form-data with an Excel file ('file') and populates the database.
    """
    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "No file uploaded. Please provide a 'file' key in form-data."}, status=status.HTTP_400_BAD_REQUEST)
        
        excel_file = request.FILES['file']
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            return Response({"error": "Invalid file format. Only Excel (.xlsx, .xls) files are supported."}, status=status.HTTP_400_BAD_REQUEST)

        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            for chunk in excel_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            results = run_ingestion_pipeline(tmp_path)
            return Response({
                "success": True,
                "message": "Master workbook successfully parsed and database populated.",
                "details": results
            }, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"error": "VALIDATION_ERROR", "details": str(ve)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as e:
            return Response({"error": "SERVER_ERROR", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
