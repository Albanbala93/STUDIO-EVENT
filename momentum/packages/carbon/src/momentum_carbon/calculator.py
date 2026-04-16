from momentum_carbon.models import CarbonEstimate


def estimate_travel_emissions(distance_km: float, emission_factor_kg_per_km: float) -> CarbonEstimate:
    return CarbonEstimate(
        kg_co2e=round(distance_km * emission_factor_kg_per_km, 3),
        provenance="estimated",
        method="distance_km * emission_factor_kg_per_km",
        confidence=0.6,
    )
