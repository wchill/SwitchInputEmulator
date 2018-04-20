## SwitchInputEmulator
USB Controller Emulator for the Nintendo Switch

Uses the LUFA library and reverse-engineering of the HORIPAD for Nintendo Switch for accurate controller emulation. Can be controlled either directly via serial port or via the cross-platform Qt application.

For more details, read the [project site](https://switch.chilly.codes)

### Wait, what?
On June 20, 2017, Nintendo released System Update v3.0.0 for the Nintendo Switch. Along with a number of additional features that were advertised or noted in the changelog, additional hidden features were added. One of those features allows for the use of compatible USB controllers on the Nintendo Switch, such as the Pokken Tournament Pro Pad.

Unlike the Wii U, which handles these controllers on a 'per-game' basis, the Switch treats the Pokken controller as if it was a Switch Pro Controller. Along with having the icon for the Pro Controller, it functions just like it in terms of using it in other games, apart from the lack of physical controls such as analog sticks, the buttons for the stick clicks, or other system buttons such as Home or Capture.

The original version of the code that this repo is based off of emulated the Pokken Tournament Pro Pad, but changes have been made to support the HORIPAD wired controller for Nintendo Switch instead. In addition, many additional features/improvements have been added.

### Setup

#### Prerequisites
* A LUFA-compatible microcontroller such as the Teensy 2.0++, Arduino UNO R3, or the Arduino Micro
* A USB-to-UART adapter. In a pinch, an Arduino UNO R3 with the ATMega328p disabled (connect RESET to GND) will work.
* A machine running Linux or MacOS. Currently there are issues running under Windows.

#### Compiling and Flashing onto the Teensy 2.0++
Go to the Teensy website and download/install the [Teensy Loader application](https://www.pjrc.com/teensy/loader.html). For Linux, follow their instructions for installing the [GCC Compiler and Tools](https://www.pjrc.com/teensy/gcc.html). For Windows, you will need the [latest AVR toolchain](http://www.atmel.com/tools/atmelavrtoolchainforwindows.aspx) from the Atmel site. See [this issue](https://github.com/LightningStalker/Splatmeme-Printer/issues/10) and [this thread](http://gbatemp.net/threads/how-to-use-shinyquagsires-splatoon-2-post-printer.479497/) on GBAtemp for more information. (Note for Mac users - the AVR MacPack is now called AVR CrossPack. If that does not work, you can try installing `avr-gcc` with `brew`.)

Next, you need to grab the LUFA library. You can download it in a zipped folder at the bottom of [this page](http://www.fourwalledcubicle.com/LUFA.php). Unzip the folder, rename it `LUFA`, and place it where you like. Then, download or clone the contents of this repository onto your computer. Next, you'll need to make sure the `LUFA_PATH` inside of the `makefile` points to the `LUFA` subdirectory inside your `LUFA` directory. My `Switch-Fightstick` directory is in the same directory as my `LUFA` directory, so I set `LUFA_PATH = ../LUFA/LUFA`.

Now you should be ready to rock. Open a terminal window in the `Switch-Fightstick` directory, type `make`, and hit enter to compile. If all goes well, the printout in the terminal will let you know it finished the build! Follow the directions on flashing `Joystick.hex` onto your Teensy, which can be found page where you downloaded the Teensy Loader application.

#### Compiling and Flashing onto the Arduino UNO R3
You will need to set your [Arduino in DFU mode](https://www.arduino.cc/en/Hacking/DFUProgramming8U2), and flash its USB controller. (Note for Mac users - try [brew](https://brew.sh/index_it.html) to install the dfu-programmer with `brew install dfu-programmer`.) Setting an Arduino UNO R3 in DFU mode is quite easy, all you need is a jumper (the boards come with the needed pins in place). Please note that once the board is flashed, you will need to flash it back with the original firmware to make it work again as a standard Arduino. To compile this project you will need the AVR GCC Compiler and Tools. (Again for Mac users - try brew, adding the [osx-cross/avr](osx-cross/avr) repository, all you need to do is to type `brew tap osx-cross/avr` and `brew install avr-gcc`.) Next, you need to grab the LUFA library: download and install it following the steps described for the Teensy 2.0++.

Finally, open a terminal window in the `Switch-InputEmulator` directory, edit the `makefile` setting `MCU = atmega16u2`, and compile by typing `make`. Follow the [DFU mode directions](https://www.arduino.cc/en/Hacking/DFUProgramming8U2) to flash `Joystick.hex` onto your Arduino UNO R3 and you are done.

#### Compiling and Flashing onto the Arduino Micro
The Arduino Micro is more like the Teensy in that it has a single microcontroller that communicates directly over USB. Most of the steps are the same as those for the Teensy, except do not download Teensy Loader program. You will also need to edit `makefile` before issuing `make`. Change `MCU = at90usb1286` on line 15 to `MCU = atmega32u4`.

Once finished building, start up Arduino IDE. Under `File -> Preferences`, check `Show verbose output during: upload` and pick OK. With the Arduino plugged in and properly selected under `Tools`, upload any sketch. Find the line with `avrdude` and copy the entire `avrdude` command and all options into a terminal, replacing the `.hex` file and path to the location of the `Joystick.hex` created in the previous step. Also make sure the `-P/dev/??` port is the same as what Arduino IDE is currently reporting. Now double tap the reset button on the Arduino and quickly press Enter in the terminal. This may take several tries. You may need to press Enter first and then the reset button or try various timings. Eventually, `avrdude` should report success. Store the `avrdude` command in a text file or somewhere safe since you will need it every time you want to print a new image.

Sometimes, the Arduino will show up under a different port, so you may need to run Arduino IDE again to see the current port of your Micro.

If you ever need to use your Arduino Micro with Arduino IDE again, the process is somewhat similar. Upload your sketch in the usual way and double tap reset button on the Arduino. It may take several tries and various timings, but should eventually be successful.

The Arduino Leonardo is theoretically compatible, but has not been tested. It also has the ATmega32u4, and is layed out somewhat similar to the Micro.
