# Twitch Chat Overlay
TwitchChatOverlay is a simple HTML and JS file that displays your Twitch chat overlay on your streams. This project does not rely on any third-party server, ensuring privacy and simplicity.

## Features
- Real-time display of Twitch chat messages.
- Supports multiple chat boxes with different settings.
- Highly customizable overlay appearance using CSS.
- Emote support for Twitch, BetterTTV, 7TV, and FrankerFaceZ.
- Bot filtering through a built-in bot list or user-defined settings.
  
## Installation

1. **Download and Uncompress the Release:**
   - Download the latest version of [TwitchChatOverlay](https://github.com/Err0rTV/TwitchChatOverlay/releases) and uncompress the file.

2. **Get Your Twitch Chat Token:**
   - Go to [Twitch Chat OAuth Token Generator](https://twitchapps.com/tmi/) to get your token.

3. **Configure in OBS:**
   - Add a new browser source in OBS.
   - Check the "Local file" option.
   - Browse to the `OBSTwitchChat.html` location in the uncompressed folder.
   - Replace the OBS Browser Custom CSS with this:

4. Replace OBS Browser Custom CSS with this:
    ```css
    .chat { 
        --chatbox-messagesHideDelay: 15;
        --chatbox-token: oauth:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
    }
    ```
5. Replace oauth:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa with your Twitch chat token.
6. Click "OK".
7. Optionaly start OBS with ```--disable-web-security``` to enable clip previews

## Configuration Parameters

The `TwitchChatOverlay` allows for several configuration parameters to customize the behavior and appearance of the chat overlay. Below are the descriptions and usage for the two key parameters:

### `--chatbox-token`

**Description:**
This parameter stores the OAuth token required to authenticate with the Twitch API and fetch chat messages. This token is essential for the overlay to function and display real-time chat messages.

**Usage:**
Replace the placeholder oauth:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa with your actual Twitch OAuth token obtained from the Twitch Chat OAuth Token Generator.

**Example:**
```css
.chat {
    --chatbox-token: oauth:your_actual_oauth_token_here;
}
```

### `--chatbox-messagesHideDelay`

**Description:**
This parameter controls the delay in seconds before chat messages are hidden from the overlay. 

**Usage:**
Set this parameter to define how long a message will be displayed before it disappears. For example, setting it to `15` will hide messages after 15 seconds. 

If set to `0`, messages will never hide and will remain visible indefinitely.

**Example:**
```css
.chat {
    --chatbox-messagesHideDelay: 15;
}
```

## Acknowledgments
- Thanks to Twitch Chat OAuth Token Generator for providing the token
- Thanks to [tmi.js](https://tmijs.com/) for this amazing lib
- Special thanks to [Urushiyowa](https://www.twitch.tv/urushiyowa), [Der_Richterrr](https://www.twitch.tv/der_richterrr) and [Zaktael](https://www.twitch.tv/zaktael) for their hours of support, feedback, and patches
- And to everyone else who contributed to this project—thank you!
