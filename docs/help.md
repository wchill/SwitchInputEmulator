---
layout: help
---

## Q: What is this?
### A: A side project that I've been working on since March 2018. You can think of it as a Twitch Plays Switch with some nifty features.

## Q: Why did you make this?
### A: I was bored. Also, I wanted an easy way to use OpenCV to control the Switch, like [this guy](https://www.youtube.com/watch?v=w8kSVKgwpfM).

## Q: How does it work?
### A: At its core, it takes input either from a locally connected controller or via network and relays it to a Nintendo Switch over USB. I used [this project](https://github.com/progmem/Switch-Fightstick) and [this project](https://github.com/shinyquagsire23/Switch-Fightstick) as a base and grafted on everything else. Frankly, very little of the original projects remain.
 
### Currently, I've used the network support to add input support for Twitch/Mixer chat and for a webpage where players can control the Switch via a gamepad.

### I'll be writing up more documentation on the workings of this project at a later date.

## Q: What makes this better than \<insert other implementation here\>?
### A: There are a lot of modifications I've made to mine that aren't present in other versions.

* User friendly, minimal config desktop software.
* I've modified the controller to appear as an officially licensed [Nintendo Switch HORIPAD](https://www.amazon.com/Nintendo-Switch-HORIPAD-Controller-Officially-Licensed/dp/B01NAUATSM) instead of a hacked Pokken Tournament Pad like other implementations. There's no change in features, but the hardware emulation is much more accurate.
* In case the desktop software crashes, the Switch turns off, or the hardware is disconnected, the hardware can recover by simply using the software to reconnect. A sync protocol is in place that brings the hardware into a known state.
* The hardware's firmware buffers an input frame and checks it for data integrity via a fast algorithm before sending it to the Switch, so a crash will never cause random buttons to be pressed. Other implementations naively trust the input sent by the software and are susceptible to this problem.
* Input packets are synchronized to the Switch's poll rate *in hardware*. All commands are mapped to one or more input packets with a certain number of wait frames before the next input packet is processed, so this is as close to TAS as you can get. Most other implementations do not do this and rely on hacks like sleeping for 100ms on the computer side, which can cause variable latency (OS timers are not guaranteed to be accurate) and desyncs for TAS.
* Easier debugging. I've written some code that stubs out the firmware's AVR-specific calls and replaces them with implementations that allow the firmware to be run on desktop. When used in conjunction with something like `socat`, developers can quickly test out changes to the firmware without having to reflash the hardware.
* Other implementations usually only support one input source. By using a TCP server, input commands can be sent from many different clients or feeder sources. This also makes testing very easy since all that is needed to send test inputs is something like `netcat`.
* As far as I know, no other "Twitch Plays" project has ever allowed users to use controllers.
* Chat commands and modifications to gamepad support can be added/modified **while the project is running** and can be modified in most cases without ever touching code!

## Q: How does chat work?
### A: Type in your commands into chat. A bot will relay them to my server and my desktop software will parse the commands and queue up the inputs. Your message must start with a command for it to be recognized.

## Q: What are the chat commands?
### A: In general, the commands look like this (not case sensitive):
* `press <button>` (press button for 0.25 seconds. `press` can be omitted, so just the button name is fine)
* `hold <button>` (hold button until overridden by another input)
* `release <button>` (release button if pressed. can also say `release`/`release all` to release all buttons)
* `move <direction>` (move left analog stick for 0.25 seconds)
* `adjust <direction>` (move left analog stick for 0.125 seconds)
* `look <direction>` (move right analog stick for 0.25 seconds)
* `<special command>` (depends on game)

### The list of valid buttons (not case sensitive):
* A
* B
* X
* Y
* L/LB/L1
* R/RB/R1
* ZL/LT/L2
* ZR/RT/R2
* L3 (analog stick click)
* R3 (analog stick click)
* Up
* Up Right/UpRight
* Right
* Down Right/DownRight
* Down
* Down Left/DownLeft
* Left
* Up Left/UpLeft
* Minus
* Plus

### The list of valid directions (not case sensitive):
* Up/Forward (look only accepts up)
* Down/Backward/Back (look only accepts down)
* Left
* Right

## In addition to the above, commands can be joined together.
* `command1 & command2` executes the commands at the same time (so you can press both A and B simultaneously using `a & b`).
* `command1, command2` executes the commands in series (so `a & b` presses A first, then B).
* These can be combined, for example: `move left, zl & a` moves the left analog stick left, then presses ZL and A simultaneously.
* If two inputs conflict, the latter command has priority. For example, `up & down` will result in only `down` being pressed. `up, down` would work just fine, however.
* Spaces are ignored when combining commands, so `a&b` is fine, for example.

## Q: How do the controllers work?
### A: Plug in a controller into your computer, go to the [gamepad control page](gamepad.md), press a button to activate it, and you're set! You can request a turn by clicking on the controller image. Each turn lasts 20 seconds unless you are the only person waiting for a turn, in which case you will keep your turn after 20 seconds until someone else requests one. Note that chat can and will mess with your inputs!