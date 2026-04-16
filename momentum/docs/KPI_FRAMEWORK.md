# Momentum KPI Framework

## Principles

- Every KPI value has provenance: `measured` or `estimated`.
- Estimates must carry confidence and a short method description.
- Scores must not imply financial ROI unless ROI was directly measured.
- Missing data should reduce confidence rather than being silently filled.

## MVP KPI Categories

### Internal Communication

- Reach rate: percentage of intended audience reached
- Engagement rate: percentage of reached audience that interacted
- Feedback sentiment: normalized qualitative feedback score
- Message recall: measured survey recall where available

### Corporate Events

- Registration count: measured registrations
- Attendance count: measured attendance
- Attendance rate: attendance divided by registrations
- Satisfaction score: measured post-event survey score
- Travel emissions estimate: estimated carbon impact from attendee travel

### CSR / Sustainability

- Participation count: measured participants
- Volunteer hours: measured or estimated hours
- Waste avoided estimate: estimated reduction where direct measurement is unavailable
- Carbon avoided estimate: estimated avoided emissions with method notes

## Scoring Model

The MVP scoring engine produces:

- `performance_score`: normalized KPI performance from 0 to 100
- `confidence_score`: data quality and completeness from 0 to 100
- `provenance_summary`: count of measured vs estimated values

Momentum should display score confidence alongside any aggregate score.
