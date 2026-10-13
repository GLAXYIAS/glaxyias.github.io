import os
import re
import requests

GITHUB_USER = "whatchamacallitexe"
MAIN_JS_PATH = "JS/main.js"  # Targeted your JS folder path

def get_user_repositories(username):
    """Fetch all public repos owned by the user."""
    url = f"https://api.github.com/users/{username}/repos?per_page=100"
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Authorization": f"token {token}"} if token else {}
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"⚠️ Failed to fetch repositories for {username}: {response.status_code}")
        return []
    
    repos = response.json()
    return [repo["name"] for repo in repos if not repo["fork"]]

def discover_games_in_repo(repo_name):
    """
    Finds games by looking for index.html files in the repository.
    Handles both root-level games and subfolder games.
    """
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Authorization": f"token {token}"} if token else {}
    
    url = f"https://api.github.com/repos/{GITHUB_USER}/{repo_name}/git/trees/HEAD?recursive=1"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"⚠️ Could not fetch tree for {repo_name}: {response.status_code}")
        return []
    
    tree = response.json().get("tree", [])
    games = []

    for item in tree:
        path = item["path"]
        
        # Look for index.html files that define a game entry point
        if item["type"] == "blob" and path.lower().endswith("index.html"):
            parts = path.split('/')
            
            if len(parts) == 1:
                # Game is at repo root: https://whatchamacallitexe.github.io/repo-name/
                game_id = repo_name.lower()
                game_url = f"https://{GITHUB_USER}.github.io/{repo_name}/"
            else:
                # Game is in a subfolder: https://whatchamacallitexe.github.io/repo-name/folder-name/
                folder_name = parts[-2]
                game_id = folder_name.lower()
                game_url = f"https://{GITHUB_USER}.github.io/{repo_name}/{folder_name}/"

            clean_title = game_id.replace('-', ' ').replace('_', ' ').title()

            games.append({
                "id": game_id,
                "title": clean_title,
                "url": game_url,
                "desc": f"Play {clean_title} online in your browser.",
                "popular": False
            })

    return games

def update_main_js(discovered_games):
    if not os.path.exists(MAIN_JS_PATH):
        print(f"❌ File not found at path: {MAIN_JS_PATH}")
        return False

    with open(MAIN_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the _0xData array definition
    pattern = r"(let\s+_0xData\s*=\s*\[)([\s\S]*?)(\];)"
    match = re.search(pattern, content)
    
    if not match:
        print("❌ Could not locate 'let _0xData = [...]' in JS/main.js")
        return False

    prefix, existing_array_body, suffix = match.groups()

    # Get already tracked IDs to prevent duplicates
    existing_ids = set(re.findall(r'id:\s*["\']([^"\']+)["\']', existing_array_body))

    new_entries = []
    added_count = 0

    for game in discovered_games:
        if game["id"] in existing_ids:
            continue

        entry = (
            f'  {{\n'
            f'    id: "{game["id"]}",\n'
            f'    title: "{game["title"]}",\n'
            f'    url: "{game["url"]}",\n'
            f'    desc: "{game["desc"]}",\n'
            f'    popular: false\n'
            f'  }}'
        )
        new_entries.append(entry)
        existing_ids.add(game["id"])
        added_count += 1

    if added_count == 0:
        print("No new games found to add.")
        return False

    new_entries_str = ",\n".join(new_entries)

    if existing_array_body.strip():
        cleaned_body = existing_array_body.rstrip().rstrip(',')
        updated_array = f"{prefix}{cleaned_body},\n{new_entries_str}\n{suffix}"
    else:
        updated_array = f"{prefix}\n{new_entries_str}\n{suffix}"

    updated_content = content[:match.start()] + updated_array + content[match.end():]

    with open(MAIN_JS_PATH, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"✅ Successfully added {added_count} new game(s) to {MAIN_JS_PATH}!")
    return True

def main():
    print(f"Fetching repositories for user: {GITHUB_USER}...")
    repos = get_user_repositories(GITHUB_USER)
    
    all_discovered_games = []

    for repo in repos:
        print(f"Scanning {repo}...")
        games = discover_games_in_repo(repo)
        all_discovered_games.extend(games)

    update_main_js(all_discovered_games)

if __name__ == "__main__":
    main()
