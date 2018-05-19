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

:heavy_check_mark: - Works, either fully or mostly. See footnotes if applicable.  
:heavy_exclamation_mark: - Works, but requires additional setup.  
:x: - Does not work, see footnotes.  
:grey_question: - I haven't tried this yet. May or may not be easy to add support.

### Windows
| | Chrome | Firefox | Edge
| --- | --- | --- | ---
| Xbox/Xinput controller | :heavy_check_mark: | :heavy_check_mark: | :x: (1)
| DualShock 4 controller | :heavy_check_mark: | :heavy_check_mark: (2) | :x: (3)
| Pro Controller | :heavy_exclamation_mark: (4) | :heavy_exclamation_mark: (4) | :grey_question:
| Joycons | :heavy_exclamation_mark: (4) | :heavy_exclamation_mark: (4) | :grey_question:
| PowerA Wired Controller Plus | :heavy_check_mark: | :heavy_check_mark: (5) | :grey_question:

(1) Technically works, but sometimes Edge does weird things like making the controller control the browser itself. Not recommended.  
(2) The D-Pad does not work fully in Firefox. The touchpad button on a DualShock 4 has been mapped to D-Pad Up. You can perform additional setup to make it be recognized as an Xbox controller, see below.  
(3) Not detected at all by Edge without additional setup, see below.  
(4) Requires additional setup, see below.  
(5) The D-Pad does not work fully in Firefox. The share button has been mapped to D-Pad Up and the home button has been mapped to D-Pad Down.

### MacOS
| | Chrome | Firefox | Safari
| --- | --- | --- | ---
| Xbox/Xinput controller | :heavy_check_mark: | :x: (1) | :grey_question:
| DualShock 4 controller | :heavy_check_mark: | :heavy_check_mark: | :grey_question:
| Pro Controller | :x: (2) | :heavy_check_mark: (3) | :grey_question:
| Joycons | :heavy_check_mark: (3) | :heavy_check_mark: (3) | :grey_question:
| PowerA Wired Controller Plus | :heavy_check_mark: | :heavy_check_mark: | :grey_question:

(1) Not detected at all by Firefox without additional setup, see below.  
(2) The left analog stick does not work in Chrome.  
(3) Bluetooth is required; USB does not work.

### Chrome OS
| | Chrome
| --- | ---
| Xbox/Xinput controller | :x: (1)
| DualShock controller | :heavy_check_mark:
| Pro Controller | :heavy_check_mark: (2)
| Joycons | :heavy_check_mark: (2)
| PowerA Wired Controller Plus | :heavy_check_mark:

(1) Crashed my Asus C302 Chromebook when plugged in.  
(2) Bluetooth is required; USB does not work.

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