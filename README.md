# Teti README

Hosted on github pages [here](https://titanplayz100.github.io/teti/)

The info page can be found [here](https://titanplayz100.github.io/teti/info.html)

## Desktop App
All the information is in the tauri branch, can download in releases


## Data Formats
### Gamemodes Format
```json
"*": {
    settings: {}, // default settings that are applied to all games, can be overridden
    displayName: "", // name shown on gamemode selection
    objectiveText: "", // subtext displayed on right side
    goalStat: "", // stat being tracked (valid property in stats class)
    target: "", // target (valid target in settings)
    result: "", // displayed as result (another valid stat in stats class)
    music: "", // to be implemented, custom song that can play 
    pbmusic: "", // to be implemented, custom song that played on pb pace
    skin: "", // to be implemented
    board: "", // starting board, tetrio map format
    sidebar: [], // sidebar stats that are displayed
    background: "", // custom background / effects
},
```
