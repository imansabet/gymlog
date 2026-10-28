from app.seed import SEED


def test_seed_slugs_are_unique():
    slugs = [row[0] for row in SEED]
    assert len(slugs) == len(set(slugs))
