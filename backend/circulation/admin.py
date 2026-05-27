from django.contrib import admin
from .models import Semester, BorrowRequest, Loan, Reservation, Fine
from config.admin_site import librium_admin


@admin.register(Semester, site=librium_admin)
class SemesterAdmin(admin.ModelAdmin):
    list_display  = ('academic_year', 'semester_type', 'start_date', 'end_date', 'is_active')
    list_filter   = ('is_active', 'semester_type')
    ordering      = ('-academic_year', 'semester_type')


@admin.register(BorrowRequest, site=librium_admin)
class BorrowRequestAdmin(admin.ModelAdmin):
    list_display   = ('member', 'book', 'status', 'request_date', 'processed_date', 'processed_by')
    list_filter    = ('status',)
    search_fields  = ('member__email', 'member__full_name', 'book__title')
    ordering       = ('-request_date',)
    readonly_fields = ('request_date',)


@admin.register(Loan, site=librium_admin)
class LoanAdmin(admin.ModelAdmin):
    list_display   = (
        'member', 'book', 'loan_date', 'due_date',
        'return_status', 'return_verified_date', 'semester',
    )
    list_filter    = ('return_status', 'semester')
    search_fields  = ('member__email', 'member__full_name', 'book__title')
    ordering       = ('-loan_date',)
    readonly_fields = ('loan_date', 'due_date', 'return_verified_date', 'verified_by')


@admin.register(Reservation, site=librium_admin)
class ReservationAdmin(admin.ModelAdmin):
    list_display  = ('member', 'book', 'status', 'queue_position', 'reserved_date', 'notified_date')
    list_filter   = ('status',)
    search_fields = ('member__email', 'member__full_name', 'book__title')
    ordering      = ('reserved_date',)


@admin.register(Fine, site=librium_admin)
class FineAdmin(admin.ModelAdmin):
    list_display   = ('member', 'loan', 'amount', 'paid', 'issued_date', 'paid_date', 'issued_by')
    list_filter    = ('paid',)
    search_fields  = ('member__email', 'member__full_name')
    ordering       = ('-issued_date',)
    readonly_fields = ('issued_date',)