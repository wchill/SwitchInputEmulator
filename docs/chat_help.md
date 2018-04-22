---
layout: help
---

# Notes
* `command1 & command2` executes the commands at the same time (so you can press both A and B simultaneously using `a & b`).
* `command1, command2` executes the commands in series (so `a & b` presses A first, then B).
* These can be combined, for example: `move left, zl & a` moves the left analog stick left, then presses ZL and A simultaneously.
* If two inputs conflict, the latter command has priority. For example, `up & down` will result in only `down` being pressed. `up, down` would work just fine, however.
* Spaces are ignored when combining commands, so `a&b` is fine, for example.

### Button commands
* press <parameter>
    * Presses the specified button for 500ms. Just the button name can also be used
    * Allowed parameters: `a, b, x, y, l, lb, l1, r, rb, r1, zl, lt, l2, zr, rt, r2, minus, -, plus, +, l3, r3`

* hold <parameter>
    * Holds the specified button
    * Allowed parameters: `a, b, x, y, l, lb, l1, r, rb, r1, zl, lt, l2, zr, rt, r2, minus, -, plus, +, l3, r3`

* release <parameter>
    * Aliases: *rel*
    * Releases the specified button
    * Allowed parameters: `a, b, x, y, l, lb, l1, r, rb, r1, zl, lt, l2, zr, rt, r2, minus, -, plus, +, l3, r3`

* release all
    * Releases all inputs (buttons, dpad, analog sticks)

### DPad commands
* press <parameter>
    * Presses the DPad in the specified direction for 500ms. Just the button name can also be used
    * Allowed parameters: `up, down, left, right, upleft, up left, upright, up right, downleft, down left, downright, down right`

* hold <parameter>
    * Holds the DPad in the specified direction
    * Allowed parameters: `up, down, left, right, upleft, up left, upright, up right, downleft, down left, downright, down right`

* release dpad
    * Releases the DPad completely

### Move commands
* move <parameter>
    * Moves the left analog stick in the specified direction for 500ms
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* move hold <parameter>
    * Holds the left analog stick in the specified direction
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* move release <parameter>
    * Aliases: *move rel, adjust release, adjust rel, adj rel*
    * Releases the left analog stick. If direction is specified, releases that direction only, otherwise releases completely
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* move adjust <parameter>
    * Aliases: *move adj*
    * Moves the left analog stick for 500ms
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* move adjust hold <parameter>
    * Holds the left analog stick halfway in the specified direction
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

### Look commands
* look <parameter>
    * Moves the right analog stick in the specified direction for 500ms
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* look hold <parameter>
    * Holds the right analog stick in the specified direction
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* look release <parameter>
    * Aliases: *look rel, look adjust release, look adj rel*
    * Releases the right analog stick. If direction is specified, releases that direction only, otherwise releases completely
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* look adjust <parameter>
    * Aliases: *look adj*
    * Moves the right analog stick for 500ms
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

* look adjust hold <parameter>
    * Aliases: *look adj hold*
    * Holds the right analog stick halfway in the specified direction
    * Allowed parameters: `up, forward, down, backward, back, left, right, upright, up right, upleft, up left, downright, down right, downleft, down left`

### Other commands
* wait
    * Does nothing for 1000ms

* longwait
    * Does nothing for 2000ms

### Game-specific commands
* sphere bomb
    * Switches to the sphere bomb rune

* cube bomb
    * Switches to the cube bomb rune

* magnesis
    * Switches to the magnesis rune

* stasis
    * Switches to the stasis rune

* cryonis
    * Switches to the cryonis rune

* camera
    * Switches to the camera rune

* turn 180
    * Turns around 180 degrees

* next weapon
    * Aliases: *next wep*
    * Switches to the next weapon

* previous weapon
    * Aliases: *previous wep, prev weapon, prev wep*
    * Switches to the previous weapon

* next shield
    * Aliases: *next arrow*
    * Switches to the next shield. If a bow is equipped, switches to the next arrow instead.

* previous shield
    * Aliases: *prev shield, previous arrow, prev arrow*
    * Switches to the previous shield. If a bow is equipped, switches to the previous arrow instead.

* save
    * Saves the game.

