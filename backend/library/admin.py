from django.contrib import admin
from .models import Author, Category, Department, Book, Bookmark
from config.admin_site import librium_admin


@admin.register(Author, site=librium_admin)
class AuthorAdmin(admin.ModelAdmin):
    list_display  = ('name', 'nationality')
    search_fields = ('name', 'nationality')
    ordering      = ('name',)


@admin.register(Category, site=librium_admin)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ('name',)
    search_fields = ('name',)
    ordering      = ('name',)


@admin.register(Department, site=librium_admin)
class DepartmentAdmin(admin.ModelAdmin):
    list_display  = ('name',)
    search_fields = ('name',)
    ordering      = ('name',)


@admin.register(Book, site=librium_admin)
class BookAdmin(admin.ModelAdmin):
    list_display   = ('title', 'author', 'category', 'department', 'available', 'is_active', 'publication_year')
    list_filter    = ('available', 'is_active', 'category', 'department')
    search_fields  = ('title', 'isbn', 'author__name')
    ordering       = ('title',)
    readonly_fields = ('available',)


@admin.register(Bookmark, site=librium_admin)
class BookmarkAdmin(admin.ModelAdmin):
    list_display  = ('member', 'book', 'bookmarked_date')
    list_filter   = ('bookmarked_date',)
    search_fields = ('member__email', 'book__title')
    ordering      = ('-bookmarked_date',)