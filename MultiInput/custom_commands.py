from mapping_generator import *

def gen_rune_commands():
	commands = []
	cmd_help = []
	runes = ['sphere bomb', 'cube bomb', 'magnesis', 'stasis', 'cryonis', 'camera']
	for index, rune in enumerate(runes):
		command = ControllerCommand([rune])
		with command.hold_dpad(DPAD_UP, delay=PRESS_DELAY):
			command.move_stick(STICK_RIGHT, STICK_MIN, STICK_CENTER, delay=128)
			for _ in range(index):
				command.press_buttons(BUTTON_R)
		commands.append(command)
		cmd_help.append(
			CommandHelp(
				name=rune,
				text='Switches to the %s rune' % rune,
				aliases=None,
				allowed=None
			),
		)
	return commands, cmd_help

def gen_snowball():
	commands = []
	cmd_help = []

	command = ControllerCommand(['snowball'])
	command.press_buttons(BUTTON_A, delay=18, release_delay=93)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_A, delay=18, release_delay=48)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_A, delay=18, release_delay=48)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)

	command.press_buttons(BUTTON_A, delay=18, release_delay=978)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_A, delay=18, release_delay=153)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_A, delay=18, release_delay=48)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_A, delay=18, release_delay=303)
	command.press_buttons(BUTTON_A, delay=18, release_delay=453)

	command.press_buttons(BUTTON_A, delay=18, release_delay=153)
	command.hold_stick(STICK_LEFT, STICK_MIN, STICK_CENTER, delay=129)
	command.hold_stick(STICK_LEFT, STICK_CENTER, STICK_MIN, delay=243)

	state = ControllerTransition()
	state.ly = STICK_MIN
	state.buttons_pressed = BUTTON_R
	state.delay = 78
	command.add_state(state)

	state = ControllerTransition()
	state.ly = STICK_CENTER
	state.buttons_released = BUTTON_R
	state.delay = 93
	command.add_state(state)

	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_B, delay=18, release_delay=48)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_B, delay=18, release_delay=1353)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.press_buttons(BUTTON_B, delay=18, release_delay=63)
	command.move_stick(STICK_LEFT, STICK_CENTER, STICK_MAX, delay=33, release_delay=63)
	command.press_buttons(BUTTON_A, delay=18, release_delay=153)
	command.hold_stick(STICK_LEFT, STICK_CENTER, STICK_MIN, delay=33)

	state = ControllerTransition()
	state.ly = STICK_MIN
	state.buttons_pressed = BUTTON_R
	state.delay = 78
	command.add_state(state)

	state = ControllerTransition()
	state.ly = STICK_CENTER
	state.buttons_released = BUTTON_R
	state.delay = 528
	command.add_state(state)

	for _ in range(35):
		command.press_buttons(BUTTON_B, delay=18, release_delay=63)

	total = 0
	for c in command.transitions:
		total += c.delay
		print(c.delay)
	print(total)

	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='snowball',
			text='Cheeses the snowball game',
			aliases=None,
			allowed=None
		),
	)

	return commands, cmd_help

def gen_custom_commands():
	commands = []
	cmd_help = []

	rune_commands, rune_help = gen_rune_commands()
	commands += rune_commands
	cmd_help += rune_help

	snowball_commands, snowball_help = gen_snowball()
	commands += snowball_commands
	cmd_help += snowball_help

	command = ControllerCommand(['turn 180'])
	command.move_stick(STICK_RIGHT, STICK_MAX, None, delay=256)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='turn 180',
			text='Turns around 180 degrees',
			aliases=None,
			allowed=None
		),
	)

	command = ControllerCommand(['turn right 90', 'turn right', 'turn r'])
	command.move_stick(STICK_RIGHT, STICK_MAX, None, delay=128)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='turn 180',
			text='Turns around 180 degrees',
			aliases=None,
			allowed=None
		),
	)

	command = ControllerCommand(['turn left 90', 'turn left', 'turn l'])
	command.move_stick(STICK_RIGHT, STICK_MIN, None, delay=128)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='turn left 90',
			text='Turns left 90 degrees',
			aliases=None,
			allowed=None
		),
	)

	command = ControllerCommand(['next weapon', 'next wep'])
	with command.hold_dpad(DPAD_RIGHT, delay=PRESS_DELAY):
		command.press_buttons(BUTTON_ZR)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='next weapon',
			text='Switches to the next weapon',
			aliases=['next wep'],
			allowed=None
		),
	)

	command = ControllerCommand(['previous weapon', 'previous wep', 'prev weapon', 'prev wep'])
	with command.hold_dpad(DPAD_RIGHT, delay=PRESS_DELAY):
		command.press_buttons(BUTTON_ZL)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='previous weapon',
			text='Switches to the previous weapon',
			aliases=['previous wep', 'prev weapon', 'prev wep'],
			allowed=None
		),
	)

	command = ControllerCommand(['next shield', 'next arrow'])
	with command.hold_dpad(DPAD_LEFT, delay=PRESS_DELAY):
		command.press_buttons(BUTTON_ZR)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='next shield',
			text='Switches to the next shield. If a bow is equipped, switches to the next arrow instead.',
			aliases=['next arrow'],
			allowed=None
		),
	)

	command = ControllerCommand(['previous shield', 'prev shield', 'previous arrow', 'prev arrow'])
	with command.hold_dpad(DPAD_LEFT, delay=PRESS_DELAY):
		command.press_buttons(BUTTON_ZL)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='previous shield',
			text='Switches to the previous shield. If a bow is equipped, switches to the previous arrow instead.',
			aliases=['prev shield', 'previous arrow', 'prev arrow'],
			allowed=None
		),
	)

	command = ControllerCommand(['save'])
	command.press_buttons(BUTTON_B)
	command.press_buttons(BUTTON_PLUS)
	command.press_buttons(BUTTON_R)
	command.press_buttons(BUTTON_R)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_buttons(BUTTON_A)
	command.press_dpad(DPAD_UP)
	command.press_buttons(BUTTON_A)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='save',
			text='Saves the game.',
			aliases=None,
			allowed=None
		),
	)

	command = ControllerCommand(['load'])
	command.press_buttons(BUTTON_B)
	command.press_buttons(BUTTON_PLUS)
	command.press_buttons(BUTTON_R)
	command.press_buttons(BUTTON_R)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_DOWN)
	command.press_buttons(BUTTON_A)
	command.press_dpad(DPAD_UP)
	command.press_dpad(DPAD_UP)
	command.press_buttons(BUTTON_A)
	command.press_dpad(DPAD_UP)
	command.press_buttons(BUTTON_A)
	commands.append(command)
	cmd_help.append(
		CommandHelp(
			name='load',
			text='Loads the game.',
			aliases=None,
			allowed=None
		),
	)

	return 'Game-specific commands', commands, cmd_help