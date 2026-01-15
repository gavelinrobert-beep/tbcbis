# TBC Classic BiS Tracker 🔥

## Description
Web-based Best-in-Slot gear tracker for WoW TBC Classic powered by WoWSims data.

## Features
- Browse BiS by class/spec/phase
- Direct Wowhead links with tooltips
- Clean mobile-friendly interface
- MIT licensed data from WoWSims
- Auto-updates capability

## Live Demo
Check out our [Live Demo](https://your-github-pages-url.com).

## How It Works
- Parses gear presets from WoWSims TBC repo.
- Extracts BiS item lists per class/spec.
- Presents in easy navigation.

## Local Development
To clone the repository and open it:
```
git clone https://github.com/gavelinrobert-beep/tbcbis.git
cd tbcbis
```

## Updating Data
To update the data, run the following commands:
```
pip install requests
python data/parser.py
git commit -m "Updated data"
```

## Credits
Thanks to WoWSims and Wowhead for their awesome resources.

## License
This project is licensed under the MIT License.