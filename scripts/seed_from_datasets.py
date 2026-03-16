#!/usr/bin/env python3
"""
Seed the local OSC-IS Postgres DB from OSC-Dev2 dataset JSON files.

Usage:
    python seed_from_datasets.py \
        --datasets-dir "C:/Users/ofgar/Downloads/datasets/datasets" \
        --api-url http://localhost:3000

Prerequisites:
    - API Gateway running locally (docker-compose up in OSC-APIGateway/)
    - pip install requests

The script will:
    1. Login as ADMIN1 to get a JWT
    2. Create a seed organization + PI user (idempotent)
    3. Login as the PI user
    4. POST each dataset artifact to /api/v1/artifacts
    5. Print a summary of created / skipped / failed artifacts
"""

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Config (override via env vars or CLI args)
# ---------------------------------------------------------------------------
DEFAULT_API_URL = "http://localhost:3000"
SEED_ORG_NAME = "OSC-Dev2 Seed"
SEED_ORG_DESC = "Organization for artifacts seeded from OSC-Dev2 blockchain data"
SEED_PI_USERNAME = "seed_pi"
SEED_PI_EMAIL = "seed_pi@osc-seed.local"
SEED_PI_PASSWORD = os.getenv("SEED_PI_PASSWORD", "SeedP@ssw0rd!")
DOI_PREFIX_RE = re.compile(r"^https?://doi\.org/", re.IGNORECASE)
DOI_VALID_RE = re.compile(r"^10\.\d{4,9}/[-_.;()/:a-zA-Z0-9]+$")


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------
def login(api_url: str, username: str, password: str) -> str:
    r = requests.post(f"{api_url}/api/v1/auth/login",
                      json={"username": username, "password": password}, timeout=10)
    r.raise_for_status()
    return r.json()["access_token"]


def get_or_create_org(api_url: str, token: str) -> str:
    """Return id of the seed org, creating it if needed."""
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{api_url}/api/v1/organizations", headers=headers, timeout=10)
    r.raise_for_status()
    for org in r.json():
        if org.get("name") == SEED_ORG_NAME:
            return org["id"]
    r = requests.post(f"{api_url}/api/v1/organizations", headers=headers,
                      json={"name": SEED_ORG_NAME, "description": SEED_ORG_DESC}, timeout=10)
    r.raise_for_status()
    return r.json()["id"]


def get_or_create_pi(api_url: str, admin_token: str, org_id: str) -> None:
    """Create the seed PI user if it doesn't already exist."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{api_url}/api/v1/users", headers=headers, timeout=10)
    r.raise_for_status()
    for user in r.json():
        if user.get("username") == SEED_PI_USERNAME:
            return  # already exists
    requests.post(f"{api_url}/api/v1/users", headers=headers, json={
        "name": "Seed PI",
        "username": SEED_PI_USERNAME,
        "email": SEED_PI_EMAIL,
        "password": SEED_PI_PASSWORD,
        "roles": ["pi"],
        "organizationId": org_id,
    }, timeout=10).raise_for_status()


# ---------------------------------------------------------------------------
# Field mapping
# ---------------------------------------------------------------------------
def compute_footprint(data: dict) -> str:
    """Use first manifest hash, or SHA-256 of title+description as fallback."""
    manifest = data.get("public_fields", {}).get("manifest", [])
    if manifest and manifest[0].get("hash"):
        h = manifest[0]["hash"]
        if re.match(r"^[a-f0-9]{64}$", h):
            return h
    title = data.get("mandatory_public_fields", {}).get("title", "")
    desc = data.get("mandatory_public_fields", {}).get("description", "")
    return hashlib.sha256(f"{title}{desc}".encode()).hexdigest()


def map_keywords(raw: str) -> list:
    if not raw:
        return []
    return [k.strip() for k in re.split(r"[,;]+", raw) if k.strip()]


def map_dois(raw: str) -> list:
    if not raw:
        return []
    doi = DOI_PREFIX_RE.sub("", raw.strip())
    return [doi] if DOI_VALID_RE.match(doi) else []


def map_links(raw: str) -> list:
    if not raw or not raw.strip():
        return []
    return [raw.strip()]


def build_payload(data: dict) -> dict:
    pub = data.get("public_fields", {})
    req = data.get("mandatory_public_fields", {})
    manifest = pub.get("manifest", [])
    # Normalise manifest algorithm field name (datasets use "sha256", API expects "SHA-256")
    normalised_manifest = []
    for item in manifest:
        alg = item.get("algorithm", "sha256")
        if alg.lower() == "sha256":
            alg = "SHA-256"
        normalised_manifest.append({
            "hash": item["hash"],
            "filename": item["filename"],
            "algorithm": alg,
        })

    return {
        "title": req.get("title", "Untitled"),
        "description": req.get("description", "No description provided."),
        "submission_comment": req.get("submission_comment", "Seeded from OSC-Dev2 blockchain data"),
        "footprint": compute_footprint(data),
        "manifest": normalised_manifest,
        "keywords": map_keywords(pub.get("keywords", "")),
        "links": map_links(pub.get("url", "")),
        "dois": map_dois(pub.get("doi", "")),
        "fundingAgencies": [],
        "acknowledgements": "",
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Seed OSC-IS Postgres from dataset JSON files")
    parser.add_argument("--datasets-dir", required=True, help="Directory containing dataset-*.json files")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help=f"API Gateway base URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--admin-username", default=os.getenv("ADMIN_USERNAME", "admin"))
    parser.add_argument("--admin-password", default=os.getenv("ADMIN_PASSWORD", ""), help="Admin password (or set ADMIN_PASSWORD env var)")
    args = parser.parse_args()

    if not args.admin_password:
        print("ERROR: provide --admin-password or set ADMIN_PASSWORD env var")
        sys.exit(1)

    dataset_files = sorted(Path(args.datasets_dir).glob("dataset-osc-is-artifact-*.json"))
    if not dataset_files:
        print(f"No dataset files found in {args.datasets_dir}")
        sys.exit(1)

    print(f"Found {len(dataset_files)} dataset files")
    print(f"Connecting to API at {args.api_url} ...")

    # Setup
    admin_token = login(args.api_url, args.admin_username, args.admin_password)
    print("✓ Admin login OK")

    org_id = get_or_create_org(args.api_url, admin_token)
    print(f"✓ Seed org ready (id={org_id})")

    get_or_create_pi(args.api_url, admin_token, org_id)
    print("✓ Seed PI user ready")

    pi_token = login(args.api_url, SEED_PI_USERNAME, SEED_PI_PASSWORD)
    print("✓ PI login OK\n")

    headers = {"Authorization": f"Bearer {pi_token}"}
    created, skipped, failed = 0, 0, []

    for path in dataset_files:
        artifact_uuid = path.stem.replace("dataset-osc-is-artifact-", "")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        payload = build_payload(data)
        title = payload["title"][:60]

        r = requests.post(f"{args.api_url}/api/v1/artifacts", headers=headers,
                          json=payload, timeout=15)
        if r.status_code in (200, 201):
            db_id = r.json().get("id", "?")
            print(f"  ✓ [{artifact_uuid}] → DB id={db_id}  \"{title}\"")
            created += 1
        elif r.status_code == 409:
            print(f"  - [{artifact_uuid}] already exists, skipped")
            skipped += 1
        else:
            print(f"  ✗ [{artifact_uuid}] FAILED {r.status_code}: {r.text[:120]}")
            failed.append(artifact_uuid)

    print(f"\nDone — created: {created}, skipped: {skipped}, failed: {len(failed)}")
    if failed:
        print("Failed IDs:", failed)
        sys.exit(1)


if __name__ == "__main__":
    main()
