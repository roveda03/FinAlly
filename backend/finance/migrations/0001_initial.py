import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def create_default_categories(apps, schema_editor):
    Category = apps.get_model("finance", "Category")
    categories = [
        ("cat-salario", "Sal\u00e1rio", "income", "cash"),
        ("cat-freelance", "Freelance", "income", "laptop"),
        ("cat-investimentos", "Investimentos", "income", "trending-up"),
        ("cat-alimentacao", "Alimenta\u00e7\u00e3o", "expense", "restaurant"),
        ("cat-moradia", "Moradia", "expense", "home"),
        ("cat-transporte", "Transporte", "expense", "car"),
        ("cat-lazer", "Lazer", "expense", "game-controller"),
        ("cat-saude", "Sa\u00fade", "expense", "medkit"),
        ("cat-educacao", "Educa\u00e7\u00e3o", "expense", "school"),
    ]
    Category.objects.bulk_create([
        Category(id=category_id, name=name, type=category_type, icon=icon)
        for category_id, name, category_type, icon in categories
    ])


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.CharField(max_length=50, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=80)),
                ("type", models.CharField(choices=[("income", "Receita"), ("expense", "Despesa")], max_length=8)),
                ("icon", models.CharField(max_length=40)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Goal",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=120)),
                ("description", models.CharField(blank=True, max_length=240)),
                ("target_amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("current_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("deadline", models.DateField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="goals", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["deadline", "created_at"]},
        ),
        migrations.CreateModel(
            name="Transaction",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("description", models.CharField(max_length=160)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("type", models.CharField(choices=[("income", "Receita"), ("expense", "Despesa")], max_length=8)),
                ("date", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="transactions", to="finance.category")),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transactions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-created_at"]},
        ),
        migrations.RunPython(create_default_categories, migrations.RunPython.noop),
    ]