# Model artefacts

Place the trained artefacts here **before** `docker build`:

| File | Description | Size |
| --- | --- | --- |
| `best_model.pt` | PyTorch checkpoint: `{"model_state_dict": ..., "f1": ..., "epoch": ...}` | ~600 MB |
| `evidence_list_clean.json` | Evidence dictionary — JSON **object** keyed by evidence_id | small |

The Docker build fails on purpose (`test -f` sanity checks in the Dockerfile)
when either file is missing, so a broken image can never be produced.

The startup sanity check also compares
`checkpoint["model_state_dict"]["classifier.weight"].shape[0]` with the number
of keys in `evidence_list_clean.json`; on mismatch the service stays alive but
reports `503` on `/health` instead of crashing.

For local runs without Docker you can point `MODEL_PATH` / `EVIDENCE_PATH`
somewhere else via `.env`.
