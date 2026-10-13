import os
import re
import json
import requests

# Repositories to scan
REPOSITORIES = [
    "owner-name/game-repo-1",
    "owner-name/game-repo-2",
]

MAIN_JS_PATH = "main.js"

def get_repo_files(repo):
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Authorization": f"token {token}"} if token else {}
    
    url = f"https://api.github.com/repos/{repo}/git/trees/HEAD?recursive=1"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"⚠️ Could not fetch tree for {repo}: {response.status_code}")
        return []
    
    tree = response.json().get("tree", [])
    files = []
    
    for item in tree:
        if item["type"] == "blob" and item["path"].endswith(".html"):
            files.append(item["path"])
            
    return files

def slugify(text):
    return re.sub(r'[^a-z0-9_]', '', text.lower().replace(' ', '_'))

def update_main_js(new_games):
    if not os.path.exists(MAIN_JS_PATH):
        print(f"❌ Error: {MAIN_JS_PATH} not found.")
        return False

    with open(MAIN_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Locate let _0xData = [...]
    pattern = r"(let\s+_0xData\s*=\s*\[)([\s\S]*?)(\];)"
    match = re.search(pattern, content)
    
    if not match:
        print("❌ Could not locate 'let _0xData = [...]' in main.js")
        return False

    prefix, existing_array_body, suffix = match.groups()

    # Extract existing IDs to prevent duplicates
    existing_ids = set(re.findall(r'id:\s*["\']([^"\']+)["\']', existing_array_body))

    formatted_entries = []
    added_count = 0

    for game in new_games:
        if game["id"] in existing_ids:
            continue

        entry = (
            f'  {{\n'
            f'    id: "{game["id"]}",\n'
            f'    title: "{game["title"]}",\n'
            f'    url: "{game["url"]}",\n'
            f'    image: "{game["image"]}",\n'
            f'    desc: "{game["desc"]}",\n'
            f'    popular: false\n'
            f'  }}'
        )
        formatted_entries.append(entry)
        existing_ids.add(game["id"])
        added_count += 1

    if added_count == 0:
        print("No new games to add to main.js.")
        return False

    # Insert new items into the array
    new_entries_str = ",\n".join(formatted_entries)
    
    if existing_array_body.strip():
        # Ensure trailing comma on existing list before appending
        cleaned_body = existing_array_body.rstrip().rstrip(',')
        updated_array = f"{prefix}{cleaned_body},\n{new_entries_str}\n{suffix}"
    else:
        updated_array = f"{prefix}\n{new_entries_str}\n{suffix}"

    updated_content = content[:match.start()] + updated_array + content[match.end():]

    with open(MAIN_JS_PATH, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"✅ Successfully added {added_count} new game(s) to main.js!")
    return True

def main():
    discovered_games = []

    for repo in REPOSITORIES:
        print(f"Scanning {repo}...")
        html_files = get_repo_files(repo)
        
        for file_path in html_files:
            # Generate game metadata based on path structure
            filename = os.path.basename(file_path)
            raw_title = os.path.splitext(filename)[0]
            if raw_title.lower() in ["index", "main"]:
                # Use parent directory name if filename is index.html
                parts = file_path.split('/')
                raw_title = parts[-2] if len(parts) > 1 else repo.split('/')[1]

            clean_title = raw_title.replace('-', ' ').replace('_', ' ').title()
            game_id = slugify(raw_title)
            
            # Construct relative URLs matching your structure
            game_url = f"../Games/{repo.split('/')[1]}/{file_path}"
            image_url = f"../Games/{repo.split('/')[1]}/images/{game_id}.jpeg"

            discovered_games.append({
                "id": game_id,
                "title": clean_title,
                "url": game_url,
                "image": image_url,
                "desc": f"Play {clean_title} online.",
            })

    update_main_js(discovered_games)

if __name__ == "__main__":
    main()
