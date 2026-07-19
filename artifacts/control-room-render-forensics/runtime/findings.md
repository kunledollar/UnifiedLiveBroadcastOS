# UBOS Control Room Render Forensics

Conclusion: **CONTRIBUTOR**

Evidence completeness: **PASS**

- Experiment A — Baseline: 4106.95 renders/s, 133.49 state writes/s, 0.0% render reduction
- Experiment B — Audio Mixer closed: 5426.64 renders/s, 146.72 state writes/s, 0.0% render reduction
- Experiment C — Mixer subtree disabled: 1492.51 renders/s, 0.00 state writes/s, 64.2% render reduction
- Experiment D — Mixer RAF disabled: 1901.95 renders/s, 95.96 state writes/s, 53.0% render reduction
- Experiment E — Mixer state setter disabled: 1516.92 renders/s, 3.06 state writes/s, 62.7% render reduction
- Experiment F — AudioMeter animation disabled: 1441.84 renders/s, 82.93 state writes/s, 64.0% render reduction
- Experiment G — Recording polling disabled: 1346.33 renders/s, 83.40 state writes/s, 66.9% render reduction
- Experiment H — Scene reconciliation disabled: 3184.39 renders/s, 121.83 state writes/s, 23.1% render reduction
