from django.contrib import admin
from django.urls import include, path

from finance.views import (
    CurrentUserView,
    DashboardView,
    LoginView,
    LogoutView,
    RegisterView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", LoginView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current_user"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/", include("finance.urls")),
]