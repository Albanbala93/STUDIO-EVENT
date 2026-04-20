# api/config/interpretation_rules.py

DIMENSION_GAP_MESSAGES = {
    "reach": "La portée n’est pas suffisamment mesurée. Il est difficile d’évaluer la mobilisation réelle.",
    "engagement": "L’engagement n’est pas suffisamment mesuré. Vous ne savez pas si les participants ont réellement interagi.",
    "appropriation": "L’appropriation n’est pas suffisamment mesurée. La compréhension et la rétention des messages restent inconnues.",
    "impact": "L’impact n’est pas suffisamment mesuré. Il est difficile de relier l’événement à un effet concret.",
}

RECOMMENDATIONS_BY_DIMENSION = {
    "reach": [
        {
            "priority": "medium",
            "action": "Renforcer la communication amont et les relances ciblées.",
            "expected_benefit": "Augmenter la mobilisation et la participation."
        },
        {
            "priority": "medium",
            "action": "Simplifier le parcours d’inscription.",
            "expected_benefit": "Réduire la friction avant participation."
        }
    ],
    "engagement": [
        {
            "priority": "high",
            "action": "Ajouter des KPI d’interaction pendant l’événement.",
            "expected_benefit": "Mieux mesurer la participation réelle et l’attention."
        },
        {
            "priority": "high",
            "action": "Prévoir davantage de formats participatifs.",
            "expected_benefit": "Stimuler l’implication des participants."
        }
    ],
    "appropriation": [
        {
            "priority": "high",
            "action": "Mesurer la compréhension et la mémorisation des messages clés à chaud puis à froid.",
            "expected_benefit": "Vérifier que les contenus ont été retenus."
        }
    ],
    "impact": [
        {
            "priority": "high",
            "action": "Définir un indicateur business ou RH suivi après l’événement.",
            "expected_benefit": "Mieux démontrer l’effet concret de l’événement."
        }
    ]
}