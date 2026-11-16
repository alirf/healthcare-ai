"""Models package init — exposes diagnosis models so SQLAlchemy registers them."""
from app.models.diagnosis import AIDiagnosisSuggestion, FinalDiagnosis

__all__ = ["AIDiagnosisSuggestion", "FinalDiagnosis"]
