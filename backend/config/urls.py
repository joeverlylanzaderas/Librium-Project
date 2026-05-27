# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from config.admin_site import librium_admin
from config.activation_view import ActivateAccountView
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        'message': 'Librium API is running',
        'endpoints': {
            'admin':       '/admin/',
            'auth':        '/api/auth/',
            'users':       '/api/users/',
            'library':     '/api/library/',
            'circulation': '/api/circulation/',
            'chat':        '/api/chat/',
        }
    })


urlpatterns = [
    path('', api_root, name='api-root'),

    # ── Admin ──────────────────────────────────────────────────
    path('admin/', librium_admin.urls),

    # ── Auth ───────────────────────────────────────────────────
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('activate/<str:uid>/<str:token>/', ActivateAccountView.as_view(), name='activate'),

    # ── User management ────────────────────────────────────────
    path('api/users/', include('user.urls')),

    # ── Library (catalog) ──────────────────────────────────────
    path('api/library/', include('library.urls')),

    # ── Circulation (borrowing lifecycle) ──────────────────────
    path('api/circulation/', include('circulation.urls')),

    # ── Chat (AI assistant) ────────────────────────────────────
    path('api/chat/', include('chat.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL,  document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL,   document_root=settings.MEDIA_ROOT)