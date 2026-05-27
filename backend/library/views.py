# library/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Prefetch, Sum
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model

from .models import Author, Category, Department, Book, Bookmark
from .serializers import (
    AuthorSerializer, CategorySerializer, DepartmentSerializer,
    BookSerializer, BookmarkSerializer,
)
from .permissions import IsAdminOrLibrarian

User = get_user_model()


# ─────────────────────────────────────────────
#  CATEGORY
# ─────────────────────────────────────────────

class CategoryListCreateAPIView(generics.ListCreateAPIView):
    queryset         = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrLibrarian()]


class CategoryRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrLibrarian()]


# ─────────────────────────────────────────────
#  AUTHOR
# ─────────────────────────────────────────────

class AuthorListCreateAPIView(generics.ListCreateAPIView):
    queryset         = Author.objects.all()
    serializer_class = AuthorSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrLibrarian()]


class AuthorRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Author.objects.all()
    serializer_class = AuthorSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrLibrarian()]


# ─────────────────────────────────────────────
#  DEPARTMENT
# ─────────────────────────────────────────────

class DepartmentListCreateAPIView(generics.ListCreateAPIView):
    queryset         = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]


class DepartmentRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]


# ─────────────────────────────────────────────
#  BOOKMARK
# ─────────────────────────────────────────────

class BookmarkListCreateAPIView(generics.ListCreateAPIView):
    serializer_class   = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(
            member=self.request.user
        ).select_related('book')


class BookmarkDestroyAPIView(generics.DestroyAPIView):
    serializer_class   = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(member=self.request.user)


# ─────────────────────────────────────────────
#  BOOK
# ─────────────────────────────────────────────

class BookListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    parser_classes   = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrLibrarian()]

    def get_queryset(self):
        include_inactive = (
            self.request.query_params.get('include_inactive', 'false').lower() == 'true'
        )

        queryset = Book.objects.select_related('author', 'category', 'department')

        if not include_inactive or not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)

        if self.request.user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch('bookmarks', Bookmark.objects.filter(member=self.request.user))
            )
        else:
            queryset = queryset.prefetch_related(
                Prefetch('bookmarks', Bookmark.objects.none())
            )

        author_id   = self.request.query_params.get('author')
        category_id = self.request.query_params.get('category')
        dept_id     = self.request.query_params.get('department')
        available   = self.request.query_params.get('available')
        search      = self.request.query_params.get('search')
        is_active   = self.request.query_params.get('is_active')

        if author_id:
            queryset = queryset.filter(author_id=author_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if dept_id:
            queryset = queryset.filter(department_id=dept_id)
        if available is not None:
            queryset = queryset.filter(available=available.lower() == 'true')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset

    def get_serializer_context(self):
        return {'request': self.request}


class BookRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookSerializer
    parser_classes   = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if self.request.method == 'GET' and not self.request.user.is_staff:
            queryset = Book.objects.filter(
                is_active=True
            ).select_related('author', 'category', 'department')
        else:
            queryset = Book.objects.all().select_related('author', 'category', 'department')

        if self.request.user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch('bookmarks', Bookmark.objects.filter(member=self.request.user))
            )
        else:
            queryset = queryset.prefetch_related(
                Prefetch('bookmarks', Bookmark.objects.none())
            )
        return queryset

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrLibrarian()]

    def get_serializer_context(self):
        return {'request': self.request}

    def update(self, request, *args, **kwargs):
        partial  = kwargs.pop('partial', False)
        instance = self.get_object()

        if request.content_type and 'application/json' in request.content_type:
            data = request.data
        else:
            data = request.data.copy()
            if 'cover_image' in data and not request.FILES.get('cover_image'):
                val = data.get('cover_image')
                if val in [None, '', 'null']:
                    del data['cover_image']

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        book = self.get_object()

        # Import here to avoid circular imports
        from circulation.models import Loan

        active = Loan.objects.filter(
            book=book
        ).exclude(return_status='verified').exists()

        if active:
            return Response(
                {'error': 'Cannot delete a book with active loans.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        book.is_active = False
        book.save(update_fields=['is_active'])

        if book.available:
            book.available = False
            book.save(update_fields=['available'])

        return Response(
            {'message': 'Book has been deactivated successfully.'},
            status=status.HTTP_200_OK
        )


class BookRestoreAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrLibrarian]

    def post(self, request, pk):
        book = get_object_or_404(Book, pk=pk, is_active=False)

        if Book.objects.filter(isbn=book.isbn, is_active=True).exclude(pk=pk).exists():
            return Response(
                {'error': 'Cannot restore: Another active book with this ISBN already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        book.is_active = True
        book.save(update_fields=['is_active'])

        return Response(
            {'message': f'Book "{book.title}" has been restored successfully.'},
            status=status.HTTP_200_OK
        )


# ─────────────────────────────────────────────
#  DASHBOARD STATS
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrLibrarian])
def dashboard_stats(request):
    # Deferred imports to avoid circular dependency at module load time
    from circulation.models import BorrowRequest, Loan, Reservation, Fine, Semester
    from circulation.serializers import SemesterSerializer

    today = timezone.now().date()

    stats = {
        'total_books':     Book.objects.count(),
        'available_books': Book.objects.filter(available=True).count(),

        'total_authors':    Author.objects.count(),
        'total_categories': Category.objects.count(),

        'pending_borrow_requests': BorrowRequest.objects.filter(status='pending').count(),

        'active_loans':    Loan.objects.exclude(return_status='verified').count(),
        'pending_returns': Loan.objects.filter(return_status='pending').count(),
        'overdue_loans':   Loan.objects.exclude(
                               return_status='verified'
                           ).filter(due_date__lt=today).count(),

        'active_reservations': Reservation.objects.filter(status='waiting').count(),
        'ready_reservations':  Reservation.objects.filter(status='ready').count(),

        'unpaid_fines':       Fine.objects.filter(paid=False).count(),
        'unpaid_fines_total': Fine.objects.filter(paid=False).aggregate(
                                  total=Sum('amount')
                              )['total'] or 0,

        'total_users':      User.objects.count(),
        'total_admins':     User.objects.filter(role='admin').count(),
        'total_librarians': User.objects.filter(role='librarian').count(),
        'total_members':    User.objects.filter(role='member').count(),

        'active_semester': SemesterSerializer(
            Semester.objects.filter(is_active=True).first()
        ).data,
    }

    recent_loans    = Loan.objects.select_related('member', 'book').order_by('-loan_date')[:5]
    recent_returns  = Loan.objects.select_related('member', 'book').filter(
                          return_verified_date__isnull=False
                      ).order_by('-return_verified_date')[:5]
    recent_fines    = Fine.objects.select_related('member', 'loan__book').order_by('-issued_date')[:5]
    recent_requests = BorrowRequest.objects.select_related('member', 'book').order_by('-request_date')[:5]

    activities = []
    for loan in recent_loans:
        activities.append({
            'type':   'loan',
            'label':  'Book issued',
            'member': loan.member.full_name,
            'book':   loan.book.title,
            'date':   str(loan.loan_date),
        })
    for loan in recent_returns:
        activities.append({
            'type':   'return',
            'label':  'Book returned',
            'member': loan.member.full_name,
            'book':   loan.book.title,
            'date':   str(loan.return_verified_date),
        })
    for fine in recent_fines:
        activities.append({
            'type':   'fine',
            'label':  'Fine issued',
            'member': fine.member.full_name,
            'book':   fine.loan.book.title,
            'date':   str(fine.issued_date),
        })
    for req in recent_requests:
        activities.append({
            'type':   'request',
            'label':  'Borrow request',
            'member': req.member.full_name,
            'book':   req.book.title,
            'date':   str(req.request_date),
        })

    activities.sort(key=lambda x: x['date'], reverse=True)
    stats['recent_activity'] = activities[:8]

    return Response(stats)