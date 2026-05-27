# library/serializers.py
from rest_framework import serializers
from .models import Author, Category, Department, Book, Bookmark


# ─────────────────────────────────────────────
#  CATEGORY
# ─────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['id', 'name', 'description']


# ─────────────────────────────────────────────
#  AUTHOR
# ─────────────────────────────────────────────

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Author
        fields = ['id', 'name', 'biography', 'nationality']


# ─────────────────────────────────────────────
#  DEPARTMENT
# ─────────────────────────────────────────────

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Department
        fields = ['id', 'name', 'description']


# ─────────────────────────────────────────────
#  BOOK
# ─────────────────────────────────────────────

class BookSerializer(serializers.ModelSerializer):
    is_bookmarked   = serializers.SerializerMethodField()
    author_name     = serializers.CharField(source='author.name',     read_only=True)
    category_name   = serializers.CharField(source='category.name',   read_only=True, default=None)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)

    class Meta:
        model  = Book
        fields = [
            'id', 'title', 'isbn', 'publication_year',
            'author', 'author_name',
            'category', 'category_name',
            'department', 'department_name',
            'available', 'is_active',
            'cover_image',
            'description',
            'is_bookmarked',
        ]
        read_only_fields = ['is_active']

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        try:
            bookmarks = obj.bookmarks.all()
            return any(bm.member_id == request.user.id for bm in bookmarks)
        except Exception:
            return Bookmark.objects.filter(
                member=request.user, book=obj
            ).exists()


# ─────────────────────────────────────────────
#  BOOKMARK
# ─────────────────────────────────────────────

class BookmarkSerializer(serializers.ModelSerializer):
    member     = serializers.PrimaryKeyRelatedField(read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_cover = serializers.SerializerMethodField()

    class Meta:
        model  = Bookmark
        fields = ['id', 'member', 'book', 'book_title', 'book_cover', 'bookmarked_date']

    def get_book_cover(self, obj):
        if not obj.book or not obj.book.cover_image:
            return None
        url = str(obj.book.cover_image)
        return url.replace('/upload/', '/upload/f_auto,w_200/')

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required to bookmark books.")
        validated_data['member'] = request.user
        return super().create(validated_data)