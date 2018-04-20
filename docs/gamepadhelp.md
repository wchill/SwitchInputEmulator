---
layout: help
---

## Q: My controller isn't being detected!  
### A: This site uses the HTML5 Gamepad API, which should work in all modern desktop browsers. Mobile browsers are unlikely to have support. You can try some of the following things:
* Check if the controller is actually plugged in/turned on/enabled
* Press some buttons. Some controllers won't be detected until you do this, and Firefox won't let the page know the controller exists until a button is pressed.
* Close other programs using the gamepad.
* Restart your web browser/computer.

## Q: Why is the page showing an Xbox controller? I'm using a (Dualshock 4/Pro Controller/other controller)!
### A: I haven't written code to support those controllers and layouts yet. Controllers other than the Xbox One controller should work, but there are no guarantees of support until I get around to it. [You can open a bug](https://github.com/wchill/SwitchInputEmulator/issues/new) if there is something drastically wrong with how a controller is behaving.

## Q: What are those graphs on the right side?
### A: Those are there to help benchmark performance.
* The top graph (FPS) also shows the refresh rate of the controller state, so having the page run at full speed (60+ FPS) is ideal.
* The middle graph displays how long it took to render each frame, and this number should be low to reduce input lag.
* The bottom graph displays the ping time from your computer to the server. You will need to compensate for this ping as well as the stream delay when controlling.

## Q: My inputs are being overridden/aren't showing up!
### A: In the current iteration, controller input and chat input happens simultaneously and they can override each other. If your input gets overridden, just try your input again.

## Q: Something happened that I don't understand!
### A: [File a bug report](https://github.com/wchill/SwitchInputEmulator/issues/new)