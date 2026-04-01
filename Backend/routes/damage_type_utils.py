import re


_CANONICAL_DAMAGE_TYPE_LABELS = {
    "cracked_base": "cracked_base",
    "missing_cover": "missing_cover",
    "corrosion_rust": "corrosion_rust",
    "graffiti": "graffiti",
    "physical_impact_damage": "physical_impact_damage",
    "leaning_unstable": "leaning_unstable",
}

_DAMAGE_TYPE_ALIASES = {
    "cracked_base": "cracked_base",
    "cracked": "cracked_base",
    "base_crack": "cracked_base",
    "missing_cover": "missing_cover",
    "cover_missing": "missing_cover",
    "corrosion": "corrosion_rust",
    "rust": "corrosion_rust",
    "corrosion_rust": "corrosion_rust",
    "rust_corrosion": "corrosion_rust",
    "graffiti": "graffiti",
    "impact_damage": "physical_impact_damage",
    "physical_impact_damage": "physical_impact_damage",
    "impact": "physical_impact_damage",
    "physical_damage": "physical_impact_damage",
    "leaning": "leaning_unstable",
    "unstable": "leaning_unstable",
    "leaning_unstable": "leaning_unstable",
}


def normalize_damage_type_value(value):
    if not isinstance(value, str):
        return None

    normalized = re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")
    if not normalized:
        return None

    if normalized in _CANONICAL_DAMAGE_TYPE_LABELS:
        return normalized

    return _DAMAGE_TYPE_ALIASES.get(normalized, normalized)


def normalize_damage_types(values):
    if not isinstance(values, list):
        return []

    normalized_values = []
    seen = set()

    for value in values:
        normalized = normalize_damage_type_value(value)
        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        normalized_values.append(normalized)

    return normalized_values
