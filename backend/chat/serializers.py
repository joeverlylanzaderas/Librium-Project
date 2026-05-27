from rest_framework import serializers
from .models import KnowledgeBase, ChatMessage


# ─────────────────────────────────────────────
#  KNOWLEDGE BASE
# ─────────────────────────────────────────────

class KnowledgeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = KnowledgeBase
        fields = '__all__'


# ─────────────────────────────────────────────
#  CHAT MESSAGE
# ─────────────────────────────────────────────

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatMessage
        fields = '__all__'