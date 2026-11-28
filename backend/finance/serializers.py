from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Category, Goal, Transaction

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(source="first_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email"]


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        return User.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data["name"].strip(),
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context.get("request")
        user = authenticate(
            request=request,
            username=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
        if user is None or not user.is_active:
            raise AuthenticationFailed("E-mail ou senha inválidos.")

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "type", "icon"]


class TransactionSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    categoryId = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), pk_field=serializers.CharField()
    )

    class Meta:
        model = Transaction
        fields = ["id", "description", "amount", "type", "categoryId", "date"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        category = attrs.get("category", getattr(self.instance, "category", None))
        transaction_type = attrs.get("type", getattr(self.instance, "type", None))
        if category and transaction_type and category.type != transaction_type:
            raise serializers.ValidationError({"categoryId": "A categoria não corresponde ao tipo."})
        if attrs.get("amount", 1) <= 0:
            raise serializers.ValidationError({"amount": "O valor deve ser maior que zero."})
        return attrs


class GoalSerializer(serializers.ModelSerializer):
    targetAmount = serializers.DecimalField(
        source="target_amount", max_digits=12, decimal_places=2, coerce_to_string=False
    )
    currentAmount = serializers.DecimalField(
        source="current_amount", max_digits=12, decimal_places=2,
        coerce_to_string=False, required=False
    )

    class Meta:
        model = Goal
        fields = ["id", "title", "description", "targetAmount", "currentAmount", "deadline"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        target = attrs.get("target_amount", getattr(self.instance, "target_amount", None))
        current = attrs.get("current_amount", getattr(self.instance, "current_amount", 0))
        if target is not None and target <= 0:
            raise serializers.ValidationError({"targetAmount": "O valor desejado deve ser maior que zero."})
        if current < 0:
            raise serializers.ValidationError({"currentAmount": "O valor acumulado não pode ser negativo."})
        return attrs