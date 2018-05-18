---
layout: help
---

## Q: My controller isn't being detected!  
### A: This site uses the HTML5 Gamepad API, which should work in all modern desktop browsers with varying degrees of success. Mobile browsers are unlikely to have support. You can try some of the following things:
* Check to see if [this test page](http://html5gamepad.com) recognizes your controller.
* Check if the controller is actually plugged in/turned on/enabled.
* Press some buttons. Some controllers won't be detected until you do this, and Firefox won't let the page know the controller exists until a button is pressed.
* Close other programs using the gamepad.
* Restart your web browser/computer.
* Your controller might need some additional configuration, read the sections below for details.

## Q: Is my controller supported?
### A: I've personally tested and confirmed that the following controllers work:
* Windows
    * Xbox One controller
        * Xbox 360 controllers and anything else that's exposed as an Xinput controller should also work.
    * DualShock 4 (PS4) controller
        * Chrome detects this as an XInput controller without problems.
        * In Firefox, the D-Pad does not work (Firefox does not detect it). Instead, the center button has been mapped to D-Pad up.
        * Edge does not detect this controller at all.
        * You can install 3rd party tools to make it show up as an Xbox controller instead. See below.
    * Switch Pro Controller
        * Does not work at all over USB without additional setup. See below.
        * Bluetooth *may* work, but this hasn't been tested.
* MacOS
    * Xbox One controller
        * Firefox does not detect this controller at all.
        * You can try installing [360Controller](https://github.com/360Controller/360Controller) to make this work.
    * DualShock 4 (PS4) controller
        * Chrome detects this as an XInput controller without problems.
        * Firefox detects this controller, but uses nonstandard mappings.
    * Switch Pro Controller
        * Does not work under Chrome (the left analog stick is not detected).
        * Firefox detects this controller, but uses nonstandard mappings.
        * Does not work at all over USB, Bluetooth is required.
* Joycons are currently unsupported without an external program.

## Q: Why is the page showing an Xbox controller? I'm using a (Dualshock 4/Pro Controller/other controller)!
### A: Your browser is reporting your controller as an Xbox controller, which makes it impossible to detect if it's anything else. Alternatively, I haven't gotten around to making sprite sheets for your controller yet.

## Q: My inputs are being overridden/aren't showing up!
### A: In the current iteration, controller input and chat input happens simultaneously and they can override each other. If your input gets overridden, this is completely intentional.

## Q: My DualShock 2/3/4 (PlayStation) controller isn't being detected/isn't responding/is showing up as "Unsupported"!
### A: DualShock support is very finicky and experimental. Unfortunately there's not much I can do from my end about this.
* If you're using Windows, [I would recommend trying the instructions on this page to make Windows recognize it as an Xbox controller.](http://emulation.gametechwiki.com/index.php/SCP_Driver_Package)

## Q: My Switch Pro Controller isn't being detected/isn't responding/is showing up as "Unsupported"!
### A: Switch Pro Controller support also is very finicky. Try using Bluetooth instead of USB.
* Under Windows, try using [ProconXInput](https://github.com/MTCKC/ProconXInput) or [BetterJoyForCemu](https://github.com/Davidobot/BetterJoyForCemu) or [JoyCon-Driver](https://github.com/mfosse/JoyCon-Driver).
* Under MacOS, try using Firefox. You must use Bluetooth as USB input does not work.
* Under Chrome OS (but not regular Chrome), it seems to work natively when using Bluetooth. USB support seems to be broken.

## Q: I have some other controller that isn't working correctly or isn't supported!
### A: See if your controller has a way to show up as an XInput controller - this might take the form of a hardware switch.
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