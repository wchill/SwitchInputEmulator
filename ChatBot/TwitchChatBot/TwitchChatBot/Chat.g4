grammar Chat;

command_list
	: command (',' command)*
	;

command
	: command_press
	| command_move
	| command_release
	| command_move
	| command_move_adj
	| command_move_rel
	| command_look
	| command_peek
	| command_look_rel
	;

command_press
	: 'press'? press_for
	| 'press'? '(' press_for (',' press_for)* ')'
	;

command_move
	: 'move' direction_for
	| 'move' '(' direction_for (',' direction_for)* ')'
	;

command_release
	: ('rel' | 'release') (button | dpad)*
	;

command_move_adj
	: 'move'? ('adj' | 'adjust') direction_for
	| 'move'? ('adj' | 'adjust') '(' direction_for (',' direction_for)* ')'
	;

command_move_rel
	: 'move' (('rel' | 'release') direction*)?
	| 'move'? ('adj' | 'adjust') (('rel' | 'release') direction*)?
	;

command_look
	: 'look' direction_for
	| 'look' '(' direction_for (',' direction_for)* ')'
	;

command_peek
	: 'peek' direction_for
	| 'peek' '(' direction_for (',' direction_for)* ')'
	;

command_look_rel
	: ('look' | 'peek') (('rel' | 'release') direction*)?
	;

press_for
	: (button | dpad)+ (REPEAT_COUNT | HOLD)?
	;

direction_for
	: direction+ (DURATION | HOLD)?
	;

button
	: BUTTON_A
	| BUTTON_B
	| BUTTON_X
	| BUTTON_Y
	| BUTTON_L
	| BUTTON_R
	| BUTTON_ZL
	| BUTTON_ZR
	| BUTTON_L3
	| BUTTON_R3
	| BUTTON_PLUS
	| BUTTON_MINUS
	;

dpad
	: UP
	| DOWN
	| LEFT
	| RIGHT
	;

direction
	: UP LEFT
	| UP RIGHT
	| DOWN LEFT
	| DOWN RIGHT
	| UP
	| DOWN
	| LEFT
	| RIGHT
	;

BUTTON_A: 'a' ;
BUTTON_B: 'b' ;
BUTTON_X: 'x' ;
BUTTON_Y: 'y' ;
BUTTON_L: 'l' ;
BUTTON_R: 'r' ;
BUTTON_ZL: 'zl' ;
BUTTON_ZR: 'zr' ;
BUTTON_L3: 'l3' ;
BUTTON_R3: 'r3' ;
BUTTON_PLUS: 'plus' | 'start' ;
BUTTON_MINUS: 'minus' | 'select' ;

UP: 'up' ;
DOWN: 'down' ;
LEFT: 'left' ;
RIGHT: 'right' ; 
FORWARD: 'forward' ;
BACKWARD: 'backward' | 'back' ;

REPEAT_COUNT: [0-9]'x' ;

DURATION: [0-9]* '.'? [0-9]+ ;

HOLD: 'hold' ;

WS : [ \t\r\n]+ -> skip ; // skip spaces, tabs, newlines