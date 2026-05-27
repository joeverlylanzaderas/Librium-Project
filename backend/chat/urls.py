from django.urls import path
from . import views

urlpatterns = [

    # ── Chatbot ───────────────────────────────────────────────
    path('', views.ChatbotAPIView.as_view(), name='chatbot'),

    # ── Knowledge Base ────────────────────────────────────────
    path('knowledge/', views.KnowledgeBaseView.as_view(), name='knowledge-base'),
]