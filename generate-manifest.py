"""
Generate a manifest.json from your Cloudflare R2 bucket using S3 API.
Run this script to scan all PDFs in your bucket and create a catalog file.

Usage:
    python generate-manifest.py

Requires:
    pip install boto3
"""

import boto3
import json
import os
import re
from pathlib import Path

# --- CONFIGURATION - Fill these in ---
ACCOUNT_ID = "3373715dd360a53e821072c2f07cc024"
ACCESS_KEY_ID = ""  # Your R2 S3 Access Key
SECRET_ACCESS_KEY = ""  # Your R2 S3 Secret Access Key
BUCKET_NAME = "books"
PUBLIC_URL = "https://pub-ccb8f8828bb74d5c900406b84e2dea36.r2.dev"
OUTPUT_FILE = "manifest.json"

# Category mapping based on folder names
CATEGORY_OVERRIDES = {
    "alchemy": "Alchemy & Hermeticism",
    "astrology": "Astrology",
    "buddhism": "Buddhism",
    "christianity": "Christianity",
    "egyptian": "Ancient Egypt",
    "gnostic": "Gnosticism",
    "hinduism": "Hinduism",
    "islam": "Islam",
    "judaism": "Judaism",
    "kabbalah": "Kabbalah",
    "magick": "Magick & Occult",
    "meditation": "Meditation",
    "mysticism": "Mysticism",
    "philosophy": "Philosophy",
    "taoism": "Taoism",
    "witchcraft": "Witchcraft",
    "wicca": "Wicca",
    "yoga": "Yoga",
    "zen": "Zen",
}


def list_all_objects(s3_client, bucket):
    """List all objects in the bucket using pagination."""
    objects = []
    paginator = s3_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket)

    for page in pages:
        if "Contents" in page:
            objects.extend(page["Contents"])

    return objects


def clean_title(filename):
    """Extract a clean title from a filename."""
    name = Path(filename).stem  # Remove extension
    name = re.sub(r"[-_]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    # Capitalize properly
    name = " ".join(word.capitalize() if word.lower() not in ["the", "a", "an", "of", "in", "and", "or", "to", "for"] else word.lower() for word in name.split())
    name = name[0].upper() + name[1:] if name else name
    return name


def extract_category(filepath):
    """Extract category from the first folder in the path."""
    parts = filepath.split("/")
    if len(parts) >= 2:
        folder = parts[0].lower()
        return CATEGORY_OVERRIDES.get(folder, folder.title())
    return "Uncategorized"


def extract_author(filename):
    """Try to extract author from filename patterns like 'Title - Author.pdf'"""
    name = Path(filename).stem
    if " - " in name:
        parts = name.split(" - ", 1)
        return parts[-1].strip()
    return None


def create_manifest():
    """Main function to generate manifest.json."""
    print("Connecting to R2...")

    if not ACCESS_KEY_ID or not SECRET_ACCESS_KEY:
        print("\n⚠️  You need to set your R2 S3 credentials!")
        print("Go to Cloudflare R2 Dashboard → your bucket → Manage R2 API Tokens")
        print("Then edit this script and fill in ACCESS_KEY_ID and SECRET_ACCESS_KEY\n")
        print("You can also manually create a manifest.json structure like:")
        print(json.dumps({
            "books": [
                {
                    "id": "alchemy-ancient-science",
                    "title": "Alchemy - The Ancient Science",
                    "category": "Alchemy & Hermeticism",
                    "author": None,
                    "filename": "Alchemy - The Ancient Science.pdf",
                    "folder": "Alchemy",
                    "url": "https://pub-ccb8f8828bb74d5c900406b84e2dea36.r2.dev/books/Alchemy/Alchemy%20-%20The%20Ancient%20Science.pdf",
                }
            ]
        }, indent=2))
        return

    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        region_name="enam",
    )

    print(f"Listing objects in bucket '{BUCKET_NAME}'...")
    objects = list_all_objects(s3, BUCKET_NAME)
    print(f"Found {len(objects)} objects")

    # Filter to PDF files only
    pdf_files = [obj for obj in objects if obj["Key"].lower().endswith(".pdf")]
    print(f"Found {len(pdf_files)} PDF files")

    books = []
    for i, obj in enumerate(pdf_files):
        filepath = obj["Key"]
        filename = filepath.split("/")[-1]
        folder = filepath.split("/")[0] if "/" in filepath else ""
        url_safe_path = "/".join(
            requests.utils.quote(part) for part in filepath.split("/")
        )

        book = {
            "id": f"book_{i + 1}",
            "title": clean_title(filename),
            "category": extract_category(filepath),
            "author": extract_author(filename),
            "filename": filename,
            "folder": folder,
            "url": f"{PUBLIC_URL}/{BUCKET_NAME}/{url_safe_path}",
        }
        books.append(book)

    manifest = {
        "total_books": len(books),
        "generated": os.path.basename(__file__),
        "books": books,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Manifest saved to {OUTPUT_FILE}")
    print(f"   Contains {len(books)} books")

    # Print categories summary
    categories = set(b["category"] for b in books)
    print(f"   Categories: {', '.join(sorted(categories))}")

    # Print first few books as preview
    print(f"\nPreview (first 5 books):")
    for b in books[:5]:
        print(f"  - {b['title']} ({b['category']})")

    print(f"\n📤 Upload '{OUTPUT_FILE}' to your R2 bucket:")
    print(f"   {PUBLIC_URL}/{BUCKET_NAME}/{OUTPUT_FILE}")


if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print("Installing requests library...")
        os.system("pip install requests")
        import requests
    create_manifest()