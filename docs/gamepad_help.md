---
layout: help
---

## Q: My controller isn't being detected!  
### A: This site uses the HTML5 Gamepad API, which should work in all modern desktop browsers with varying degrees of success. Mobile browsers are unlikely to have support. You can try some of the following things:
* Check to see if [this test page](http://html5gamepad.com) recognizes your controller.
* Check if the controller is actually plugged in/turned on/enabled.
* Press some buttons. Some controllers won't be detected until you do this, and Firefox won't let the page know the controller exists until a button is pressed.
* Close other programs using the gamepad.
* Restart your web browser/computer. Chrome especially loves to stop detecting controller input if you close the gamepad page.
* Your controller might need some additional configuration, read the sections below for details.

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
    <td>❌ (1)</td>
    <td>✔️</td>
    <td>❗</td>
    <td>❔</td>
    <td>❌ (2)</td>
  </tr>
  <tr>
    <td>DualShock 4</td>
    <td>✔️</td>
    <td>✔️ (3)</td>
    <td>❔</td>
    <td>✔️</td>
    <td>✔️</td>
    <td>❔</td>
    <td>✔️</td>
  </tr>
  <tr>
    <td>Pro Controller</td>
    <td>❗ (4)</td>
    <td>✔️ (5)</td>
    <td>✔️ (5)</td>
    <td>❌ (6)</td>
    <td>✔️ (4)</td>
    <td>❔</td>
    <td>✔️ (4)</td>
  </tr>
  <tr>
    <td>Joycons</td>
    <td>❗ (4)</td>
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
    <td>✔️ (7)</td>
    <td>❔</td>
    <td>✔️</td>
    <td>✔️</td>
    <td>❔</td>
    <td>✔️</td>
  </tr>
</table>

(1) Technically works, but sometimes Edge does weird things like making the controller control the browser itself. Not recommended.  
(2) Crashed my Asus C302 Chromebook when plugged in.  
(3) The D-Pad does not work fully in Firefox. The touchpad button on a DualShock 4 has been mapped to D-Pad Up. You can perform additional setup to make it be recognized as an Xbox controller, see below.  
(4) You must use Bluetooth unless you are using a 3rd party driver, even on MacOS and Chrome OS. On Windows, Chrome requires a 3rd party driver as it does not pick up the left analog stick.  
(5) Works out of the box, but you cannot be running Steam as it will take over the controller.  
(6) Technically works, but the left analog stick is not detected properly by Chrome. Not recommended.  
(7) The D-Pad does not work fully in Firefox. The share and home buttons have been mapped to D-Pad Up and D-Pad down, respectively.

## Q: My inputs are being overridden/aren't showing up!
### A: In the current iteration, controller input and chat input happens simultaneously and they can override each other. If your input gets overridden, this is completely intentional.

## Q: My Xbox controller doesn't work. How do I make it work?
### A:
* On MacOS/Firefox, you can try [360Controller](https://github.com/360Controller/360Controller).

## Q: My DualShock 4 (PlayStation) controller doesn't work. How do I make it work?!
### A:
* On Windows/Firefox, [try these instructions](http://emulation.gametechwiki.com/index.php/SCP_Driver_Package)

## Q: What do I need to do to make my Pro Controller/Joycons work?
### A:
* On Windows, try using [ProconXInput](https://github.com/MTCKC/ProconXInput) or [BetterJoyForCemu](https://github.com/Davidobot/BetterJoyForCemu) or [JoyCon-Driver](https://github.com/mfosse/JoyCon-Driver).
* If using a Pro Controller, MacOS/Chrome will not work. This is a browser limitation.
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