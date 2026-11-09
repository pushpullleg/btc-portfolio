#!/usr/bin/env python3
"""
prepare_public_data.py — portfolio data preparation and validation script

Copies the five approved M2 public CSVs from an M2 export directory into the
portfolio's public/data/ directory, applies two approved editorial overrides to
context_note fields, validates the result, and fails safely without modifying
destination files if any check fails.

Usage (data refresh):
    python scripts/prepare_public_data.py --source /path/to/m2/output/public

Usage (dry-run, validate only):
    python scripts/prepare_public_data.py --source /path/to/m2/output/public --dry-run

Requirements: Python 3.8+, standard library only.

Source and destination must be different directories. The script rejects equal
resolved paths before reading or writing anything.

Promotion safety: all five candidate files are validated in a temporary
directory before any existing destination file is touched. If promotion is
interrupted, all five destination files are restored from a pre-promotion
backup.
"""

import argparse
import csv
import hashlib
import os
import re
import shutil
import sys
import tempfile

# ── Approved editorial overrides ─────────────────────────────────────────────
# Applied by achievement_id to context_note only. All other fields are preserved
# verbatim from the M2 export. These overrides remove internal directory names
# and evidence IDs that have no meaning outside the private pipeline workspace.
CONTEXT_NOTE_OVERRIDES: dict[str, str] = {
    "ACH-007": (
        "PDF page title was cropped. Event name Box Cricket confirmed from a "
        "supplementary screenshot referenced in audit notes; that screenshot "
        "was not present in the evidence store as of the data entry date."
    ),
    "ACH-023": (
        "Firsthand-confirmed championship by participant. Championship outcome "
        "not recorded on IMLeagues platform. A registration screenshot proves "
        "enrollment but shows zeroed standings and does not confirm the "
        "championship result. A prize T-shirt was received. Firsthand "
        "confirmation is not equivalent to independent platform verification."
    ),
}

# ── Expected public fields per file ──────────────────────────────────────────
EXPECTED_HEADERS: dict[str, set[str]] = {
    "achievements_public.csv": {
        "achievement_id", "semester", "season", "year", "semester_sort_key",
        "sport_normalized", "sport_raw", "event_name_raw", "event_format",
        "event_format_display", "medal_tier", "medal_rank", "wins_reported",
        "losses_reported", "ties_reported", "has_record",
        "placement_evidence_type", "is_ambiguous", "review_status",
        "context_note",
    },
    "kpi_medal_summary.csv": {
        "medal_tier", "medal_rank", "total_count",
        "platform_recorded_count", "firsthand_attested_count",
    },
    "kpi_sport.csv": {
        "sport_normalized", "total_medals", "gold_count", "silver_count",
        "bronze_count", "platform_recorded_count", "firsthand_attested_count",
    },
    "kpi_semester.csv": {
        "semester", "season", "year", "semester_sort_key", "total_medals",
        "gold_count", "silver_count", "bronze_count",
    },
    "kpi_format.csv": {
        "event_format_display", "total_count",
        "gold_count", "silver_count", "bronze_count",
    },
}

PUBLIC_FILES = list(EXPECTED_HEADERS.keys())

# Fields that must never appear in public exports
PRIVATE_FIELDS = {"evidence_id", "placement_source", "record_source"}

# Content patterns that signal private or internal data
PRIVATE_CONTENT_PATTERNS = [
    "Private evidence /",
    "/Users/",
    "/home/",
]

# Internal evidence ID pattern (e.g. EV-001)
_EV_ID_RE = re.compile(r"\bEV-\d{3}\b")

# ── Validation constants ──────────────────────────────────────────────────────
EXPECTED_TOTAL        = 23
EXPECTED_GOLD         = 10
EXPECTED_SILVER       = 4
EXPECTED_BRONZE       = 9
EXPECTED_SPORT_COUNT  = 9
EXPECTED_FIRSTHAND_ID = "ACH-023"
EXPECTED_FIRSTHAND_TYPE = "firsthand_attested"


# ── Helpers ───────────────────────────────────────────────────────────────────

def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_csv(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(rows: list[dict], fieldnames: list[str], path: str) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ── Validation ────────────────────────────────────────────────────────────────

def check_headers(fname: str, actual: list[str], errors: list[str]) -> None:
    actual_set = set(actual)
    expected   = EXPECTED_HEADERS[fname]
    extra      = actual_set - expected
    missing    = expected - actual_set
    private    = PRIVATE_FIELDS & actual_set
    if extra:
        errors.append(f"{fname}: unexpected columns {extra}")
    if missing:
        errors.append(f"{fname}: missing expected columns {missing}")
    if private:
        errors.append(f"{fname}: private fields present {private}")


def check_achievements(rows: list[dict], errors: list[str]) -> None:
    total = len(rows)
    if total != EXPECTED_TOTAL:
        errors.append(f"Expected {EXPECTED_TOTAL} achievements, got {total}")

    gold   = sum(1 for r in rows if r.get("medal_tier") == "Gold")
    silver = sum(1 for r in rows if r.get("medal_tier") == "Silver")
    bronze = sum(1 for r in rows if r.get("medal_tier") == "Bronze")
    if gold   != EXPECTED_GOLD:   errors.append(f"Expected {EXPECTED_GOLD} Gold, got {gold}")
    if silver != EXPECTED_SILVER: errors.append(f"Expected {EXPECTED_SILVER} Silver, got {silver}")
    if bronze != EXPECTED_BRONZE: errors.append(f"Expected {EXPECTED_BRONZE} Bronze, got {bronze}")

    sports = {r.get("sport_normalized") for r in rows if r.get("sport_normalized")}
    if len(sports) != EXPECTED_SPORT_COUNT:
        errors.append(
            f"Expected {EXPECTED_SPORT_COUNT} distinct sports, got {len(sports)}: {sports}"
        )

    ach023 = next((r for r in rows if r.get("achievement_id") == EXPECTED_FIRSTHAND_ID), None)
    if not ach023:
        errors.append(f"{EXPECTED_FIRSTHAND_ID} not found")
    elif ach023.get("placement_evidence_type") != EXPECTED_FIRSTHAND_TYPE:
        errors.append(
            f"{EXPECTED_FIRSTHAND_ID}: expected {EXPECTED_FIRSTHAND_TYPE!r}, "
            f"got {ach023.get('placement_evidence_type')!r}"
        )

    for row in rows:
        aid = row.get("achievement_id", "?")
        for field, val in row.items():
            val_s = str(val or "")
            for pat in PRIVATE_CONTENT_PATTERNS:
                if pat.lower() in val_s.lower():
                    errors.append(
                        f"{aid}[{field}]: contains private pattern {pat!r}: {val_s[:100]}"
                    )
            if _EV_ID_RE.search(val_s):
                errors.append(
                    f"{aid}[{field}]: contains internal evidence ID: {val_s[:100]}"
                )


# ── Safe promotion ────────────────────────────────────────────────────────────

def promote(staged_dir: str, dest_dir: str, expected_hashes: dict[str, str]) -> None:
    """
    Copy all five staged files into dest_dir.

    Backs up any existing destination files first. If any copy step raises an
    exception, restores all destination files from the backup before re-raising,
    leaving the dataset in its last-good state.
    """
    os.makedirs(dest_dir, exist_ok=True)

    # Back up every file that already exists in dest_dir
    backup: dict[str, bytes] = {}
    for fname in PUBLIC_FILES:
        dest_path = os.path.join(dest_dir, fname)
        if os.path.exists(dest_path):
            with open(dest_path, "rb") as f:
                backup[fname] = f.read()

    promoted: list[str] = []
    try:
        for fname in PUBLIC_FILES:
            src_path  = os.path.join(staged_dir, fname)
            dest_path = os.path.join(dest_dir, fname)
            shutil.copy2(src_path, dest_path)
            promoted.append(fname)

            # Verify the written file matches the validated staged hash
            written_hash = sha256_file(dest_path)
            if written_hash != expected_hashes[fname]:
                raise RuntimeError(
                    f"Post-copy hash mismatch for {fname}: "
                    f"expected {expected_hashes[fname][:16]}… "
                    f"got {written_hash[:16]}…"
                )

    except Exception:
        # Restore every destination file from backup
        for fname in PUBLIC_FILES:
            dest_path = os.path.join(dest_dir, fname)
            if fname in backup:
                with open(dest_path, "wb") as f:
                    f.write(backup[fname])
            elif os.path.exists(dest_path):
                # File did not exist before; remove what we partially wrote
                os.remove(dest_path)
        raise


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prepare public portfolio data from M2 export directory.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--source", required=True,
        help="Path to the M2 public export directory containing the five approved CSVs.",
    )
    parser.add_argument(
        "--dest", default=None,
        help=(
            "Destination public/data directory. "
            "Defaults to <repo-root>/public/data relative to this script."
        ),
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Validate inputs and show overrides without writing any output files.",
    )
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root  = os.path.dirname(script_dir)
    dest_dir   = os.path.realpath(args.dest or os.path.join(repo_root, "public", "data"))
    source_dir = os.path.realpath(args.source)

    print("=" * 60)
    print("Beyond the Classroom — data preparation")
    print("=" * 60)
    print(f"Source:      {source_dir}")
    print(f"Destination: {dest_dir}")
    print(f"Dry run:     {args.dry_run}")
    print()

    # 1. Reject source == destination (resolved through symlinks)
    if source_dir == dest_dir:
        print(
            "ERROR: --source and --dest resolve to the same directory.\n"
            "The M2 export directory must be separate from public/data/.\n"
            f"  Canonical source: {source_dir}\n"
            f"  Canonical dest:   {dest_dir}"
        )
        sys.exit(1)

    # 2. Confirm source files exist
    missing_src = [f for f in PUBLIC_FILES if not os.path.isfile(os.path.join(source_dir, f))]
    if missing_src:
        print("ERROR: missing source files:")
        for f in missing_src:
            print(f"  {f}")
        sys.exit(1)

    # 3. Record source hashes before any work begins
    print("Source hashes (M2 export — verified unchanged after run):")
    source_hashes: dict[str, str] = {}
    for fname in PUBLIC_FILES:
        h = sha256_file(os.path.join(source_dir, fname))
        source_hashes[fname] = h
        print(f"  {h[:16]}…  {fname}")
    print()

    # 4. Load, apply overrides, validate — entirely in memory before touching dest
    errors: list[str] = []
    prepared: dict[str, tuple[list[str], list[dict]]] = {}

    for fname in PUBLIC_FILES:
        rows = load_csv(os.path.join(source_dir, fname))
        if not rows:
            errors.append(f"{fname}: file is empty")
            continue

        fieldnames = list(rows[0].keys())
        check_headers(fname, fieldnames, errors)

        if fname == "achievements_public.csv":
            applied: list[str] = []
            for row in rows:
                aid = row.get("achievement_id", "")
                if aid in CONTEXT_NOTE_OVERRIDES:
                    original = row["context_note"]
                    row["context_note"] = CONTEXT_NOTE_OVERRIDES[aid]
                    applied.append(aid)
                    print(f"Override: {aid}")
                    print(f"  Before: {original[:90]}{'…' if len(original) > 90 else ''}")
                    print(f"  After:  {row['context_note'][:90]}{'…' if len(row['context_note']) > 90 else ''}")
                    print()

            unapplied = set(CONTEXT_NOTE_OVERRIDES) - set(applied)
            if unapplied:
                errors.append(
                    f"achievements_public.csv: override IDs not found in source: {unapplied}"
                )

            check_achievements(rows, errors)

        prepared[fname] = (fieldnames, rows)

    # 5. Fail fast — do not modify dest if anything is wrong
    if errors:
        print("VALIDATION FAILED — destination not modified:")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)

    print("Validation: all checks passed ✓")
    print()

    if args.dry_run:
        print("DRY RUN complete — no files written.")
        return

    # 6. Write all five candidates to a temp staging directory and record their hashes.
    #    No destination file is touched until all five are written and hashed.
    with tempfile.TemporaryDirectory() as staged_dir:
        staged_hashes: dict[str, str] = {}
        for fname, (fieldnames, rows) in prepared.items():
            tmp_path = os.path.join(staged_dir, fname)
            write_csv(rows, fieldnames, tmp_path)
            staged_hashes[fname] = sha256_file(tmp_path)

        print("Staged output hashes (all five validated before promotion):")
        for fname, h in staged_hashes.items():
            print(f"  {h[:16]}…  {fname}")
        print()

        # 7. Promote: back up existing dest files, copy staged files, verify each
        #    written hash. Restore from backup automatically on any failure.
        try:
            promote(staged_dir, dest_dir, staged_hashes)
        except Exception as exc:
            print(f"\nPROMOTION FAILED — destination restored to last-good state:\n  {exc}")
            sys.exit(1)

    print(f"Success: {len(PUBLIC_FILES)} files promoted to {dest_dir}")
    print()

    # 8. Verify M2 source files are unchanged
    source_changed = False
    print("M2 source file integrity (must be unchanged):")
    for fname, original_hash in source_hashes.items():
        current = sha256_file(os.path.join(source_dir, fname))
        ok = current == original_hash
        print(f"  {'✓' if ok else '✗ CHANGED'}  {fname}")
        if not ok:
            source_changed = True

    if source_changed:
        print("\nERROR: M2 source files were modified — this should not happen.")
        sys.exit(1)

    print()
    print("Data preparation complete.")


if __name__ == "__main__":
    main()
