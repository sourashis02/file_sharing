from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.FileUploadAPIView.as_view()),
    path('list/', views.FileListAPIView.as_view()),
    path('download/<str:id>/', views.FileDownloadAPIView.as_view()),
]