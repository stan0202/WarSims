import urllib.request
import os

sounds = {
    "bgm.ogg": "https://upload.wikimedia.org/wikipedia/commons/4/4c/A_Battle_of_Wills.ogg",
    "hit.ogg": "https://upload.wikimedia.org/wikipedia/commons/3/30/Punch_02.ogg",
    "crit.ogg": "https://upload.wikimedia.org/wikipedia/commons/5/52/Explosion_3.ogg",
    "die.ogg": "https://upload.wikimedia.org/wikipedia/commons/d/df/Scream_1.ogg"
}

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')]
urllib.request.install_opener(opener)

for filename, url in sounds.items():
    print(f"Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, filename)
        print(f"Success: {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
