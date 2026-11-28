from django.urls import path

from .views import (
    CategoryListView,
    GoalDetailView,
    GoalListCreateView,
    TransactionDetailView,
    TransactionListCreateView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("transactions/", TransactionListCreateView.as_view(), name="transaction-list"),
    path("transactions/<uuid:pk>/", TransactionDetailView.as_view(), name="transaction-detail"),
    path("goals/", GoalListCreateView.as_view(), name="goal-list"),
    path("goals/<uuid:pk>/", GoalDetailView.as_view(), name="goal-detail"),
]