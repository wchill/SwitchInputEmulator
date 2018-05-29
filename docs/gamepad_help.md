---
layout: help
---

## Q: Does it actually work?
### A: Yes, I've personally spent 2 months writing, improving and fine-tuning controller support as best as I possibly can. All the gamepad code is custom and written from scratch so that I can take into account the nuances and quirks of individual controllers on certain browsers/OSes.

## Q: My controller isn't being detected!  
### A: This site uses the HTML5 Gamepad API, which should work in all modern desktop browsers with varying degrees of success. Mobile browsers are unlikely to have support. You can try some of the following things:
* Check to see if [this test page](http://html5gamepad.com) recognizes your controller.
* Check if the controller is actually plugged in/turned on/enabled.
* Press some buttons. Some controllers won't be detected until you do this, and Firefox won't let the page know the controller exists until a button is pressed.
* Close other programs using the gamepad, like Steam.
* Restart your web browser/computer.
* Your controller might need some additional configuration, read the sections below for details.
* It might be a bug. [File a bug report](https://github.com/wchill/SwitchInputEmulator/issues/new)

## Q: My controller mapping is wrong!
### A: If your controller is supported, then the browser/OS vendors may have changed the controller mappings. [Please file a bug report](https://github.com/wchill/SwitchInputEmulator/issues/new) so that I can fix it right away.

## Q: Is my controller supported?
### A: I've personally tested and confirmed that the following controllers work:

✔️ - Works, either fully or mostly. See footnotes if applicable.  
❗ - Works, but requires additional setup.  
❌ - Does not work, see footnotes.  
❔ - I haven't tried this yet. May or may not be easy to add support, but will not work by default unless it has standard mappings.

<table>
  <tr>
    <th></th>
    <th colspan="3">Windows</th>
    <th colspan="3">MacOS</th>
    <th>Chrome OS</th>
  </tr>
  <tr>
    <td></td>
    <td>Chrome</td>
    <td>Firefox</td>
    <td>Edge</td>
    <td>Chrome</td>
    <td>Firefox</td>
    <td>Safari</td>
    <td>Chrome</td>
  </tr>
  <tr>
    <td>Xbox One/360 and XInput controllers</td>
    <td>✔️</td>
    <td>✔️</td>
    <td>❌</td>
    <td>✔️</td>
    <td>❗</td>
    <td>❔</td>
    <td>❌ (1)</td>
  </tr>
  <tr>
    <td>DualShock 4</td>
    <td>✔️</td>
    <td>✔️ (2)</td>
    <td>❔</td>
    <td>✔️</td>
    <td>✔️</td>
    <td>❔</td>
    <td>✔️</td>
  </tr>
  <tr>
    <td>Pro Controller</td>
    <td>❗ (3)</td>
    <td>✔️ (5)</td>
    <td>✔️ (5)</td>
    <td>❌ (7)</td>
    <td>✔️ (4)</td>
    <td>❔</td>
    <td>✔️ (4)</td>
  </tr>
  <tr>
    <td>Joycons</td>
    <td>✔️ (4)</td>
    <td>❗ (4)</td>
    <td>❔</td>
    <td>✔️ (4)</td>
    <td>✔️ (4)</td>
    <td>❔</td>
    <td>✔️ (4)</td>
  </tr>
  <tr>
    <td>PowerA Wired Controller Plus</td>
    <td>✔️</td>
    <td>✔️ (8)</td>
    <td>❔</td>
    <td>✔️</td>
    <td>✔️</td>
    <td>❔</td>
    <td>✔️</td>
  </tr>
</table>

(1) Crashed my Asus C302 Chromebook when plugged in. Not sure about Bluetooth. See [1](https://productforums.google.com/forum/#!msg/chromebook-central/CpDTBrxMls4/xC23TAhkBAAJ) [2](https://www.reddit.com/r/chromeos/comments/8fo5e7/chromebook_completely_crashes_and_shuts_down_when/) [3](https://www.reddit.com/r/chromeos/comments/74wd6f/xbox_one_s_controller_on_chromebook_needs_to_be/) [4](https://www.reddit.com/r/chromeos/comments/6n2e0g/asus_c302ca_xbox_one_controller_issue/) [5](https://www.reddit.com/r/chromeos/comments/61fni2/xbox_one_s_bluetooth_controller_on_chrome_os/)  
(2) The D-Pad does not work fully in Firefox. The touchpad button on a DualShock 4 has been mapped to D-Pad Up. You can perform additional setup to make it be recognized as an Xbox controller, see below. [I have opened a bug in Firefox for this.](https://bugzilla.mozilla.org/show_bug.cgi?id=1464940)  
(3) Until browsers implement USB HID initialization, Bluetooth is required. On Windows, Chrome currently requires a 3rd party driver for the Pro Controller as it does not pick up the left analog stick due to incorrect mappings (see [tracking bug](https://bugs.chromium.org/p/chromium/issues/detail?id=801717)).  
(4) Until browsers implement USB HID initialization, Bluetooth is required.  
(5) Works out of the box, but you cannot be running Steam as it will take over the controller.  
(6) The D-Pad does not work fully in Firefox. Works out of the box, but you cannot be running Steam as it will take over the controller.  
(7) The left analog stick is not detected properly by Chrome (see [tracking bug](https://bugs.chromium.org/p/chromium/issues/detail?id=801717)).  
(8) The D-Pad does not work fully in Firefox. The share and home buttons have been mapped to D-Pad Up and D-Pad down, respectively. [I have opened a bug in Firefox for this.](https://bugzilla.mozilla.org/show_bug.cgi?id=1464940)

## Q: Steam is opening up when I use my controller!
### A: Steam tries to take over controller inputs. I recommend disabling controller support in Steam or exiting Steam.

## Q: My inputs are being overridden/aren't showing up!
### A: In the current iteration, controller input and chat input happens simultaneously and they can override each other. If your input gets overridden, this is completely intentional.

## Q: My Xbox controller doesn't work. How do I make it work?
### A:
* On MacOS/Firefox, you can try [360Controller](https://github.com/360Controller/360Controller).

## Q: My DualShock 4 (PlayStation) controller doesn't work. How do I make it work?!
### A:
* On Windows/Firefox, [try these instructions](http://emulation.gametechwiki.com/index.php/SCP_Driver_Package)

## Q: My Pro Controller/Joycons aren't working. How do I make them work?
### A:
* On Windows, try using [ProconXInput](https://github.com/MTCKC/ProconXInput) or [BetterJoyForCemu](https://github.com/Davidobot/BetterJoyForCemu) or [JoyCon-Driver](https://github.com/mfosse/JoyCon-Driver).
* If using a Pro Controller, [Chrome has a bug where the left analog stick is not recognized.](https://bugs.chromium.org/p/chromium/issues/detail?id=801717)
* If Steam is running, you must disable controller support or close Steam.
* If not on Windows, you must use Bluetooth. USB will not work.

## Q: I have some other controller that isn't working correctly or isn't supported!
### A:
* I *may* be able to add support for your controller. Contact me. Unfortunately, if your controller is marked with an ❌ in the support table, there is nothing I can do as it is up to the OS/browser to fix their stuff.
* On Windows, you could also try using [UCR](https://github.com/Snoothy/UCR). [x360ce](https://github.com/x360ce/x360ce) may also work but will require you to modify browser DLLs which is significantly more advanced.

## Q: Is motion control (gyroscope/accelerometer), vibration, or NFC/amiibo supported?
### A: No, the hardware/firmware implementation I'm using doesn't support this. This may be supported eventually at a later point in time.

## Q: What are those graphs on the right side?
### A: Those are there to help benchmark performance.
* The top graph (FPS) also shows the refresh rate of the controller state, so having the page run at full speed (60+ FPS) is ideal.
* The middle graph displays how long it took to render each frame, and this number should be low to reduce input lag.
* The bottom graph displays the ping time from your computer to the server. You will need to compensate for this ping as well as the stream delay when controlling.

## Q: Something happened that I don't understand!
### A: [File a bug report](https://github.com/wchill/SwitchInputEmulator/issues/new)