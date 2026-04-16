from momentum_scoring import KPIValue, score_kpis


def test_score_tracks_measured_and_estimated_counts() -> None:
    result = score_kpis(
        [
            KPIValue(kpi_id="internal.reach_rate", value=80, provenance="measured", confidence=0.9),
            KPIValue(
                kpi_id="csr.carbon_avoided_estimate",
                value=60,
                provenance="estimated",
                confidence=0.5,
            ),
        ]
    )

    assert result.performance_score == 70
    assert result.confidence_score == 70
    assert result.measured_count == 1
    assert result.estimated_count == 1
