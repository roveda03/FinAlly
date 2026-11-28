from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from finance.models import Category, Goal, Transaction

User = get_user_model()


class FinanceApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner@example.com", email="owner@example.com",
            first_name="Owner", password="StrongPass123!"
        )
        self.other_user = User.objects.create_user(
            username="other@example.com", email="other@example.com",
            first_name="Other", password="StrongPass123!"
        )
        self.category = Category.objects.get(pk="cat-alimentacao")
        self.client.force_authenticate(self.user)

    def test_login_returns_access_refresh_and_user(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(reverse("token_obtain_pair"), {
            "email": self.user.email,
            "password": "StrongPass123!",
        }, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)

    def test_registration_hashes_password_and_returns_tokens(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(reverse("register"), {
            "name": "New User", "email": "new@example.com", "password": "SafePass123!"
        }, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        registered_user = User.objects.get(email="new@example.com")
        self.assertTrue(registered_user.check_password("SafePass123!"))
        self.assertNotEqual(registered_user.password, "SafePass123!")

    def test_logout_blacklists_refresh_token(self):
        refresh = RefreshToken.for_user(self.user)

        response = self.client.post(reverse("logout"), {"refresh": str(refresh)}, format="json")

        self.assertEqual(response.status_code, 204)

    def test_user_cannot_revoke_another_users_refresh_token(self):
        refresh = RefreshToken.for_user(self.other_user)

        response = self.client.post(reverse("logout"), {"refresh": str(refresh)}, format="json")

        self.assertEqual(response.status_code, 400)

    def test_transactions_are_scoped_to_authenticated_user(self):
        transaction = Transaction.objects.create(
            owner=self.other_user, description="Private", amount=12,
            type="expense", category=self.category, date=date(2026, 11, 1)
        )

        response = self.client.get(reverse("transaction-list"))
        detail = self.client.get(reverse("transaction-detail", args=[transaction.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
        self.assertEqual(detail.status_code, 404)

    def test_user_can_create_transaction_and_goal(self):
        transaction_response = self.client.post(reverse("transaction-list"), {
            "description": "Almoco", "amount": 35.9, "type": "expense",
            "categoryId": self.category.id, "date": "2026-11-10",
        }, format="json")
        goal_response = self.client.post(reverse("goal-list"), {
            "title": "Viagem", "targetAmount": 3000, "currentAmount": 500,
            "deadline": "2027-06-30",
        }, format="json")

        self.assertEqual(transaction_response.status_code, 201)
        self.assertEqual(transaction_response.data["categoryId"], self.category.id)
        self.assertEqual(goal_response.status_code, 201)
        self.assertEqual(Goal.objects.get().owner, self.user)

    def test_goal_optional_fields_can_be_cleared(self):
        goal = Goal.objects.create(
            owner=self.user, title="Trip", description="Old description",
            target_amount=3000, current_amount=500, deadline=date(2027, 6, 30)
        )

        response = self.client.patch(reverse("goal-detail", args=[goal.id]), {
            "description": "", "deadline": None,
        }, format="json")

        self.assertEqual(response.status_code, 200)
        goal.refresh_from_db()
        self.assertEqual(goal.description, "")
        self.assertIsNone(goal.deadline)

    def test_dashboard_returns_only_current_users_monthly_totals(self):
        Transaction.objects.create(
            owner=self.user, description="Mercado", amount=80,
            type="expense", category=self.category, date=date(2026, 11, 10)
        )
        Transaction.objects.create(
            owner=self.other_user, description="Outra conta", amount=900,
            type="expense", category=self.category, date=date(2026, 11, 10)
        )

        response = self.client.get(reverse("dashboard"), {"month": "2026-11"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["totalExpense"], 80.0)
        self.assertEqual(response.data["expensesByCategory"][0]["categoryId"], self.category.id)