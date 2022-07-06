# Twitch Chat Overlay

## Installation

1. Download the [Release](https://github.com/Err0rTV/TwitchChatOverlay/releases) of TwitchChatOverlay from and uncompress it.
3. Get your twitch chat token here : https://twitchapps.com/tmi/
4. Add a new Browser source in OBS.
5. Check "Local file".
6. Browse to the OBSTwitchChat.html location.
7. Replace OBS Browser Custom CSS with this:
    ```css
    .chat { 
        --chatbox-hideMessages: 0;
        --chatbox-token: oauth:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
    }
    ```
7. Click "OK".
