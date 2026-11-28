from datetime import datetime

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView

from .models import Category, Goal, Transaction
from .serializers import (
    CategorySerializer,
    GoalSerializer,
    LoginSerializer,
    RegisterSerializer,
    TransactionSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class TokenRefreshView(SimpleJWTTokenRefreshView):
    permission_classes = [permissions.AllowAny]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            raise ValidationError({"refresh": "O token de atualização é obrigatório."})
        try:
            token = RefreshToken(refresh_token)
            if str(token.get("user_id")) != str(request.user.pk):
                raise ValidationError({"refresh": "O token não pertence a este usuário."})
            token.blacklist()
        except TokenError as exc:
            raise ValidationError({"refresh": "Token inválido ou expirado."}) from exc
        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        queryset = Transaction.objects.filter(owner=self.request.user).select_related("category")
        transaction_type = self.request.query_params.get("type")
        category_id = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")
        if transaction_type in {"income", "expense"}:
            queryset = queryset.filter(type=transaction_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if search:
            queryset = queryset.filter(description__icontains=search)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(owner=self.request.user).select_related("category")


class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(owner=self.request.user)


class DashboardView(APIView):
    def get(self, request):
        month_value = request.query_params.get("month")
        if month_value:
            try:
                reference_date = datetime.strptime(month_value, "%Y-%m").date()
            except ValueError as exc:
                raise ValidationError({"month": "Use o formato AAAA-MM."}) from exc
        else:
            reference_date = timezone.localdate()

        month_transactions = Transaction.objects.filter(
            owner=request.user,
            date__year=reference_date.year,
            date__month=reference_date.month,
        ).select_related("category")
        totals = month_transactions.aggregate(
            total_income=Sum("amount", filter=Q(type="income")),
            total_expense=Sum("amount", filter=Q(type="expense")),
        )
        by_category = month_transactions.filter(type="expense").values(
            "category_id", "category__name"
        ).annotate(total=Sum("amount")).order_by("-total")
        recent = Transaction.objects.filter(owner=request.user).select_related("category")[:5]
        recent_data = TransactionSerializer(recent, many=True).data

        return Response({
            "month": reference_date.strftime("%Y-%m"),
            "summary": {
                "totalIncome": float(totals["total_income"] or 0),
                "totalExpense": float(totals["total_expense"] or 0),
                "balance": float((totals["total_income"] or 0) - (totals["total_expense"] or 0)),
            },
            "expensesByCategory": [{
                "categoryId": row["category_id"],
                "name": row["category__name"],
                "total": float(row["total"]),
            } for row in by_category],
            "recentTransactions": recent_data,
        })