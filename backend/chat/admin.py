from django.contrib import admin
from .models import KnowledgeBase, ChatMessage
from config.admin_site import librium_admin


@admin.register(KnowledgeBase, site=librium_admin)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display  = ('title', 'created_at')
    search_fields = ('title', 'text_content')
    ordering      = ('-created_at',)


@admin.register(ChatMessage, site=librium_admin)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display  = ('role', 'user', 'session_id', 'created_at')
    list_filter   = ('role',)
    search_fields = ('user__email', 'session_id', 'message')
    ordering      = ('-created_at',)
    readonly_fields = ('role', 'message', 'session_id', 'user', 'created_at')