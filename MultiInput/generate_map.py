import sys

from mapping_generator import *
from custom_commands import gen_custom_commands

button_map = {
	'a': BUTTON_A,
	'b': BUTTON_B,
	'x': BUTTON_X,
	'y': BUTTON_Y,
	'l': BUTTON_L,
	'r': BUTTON_R,
	'zl': BUTTON_ZL,
	'zr': BUTTON_ZR,
	'minus': BUTTON_MINUS,
	'plus': BUTTON_PLUS,
	'l3': BUTTON_LCLICK,
	'r3': BUTTON_RCLICK,
	#'home': BUTTON_HOME,
	#'capture': BUTTON_CAPTURE
}

dpad_map = {
	'up': DPAD_UP,
	'down': DPAD_DOWN,
	'left': DPAD_LEFT,
	'right': DPAD_RIGHT,
	'upleft': DPAD_UP_LEFT,
	'upright': DPAD_UP_RIGHT,
	'downleft': DPAD_DOWN_LEFT,
	'downright': DPAD_DOWN_RIGHT
}

move_map = {
	'up': (None, STICK_MIN),
	'down': (None, STICK_MAX),
	'left': (STICK_MIN, None),
	'right': (STICK_MAX, None),
	'upright': (STICK_MAX, STICK_MIN),
	'upleft': (STICK_MIN, STICK_MIN),
	'downright': (STICK_MAX, STICK_MAX),
	'downleft': (STICK_MIN, STICK_MAX),
}

adjust_map = {
	'up': (None, 64),
	'down': (None, 192),
	'left': (64, None),
	'right': (192, None),
	'upright': (192, 64),
	'upleft': (64, 64),
	'downright': (192, 192),
	'downleft': (64, 192),
}

button_aliases = {
	'l': ['lb', 'l1'],
	'r': ['rb', 'r1'],
	'zl': ['lt', 'l2'],
	'zr': ['rt', 'r2'],
	'upleft': ['up left'],
	'upright': ['up right'],
	'downleft': ['down left'],
	'downright': ['down right'],
	'minus' : ['-'],
	'plus': ['+']
}

move_aliases = {
	'up': ['forward'],
	'down': ['backward', 'back'],
	'upright': ['up right'],
	'upleft': ['up left'],
	'downright': ['down right'],
	'downleft': ['down left']
}

prefix_aliases = {
	'press': [''],
	'release': ['rel'],
	'move adjust': ['move adj'],
	'move release': ['move rel', 'adjust release', 'adjust rel', 'adj rel'],
	'adjust': ['adj'],
	'adjust hold': ['adj hold'],
	'look release': ['look rel', 'look adjust release', 'look adj rel'],
	'look adjust': ['look adj'],
	'look adjust hold': ['look adj hold'],
}
suffix_aliases = {}

def expand_alias(button, prefix=None, suffix=None, is_movement=False):
	all_prefixes = [prefix] + prefix_aliases.get(prefix, [])
	all_suffixes = [suffix] + suffix_aliases.get(suffix, [])
	all_button_aliases = [button] + (button_aliases.get(button, []) if not is_movement else move_aliases.get(button, []))

	all_aliases = []

	for prefix_alias in all_prefixes:
		for suffix_alias in all_suffixes:
			for button_alias in all_button_aliases:
				output = ''
				if prefix_alias:
					output += prefix_alias + ' '
				output += button_alias
				if suffix_alias:
					output += ' ' + suffix_alias
				all_aliases.append(output)
	return all_aliases

def gen_button_commands():
	commands = []
	allowed = []
	for button in button_map:
		allowed += expand_alias(button)
		button_val = button_map[button]

		commands.append(ControllerCommand(expand_alias(button, prefix='press')).press_buttons(button_val))
		commands.append(ControllerCommand(expand_alias(button, prefix='hold')).hold_buttons(button_val))
		commands.append(ControllerCommand(expand_alias(button, prefix='release')).release_buttons(button_val))

	command = ControllerCommand(['release', 'rel', 'release all', 'rel all'])
	clear_state = ControllerTransition()
	clear_state.lx = STICK_CENTER
	clear_state.ly = STICK_CENTER
	clear_state.rx = STICK_CENTER
	clear_state.ry = STICK_CENTER
	clear_state.buttons_pressed = BUTTON_NONE
	clear_state.buttons_released = BUTTON_ALL
	clear_state.dpad = DPAD_NONE
	clear_state.delay = 1
	command.add_state(clear_state)
	commands.append(command)

	cmd_help = [
		CommandHelp(
			name='press',
			text='Presses the specified button for %dms. Just the button name can also be used' % delay_to_ms(LOOK_DELAY),
			aliases=None,
			allowed=allowed
		),
		CommandHelp(
			name='hold',
			text='Holds the specified button',
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='release',
			text='Releases the specified button',
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='release all',
			text='Releases all inputs (buttons, dpad, analog sticks)',
			aliases=['release', 'rel', 'release all', 'rel all'],
			allowed=None
		)
	]
	return 'Button commands', commands, cmd_help

def gen_dpad_commands():
	commands = []
	allowed = []
	for dpad in dpad_map:
		allowed += expand_alias(dpad)
		dpad_val = dpad_map[dpad]

		commands.append(ControllerCommand(expand_alias(dpad, prefix='press')).press_dpad(dpad_val))
		commands.append(ControllerCommand(expand_alias(dpad, prefix='hold')).hold_dpad(dpad_val))

	commands.append(ControllerCommand(expand_alias('dpad', prefix='release')).release_dpad())

	cmd_help = [
		CommandHelp(
			name='press',
			text='Presses the DPad in the specified direction for %dms. Just the button name can also be used' % delay_to_ms(LOOK_DELAY),
			aliases=None,
			allowed=allowed
		),
		CommandHelp(
			name='hold',
			text='Holds the DPad in the specified direction',
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='release dpad',
			text='Releases the DPad completely',
			aliases=prefix_aliases,
			allowed=None
		)
	]
	return 'DPad commands', commands, cmd_help

def gen_move_commands():
	commands = []
	allowed = []
	for move in move_map:
		allowed += expand_alias(move, is_movement=True)
		move_val = move_map[move]
		adjust_val = adjust_map[move]

		commands.append(ControllerCommand(expand_alias(move, prefix='move', is_movement=True)).move_stick(STICK_LEFT, move_val[0], move_val[1], delay=MOVE_DELAY))
		commands.append(ControllerCommand(expand_alias(move, prefix='move hold', is_movement=True)).hold_stick(STICK_LEFT, move_val[0], move_val[1]))
		commands.append(ControllerCommand(expand_alias(move, prefix='move release', is_movement=True)).release_stick(STICK_LEFT, move_val[0], move_val[1]))

		commands.append(ControllerCommand(expand_alias(move, prefix='adjust', is_movement=True)).move_stick(STICK_LEFT, move_val[0], move_val[1], delay=ADJUST_DELAY))
		commands.append(ControllerCommand(expand_alias(move, prefix='adjust hold', is_movement=True)).hold_stick(STICK_LEFT, adjust_val[0], adjust_val[1]))

		commands.append(ControllerCommand(expand_alias('', prefix='move release', is_movement=True)).release_stick(STICK_LEFT, STICK_CENTER, STICK_CENTER))
	
	cmd_help = [
		CommandHelp(
			name='move',
			text='Moves the left analog stick in the specified direction for %dms' % delay_to_ms(LOOK_DELAY),
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='move hold',
			text='Holds the left analog stick in the specified direction',
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='move release',
			text='Releases the left analog stick. If direction is specified, releases that direction only, otherwise releases completely',
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='move adjust',
			text='Moves the left analog stick for %dms' % delay_to_ms(LOOK_DELAY),
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='move adjust hold',
			text='Holds the left analog stick halfway in the specified direction',
			aliases=prefix_aliases,
			allowed=allowed
		),
	]
	return 'Move commands', commands, cmd_help

def gen_look_commands():
	commands = []
	allowed = []
	for move in move_map:
		allowed += expand_alias(move, is_movement=True)
		move_val = move_map[move]
		adjust_val = adjust_map[move]

		commands.append(ControllerCommand(expand_alias(move, prefix='look', is_movement=True)).move_stick(STICK_RIGHT, move_val[0], move_val[1], delay=LOOK_DELAY))
		commands.append(ControllerCommand(expand_alias(move, prefix='look hold', is_movement=True)).hold_stick(STICK_RIGHT, move_val[0], move_val[1]))
		commands.append(ControllerCommand(expand_alias(move, prefix='look release', is_movement=True)).release_stick(STICK_RIGHT, move_val[0], move_val[1]))

		commands.append(ControllerCommand(expand_alias(move, prefix='look adjust', is_movement=True)).move_stick(STICK_RIGHT, move_val[0], move_val[1], delay=ADJUST_DELAY))
		commands.append(ControllerCommand(expand_alias(move, prefix='look adjust hold', is_movement=True)).hold_stick(STICK_RIGHT, adjust_val[0], adjust_val[1]))

		commands.append(ControllerCommand(expand_alias('', prefix='look release', is_movement=True)).release_stick(STICK_RIGHT, STICK_CENTER, STICK_CENTER))
	
	cmd_help = [
		CommandHelp(
			name='look',
			text='Moves the right analog stick in the specified direction for %dms' % delay_to_ms(LOOK_DELAY),
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='look hold',
			text='Holds the right analog stick in the specified direction',
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='look release',
			text='Releases the right analog stick. If direction is specified, releases that direction only, otherwise releases completely',
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='look adjust',
			text='Moves the right analog stick for %dms' % delay_to_ms(LOOK_DELAY),
			aliases=prefix_aliases,
			allowed=allowed
		),
		CommandHelp(
			name='look adjust hold',
			text='Holds the right analog stick halfway in the specified direction',
			aliases=prefix_aliases,
			allowed=allowed
		),
	]
	return 'Look commands', commands, cmd_help

def gen_other_commands():
	commands = []

	WAIT_DELAY = 128
	LONGWAIT_DELAY = 256

	command = ControllerCommand(['wait'])
	with command.hold_stick(STICK_LEFT, None, None, delay=WAIT_DELAY):
		pass
	commands.append(command)

	command = ControllerCommand(['longwait'])
	with command.hold_stick(STICK_LEFT, None, None, delay=LONGWAIT_DELAY):
		pass
	commands.append(command)

	cmd_help = [
		CommandHelp(
			name='wait',
			text='Does nothing for %dms' % delay_to_ms(WAIT_DELAY),
			aliases=None,
			allowed=None
		),
		CommandHelp(
			name='longwait',
			text='Does nothing for %dms' % delay_to_ms(LONGWAIT_DELAY),
			aliases=None,
			allowed=None
		),
	]
	return 'Other commands', commands, cmd_help

def main():
	generators = [gen_button_commands, gen_dpad_commands, gen_move_commands, gen_look_commands, gen_other_commands, gen_custom_commands]
	commands = []
	cmd_help = {}

	for generator in generators:
		res_name, res_cmds, res_help = generator()
		commands += res_cmds
		cmd_help[res_name] = res_help

	with open('output.txt', 'w') as f:
		for command in commands:
			f.write(str(command) + '\n')
	print('%d commands generated' % len(commands))

	with open('help.md', 'w') as f:
		f.write('---\nlayout: help\n---\n\n')
		for c_help in cmd_help:
			print('### ' + c_help)
			f.write('### ' + c_help + '\n')
			for h in cmd_help[c_help]:
				print(h)
				f.write(str(h) + '\n')


if __name__ == '__main__':
	main()