export default function StudioResultPage() {
    return (
        <main style={{ padding: 40, maxWidth: 1000 }}>
            <h1>Résultat</h1>
            <p>Voici un premier aperçu du dispositif généré.</p>

            <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2>Angle stratégique</h2>
                <p>
                    Créer une campagne interne claire, rassurante et activable rapidement, avec relais managers et contenus prêts à diffuser.
                </p>
            </section>

            <section style={{ marginTop: 16, padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2>Messages clés</h2>
                <ul>
                    <li>Pourquoi le sujet est prioritaire maintenant</li>
                    <li>Ce qu’on attend concrètement des équipes</li>
                    <li>Comment les managers vont accompagner le déploiement</li>
                </ul>
            </section>

            <section style={{ marginTop: 16, padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2>Contenus générés</h2>
                <p>Email direction, post intranet, kit manager, FAQ.</p>
            </section>
        </main>
    );
}