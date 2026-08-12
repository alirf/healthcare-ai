"""Utility helper functions."""
from datetime import date
from uuid import UUID


def calculate_age(birth_date: date) -> int:
    """Calculate age from birth date."""
    today = date.today()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


def calculate_bmi(height_cm: int, weight_kg: int) -> float:
    """Calculate BMI from height (cm) and weight (kg)."""
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)


def is_valid_uuid(value: str) -> bool:
    """Check if a string is a valid UUID."""
    try:
        UUID(value)
        return True
    except ValueError:
        return False