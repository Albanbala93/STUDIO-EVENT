const metrics = [
  { label: "Measured KPIs", value: "18", note: "Source data verified" },
  { label: "Estimated KPIs", value: "7", note: "Method and confidence required" },
  { label: "Score confidence", value: "74", note: "Weighted by data completeness" }
];

export default function Page() {
  return (
    <main className="workspace">
      <section className="intro">
        <p className="eyebrow">Momentum</p>
        <h1>Measure communication, event, and CSR impact with confidence.</h1>
        <p>
          Separate measured performance from estimates, track missing inputs, and keep every
          initiative tied to tenant-scoped KPI definitions.
        </p>
      </section>

      <section className="metricGrid" aria-label="Momentum KPI summary">
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
