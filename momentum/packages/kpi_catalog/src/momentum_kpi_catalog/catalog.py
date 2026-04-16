from momentum_kpi_catalog.models import KPIDefinition

DEFAULT_KPIS = [
    KPIDefinition(
        id="internal.reach_rate",
        name="Reach rate",
        category="internal_communication",
        unit="percent",
        provenance_default="measured",
    ),
    KPIDefinition(
        id="events.attendance_rate",
        name="Attendance rate",
        category="corporate_event",
        unit="percent",
        provenance_default="measured",
    ),
    KPIDefinition(
        id="csr.carbon_avoided_estimate",
        name="Carbon avoided estimate",
        category="csr_sustainability",
        unit="kg_co2e",
        provenance_default="estimated",
    ),
]
