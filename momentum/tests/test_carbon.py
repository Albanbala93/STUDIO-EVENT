from momentum_carbon import estimate_travel_emissions


def test_travel_emissions_are_estimated_with_method_context() -> None:
    estimate = estimate_travel_emissions(distance_km=100, emission_factor_kg_per_km=0.12)

    assert estimate.kg_co2e == 12
    assert estimate.provenance == "estimated"
    assert estimate.method
